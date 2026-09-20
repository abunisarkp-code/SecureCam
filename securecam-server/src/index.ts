/**
 * SecureCam Signaling & Device Registry Server
 * 
 * Production-ready WebRTC signaling server implementing:
 * - Device registration (Camera vs. Monitor)
 * - Cryptographically signed JWT device tokens & secure pairing
 * - Dynamic QR / 6-digit short pairing code exchange
 * - Ephemeral WebRTC SDP Offer/Answer relay
 * - ICE Candidate exchange with STUN/TURN configuration
 * - Device presence & heartbeat telemetry (Battery, WiFi, Storage, Motion)
 * - Remote Camera Control RPC (Record, Snap, Audio, Zones)
 * 
 * IMPORTANT: This server NEVER touches, buffers, or stores live camera video.
 * All media streams flow directly peer-to-peer or via encrypted TURN relays.
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = process.env.HOST || '0.0.0.0';
const JWT_SECRET = process.env.JWT_SECRET || 'securecam_dev_secret_change_in_prod';
const STUN_SERVER = process.env.STUN_SERVER || 'stun:stun.l.google.com:19302';
const TURN_SERVER = process.env.TURN_SERVER || '';
const TURN_USERNAME = process.env.TURN_USERNAME || '';
const TURN_PASSWORD = process.env.TURN_PASSWORD || '';

interface DeviceSession {
  deviceId: string;
  role: 'camera' | 'monitor';
  cameraName?: string;
  ws: WebSocket;
  authenticated: boolean;
  pairedDeviceIds: Set<string>;
  batteryPercent?: number;
  isCharging?: boolean;
  isRecording?: boolean;
  motionDetected?: boolean;
  lastHeartbeat: number;
}

interface PendingPairing {
  code: string;
  cameraId: string;
  cameraName: string;
  secretToken: string;
  expiresAt: number;
}

// Active sessions mapped by deviceId
const activeSessions = new Map<string, DeviceSession>();
// Pending pairings mapped by 6-digit short code
const pendingPairings = new Map<string, PendingPairing>();

// HTTP server for health checks & STUN/TURN config endpoint
const server = http.createServer((req, res) => {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      activeDevices: activeSessions.size,
      cameras: Array.from(activeSessions.values()).filter(s => s.role === 'camera').length,
      monitors: Array.from(activeSessions.values()).filter(s => s.role === 'monitor').length,
      timestamp: Date.now()
    }));
    return;
  }

  if (req.url === '/api/ice-servers') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    const iceServers = [{ urls: STUN_SERVER }];
    if (TURN_SERVER) {
      iceServers.push({
        urls: TURN_SERVER,
        username: TURN_USERNAME,
        credential: TURN_PASSWORD
      } as any);
    }
    res.end(JSON.stringify({ iceServers }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

const wss = new WebSocketServer({ server });

function broadcastCameraState(cameraSession: DeviceSession) {
  const payload = JSON.stringify({
    type: 'CAMERA_STATUS_UPDATE',
    cameraId: cameraSession.deviceId,
    cameraName: cameraSession.cameraName,
    batteryPercent: cameraSession.batteryPercent,
    isCharging: cameraSession.isCharging,
    isRecording: cameraSession.isRecording,
    motionDetected: cameraSession.motionDetected,
    lastSeen: cameraSession.lastHeartbeat,
    online: true
  });

  for (const monitorId of cameraSession.pairedDeviceIds) {
    const monitor = activeSessions.get(monitorId);
    if (monitor && monitor.ws.readyState === WebSocket.OPEN) {
      monitor.ws.send(payload);
    }
  }
}

wss.on('connection', (ws: WebSocket, req) => {
  let currentSession: DeviceSession | null = null;

  ws.on('message', (data: Buffer | string) => {
    try {
      const message = JSON.parse(data.toString());
      const { type } = message;

      switch (type) {
        // Step 1: Device Registration & Auth
        case 'REGISTER_DEVICE': {
          const { deviceId, role, cameraName, token } = message;
          if (!deviceId || !role) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Missing deviceId or role' }));
            return;
          }

          // In production, tokens are validated against JWT_SECRET
          let isAuthenticated = false;
          if (token) {
            try {
              const decoded = jwt.verify(token, JWT_SECRET) as any;
              if (decoded.deviceId === deviceId) {
                isAuthenticated = true;
              }
            } catch {
              // Allow registration for unauthenticated pairing setup
              isAuthenticated = false;
            }
          }

          currentSession = {
            deviceId,
            role,
            cameraName: cameraName || (role === 'camera' ? 'Living Room Camera' : 'Monitor Device'),
            ws,
            authenticated: isAuthenticated,
            pairedDeviceIds: new Set(),
            lastHeartbeat: Date.now()
          };

          activeSessions.set(deviceId, currentSession);

          ws.send(JSON.stringify({
            type: 'REGISTERED',
            deviceId,
            role,
            authenticated: isAuthenticated,
            iceServers: [
              { urls: STUN_SERVER },
              ...(TURN_SERVER ? [{ urls: TURN_SERVER, username: TURN_USERNAME, credential: TURN_PASSWORD }] : [])
            ]
          }));

          if (role === 'camera') {
            broadcastCameraState(currentSession);
          }
          break;
        }

        // Step 2: Camera generates pairing code (QR or 6-digit)
        case 'CREATE_PAIRING_CODE': {
          if (!currentSession || currentSession.role !== 'camera') {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Only camera devices can generate pairing codes' }));
            return;
          }

          // Generate 6-digit numeric pairing code
          const shortCode = Math.floor(100000 + Math.random() * 900000).toString();
          // Generate cryptographically secure token for QR
          const secretToken = crypto.randomBytes(32).toString('hex');
          const pairingJwt = jwt.sign(
            { cameraId: currentSession.deviceId, secretToken, type: 'pairing' },
            JWT_SECRET,
            { expiresIn: '15m' }
          );

          pendingPairings.set(shortCode, {
            code: shortCode,
            cameraId: currentSession.deviceId,
            cameraName: currentSession.cameraName || 'SecureCam',
            secretToken,
            expiresAt: Date.now() + 15 * 60 * 1000
          });

          ws.send(JSON.stringify({
            type: 'PAIRING_CODE_CREATED',
            shortCode,
            qrPayload: JSON.stringify({
              v: 1,
              id: currentSession.deviceId,
              name: currentSession.cameraName,
              token: pairingJwt,
              signalingUrl: `wss://${req.headers.host || 'localhost:' + PORT}`
            }),
            expiresInSeconds: 900
          }));
          break;
        }

        // Step 3: Monitor verifies pairing code & pairs with camera
        case 'PAIR_WITH_CAMERA': {
          if (!currentSession || currentSession.role !== 'monitor') {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Only monitor devices can pair with cameras' }));
            return;
          }

          const { shortCode, qrToken } = message;
          let targetCameraId: string | null = null;
          let targetCameraName = 'Camera';

          if (shortCode) {
            const pending = pendingPairings.get(shortCode.trim());
            if (!pending || pending.expiresAt < Date.now()) {
              ws.send(JSON.stringify({ type: 'PAIRING_FAILED', message: 'Invalid or expired pairing code' }));
              return;
            }
            targetCameraId = pending.cameraId;
            targetCameraName = pending.cameraName;
            pendingPairings.delete(shortCode.trim());
          } else if (qrToken) {
            try {
              const decoded = jwt.verify(qrToken, JWT_SECRET) as any;
              targetCameraId = decoded.cameraId;
            } catch (e) {
              ws.send(JSON.stringify({ type: 'PAIRING_FAILED', message: 'Invalid QR pairing token' }));
              return;
            }
          }

          if (!targetCameraId) {
            ws.send(JSON.stringify({ type: 'PAIRING_FAILED', message: 'Missing pairing credential' }));
            return;
          }

          const cameraSession = activeSessions.get(targetCameraId);
          currentSession.pairedDeviceIds.add(targetCameraId);
          if (cameraSession) {
            cameraSession.pairedDeviceIds.add(currentSession.deviceId);
            targetCameraName = cameraSession.cameraName || targetCameraName;
          }

          // Generate long-lived authenticated auth token
          const permanentToken = jwt.sign(
            { deviceId: currentSession.deviceId, pairedCameraId: targetCameraId },
            JWT_SECRET,
            { expiresIn: '90d' }
          );

          ws.send(JSON.stringify({
            type: 'PAIRING_SUCCESS',
            cameraId: targetCameraId,
            cameraName: targetCameraName,
            authToken: permanentToken,
            isOnline: !!cameraSession
          }));

          if (cameraSession) {
            cameraSession.ws.send(JSON.stringify({
              type: 'MONITOR_PAIRED',
              monitorId: currentSession.deviceId
            }));
            broadcastCameraState(cameraSession);
          }
          break;
        }

        // Step 4: WebRTC Signaling - SDP Offer
        case 'WEBRTC_OFFER': {
          const { targetDeviceId, sdp } = message;
          const target = activeSessions.get(targetDeviceId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'WEBRTC_OFFER',
              senderDeviceId: currentSession?.deviceId,
              sdp
            }));
          }
          break;
        }

        // Step 5: WebRTC Signaling - SDP Answer
        case 'WEBRTC_ANSWER': {
          const { targetDeviceId, sdp } = message;
          const target = activeSessions.get(targetDeviceId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'WEBRTC_ANSWER',
              senderDeviceId: currentSession?.deviceId,
              sdp
            }));
          }
          break;
        }

        // Step 6: WebRTC Signaling - ICE Candidate
        case 'ICE_CANDIDATE': {
          const { targetDeviceId, candidate } = message;
          const target = activeSessions.get(targetDeviceId);
          if (target && target.ws.readyState === WebSocket.OPEN) {
            target.ws.send(JSON.stringify({
              type: 'ICE_CANDIDATE',
              senderDeviceId: currentSession?.deviceId,
              candidate
            }));
          }
          break;
        }

        // Step 7: Camera Telemetry & Motion Events
        case 'DEVICE_HEARTBEAT': {
          if (currentSession) {
            currentSession.lastHeartbeat = Date.now();
            currentSession.batteryPercent = message.batteryPercent;
            currentSession.isCharging = message.isCharging;
            currentSession.isRecording = message.isRecording;
            currentSession.motionDetected = message.motionDetected;
            if (currentSession.role === 'camera') {
              broadcastCameraState(currentSession);
            }
          }
          break;
        }

        // Step 8: Motion Alarm Alert
        case 'MOTION_ALERT': {
          if (currentSession && currentSession.role === 'camera') {
            const alertPayload = JSON.stringify({
              type: 'MOTION_DETECTED',
              cameraId: currentSession.deviceId,
              cameraName: currentSession.cameraName,
              timestamp: Date.now(),
              zoneName: message.zoneName || 'Full Frame',
              thumbnailUrl: message.thumbnailUrl
            });

            for (const monitorId of currentSession.pairedDeviceIds) {
              const monitor = activeSessions.get(monitorId);
              if (monitor && monitor.ws.readyState === WebSocket.OPEN) {
                monitor.ws.send(alertPayload);
              }
            }
          }
          break;
        }

        // Step 9: Remote Camera Control RPC (from Monitor to Camera)
        case 'REMOTE_COMMAND': {
          const { targetCameraId, command, params } = message;
          const camera = activeSessions.get(targetCameraId);
          if (camera && camera.ws.readyState === WebSocket.OPEN) {
            camera.ws.send(JSON.stringify({
              type: 'EXECUTE_COMMAND',
              senderMonitorId: currentSession?.deviceId,
              command,
              params
            }));
          }
          break;
        }
      }
    } catch (err) {
      console.error('Signaling error:', err);
    }
  });

  ws.on('close', () => {
    if (currentSession) {
      activeSessions.delete(currentSession.deviceId);
      if (currentSession.role === 'camera') {
        // Notify monitors that camera is offline
        const offlineMsg = JSON.stringify({
          type: 'CAMERA_STATUS_UPDATE',
          cameraId: currentSession.deviceId,
          cameraName: currentSession.cameraName,
          online: false,
          lastSeen: Date.now()
        });
        for (const monitorId of currentSession.pairedDeviceIds) {
          const monitor = activeSessions.get(monitorId);
          if (monitor && monitor.ws.readyState === WebSocket.OPEN) {
            monitor.ws.send(offlineMsg);
          }
        }
      }
    }
  });
});

server.listen(PORT, HOST, () => {
  console.log(`[SecureCam Signaling Server] Running on http://${HOST}:${PORT}`);
  console.log(`[SecureCam Signaling Server] WebSocket ready at ws://${HOST}:${PORT}`);
  console.log(`[SecureCam Signaling Server] STUN configured: ${STUN_SERVER}`);
});
