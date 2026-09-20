import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

interface ClientMessage {
  roomId: string;
  fromDeviceId: string;
  toDeviceId?: string;
  type: string;
  payload?: any;
  timestamp: number;
}

interface RoomDevice {
  deviceId: string;
  role: 'CAMERA' | 'MONITOR';
  name: string;
  ws?: WebSocket;
  lastSeen: number;
  battery?: number;
  isCharging?: boolean;
}

interface RoomState {
  roomId: string;
  camera?: RoomDevice;
  monitors: Map<string, RoomDevice>;
  messages: ClientMessage[];
}

const rooms = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  const cleanId = roomId.replace(/\s+/g, '');
  if (!rooms.has(cleanId)) {
    rooms.set(cleanId, {
      roomId: cleanId,
      monitors: new Map(),
      messages: [],
    });
  }
  return rooms.get(cleanId)!;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS for dev convenience
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // --- Signaling API Endpoints ---
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      roomsCount: rooms.size,
      uptime: process.uptime(),
    });
  });

  // Register device in a room
  app.post('/api/signaling/register', (req, res) => {
    const { roomId, deviceId, role, name, battery, isCharging } = req.body;
    if (!roomId || !deviceId || !role) {
      res.status(400).json({ error: 'Missing roomId, deviceId, or role' });
      return;
    }

    const room = getOrCreateRoom(roomId);
    const device: RoomDevice = {
      deviceId,
      role,
      name: name || (role === 'CAMERA' ? 'SecureCam Camera' : 'Monitor Device'),
      lastSeen: Date.now(),
      battery,
      isCharging,
    };

    if (role === 'CAMERA') {
      room.camera = device;
    } else {
      room.monitors.set(deviceId, device);
    }

    res.json({
      success: true,
      roomId: room.roomId,
      cameraOnline: Boolean(room.camera && Date.now() - room.camera.lastSeen < 30000),
      cameraName: room.camera?.name,
    });
  });

  // Get room info / camera status
  app.get('/api/signaling/room/:roomId', (req, res) => {
    const cleanId = req.params.roomId.replace(/\s+/g, '');
    const room = rooms.get(cleanId);
    if (!room || !room.camera) {
      res.json({ exists: false, cameraOnline: false });
      return;
    }

    const isOnline = Date.now() - room.camera.lastSeen < 35000;
    res.json({
      exists: true,
      roomId: cleanId,
      cameraOnline: isOnline,
      cameraName: room.camera.name,
      battery: room.camera.battery,
      isCharging: room.camera.isCharging,
      lastSeen: room.camera.lastSeen,
    });
  });

  // Send signaling message (Offer, Answer, ICE candidate, Command)
  app.post('/api/signaling/send', (req, res) => {
    const { roomId, fromDeviceId, toDeviceId, type, payload } = req.body;
    if (!roomId || !fromDeviceId || !type) {
      res.status(400).json({ error: 'Missing required signaling fields' });
      return;
    }

    const room = getOrCreateRoom(roomId);
    const message: ClientMessage = {
      roomId: room.roomId,
      fromDeviceId,
      toDeviceId,
      type,
      payload,
      timestamp: Date.now(),
    };

    // Store in message backlog (keep last 50)
    room.messages.push(message);
    if (room.messages.length > 50) {
      room.messages.shift();
    }

    // Update sender last seen
    if (room.camera && room.camera.deviceId === fromDeviceId) {
      room.camera.lastSeen = Date.now();
      if (payload?.battery !== undefined) room.camera.battery = payload.battery;
      if (payload?.isCharging !== undefined) room.camera.isCharging = payload.isCharging;
    } else if (room.monitors.has(fromDeviceId)) {
      room.monitors.get(fromDeviceId)!.lastSeen = Date.now();
    }

    // Relay immediately to active WebSocket if connected
    let relayedCount = 0;
    const targetWsList: WebSocket[] = [];
    if (toDeviceId) {
      if (room.camera && room.camera.deviceId === toDeviceId && room.camera.ws) {
        targetWsList.push(room.camera.ws);
      }
      const targetMon = room.monitors.get(toDeviceId);
      if (targetMon?.ws) {
        targetWsList.push(targetMon.ws);
      }
    } else {
      // Broadcast to other peers in the room
      if (room.camera && room.camera.deviceId !== fromDeviceId && room.camera.ws) {
        targetWsList.push(room.camera.ws);
      }
      for (const [monId, mon] of room.monitors.entries()) {
        if (monId !== fromDeviceId && mon.ws) {
          targetWsList.push(mon.ws);
        }
      }
    }

    for (const ws of targetWsList) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        relayedCount++;
      }
    }

    res.json({ success: true, relayedViaWs: relayedCount });
  });

  // Long poll for messages (failsafe for networks where WebSockets are blocked)
  app.get('/api/signaling/messages', (req, res) => {
    const roomId = (req.query.roomId as string || '').replace(/\s+/g, '');
    const deviceId = req.query.deviceId as string || '';
    const since = parseInt(req.query.since as string || '0', 10);

    if (!roomId || !deviceId) {
      res.status(400).json({ error: 'Missing roomId or deviceId' });
      return;
    }

    const room = getOrCreateRoom(roomId);
    // Filter messages directed to this device or broadcast (no toDeviceId)
    const newMessages = room.messages.filter(
      (m) =>
        m.timestamp > since &&
        m.fromDeviceId !== deviceId &&
        (!m.toDeviceId || m.toDeviceId === deviceId)
    );

    res.json({ messages: newMessages, serverTime: Date.now() });
  });

  // WebSocket Server setup on same HTTP instance
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoomId: string | null = null;
    let currentDeviceId: string | null = null;

    ws.on('message', (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString());
        const { action, roomId, deviceId, role, name, toDeviceId, type, payload } = data;

        if (action === 'JOIN' && roomId && deviceId) {
          const room = getOrCreateRoom(roomId);
          currentRoomId = room.roomId;
          currentDeviceId = deviceId;

          const dev: RoomDevice = {
            deviceId,
            role: role || 'MONITOR',
            name: name || 'Device',
            ws,
            lastSeen: Date.now(),
          };

          if (role === 'CAMERA') {
            room.camera = dev;
          } else {
            room.monitors.set(deviceId, dev);
          }

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'JOINED_ACK',
                roomId: room.roomId,
                cameraOnline: Boolean(room.camera && Date.now() - room.camera.lastSeen < 35000),
                cameraName: room.camera?.name,
              })
            );
          }
          return;
        }

        if (action === 'SIGNAL' && roomId && deviceId && type) {
          const room = getOrCreateRoom(roomId);
          const message: ClientMessage = {
            roomId: room.roomId,
            fromDeviceId: deviceId,
            toDeviceId,
            type,
            payload,
            timestamp: Date.now(),
          };

          room.messages.push(message);
          if (room.messages.length > 50) room.messages.shift();

          // Relay to recipients
          if (toDeviceId) {
            if (room.camera?.deviceId === toDeviceId && room.camera.ws?.readyState === WebSocket.OPEN) {
              room.camera.ws.send(JSON.stringify(message));
            }
            const mon = room.monitors.get(toDeviceId);
            if (mon?.ws?.readyState === WebSocket.OPEN) {
              mon.ws.send(JSON.stringify(message));
            }
          } else {
            if (room.camera?.deviceId !== deviceId && room.camera?.ws?.readyState === WebSocket.OPEN) {
              room.camera.ws.send(JSON.stringify(message));
            }
            for (const [monId, mon] of room.monitors) {
              if (monId !== deviceId && mon.ws?.readyState === WebSocket.OPEN) {
                mon.ws.send(JSON.stringify(message));
              }
            }
          }
        }
      } catch (err) {
        console.error('WebSocket message parsing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoomId && currentDeviceId) {
        const room = rooms.get(currentRoomId);
        if (room) {
          if (room.camera?.deviceId === currentDeviceId) {
            room.camera.ws = undefined;
          }
          if (room.monitors.has(currentDeviceId)) {
            const mon = room.monitors.get(currentDeviceId);
            if (mon) mon.ws = undefined;
          }
        }
      }
    });
  });

  // Vite middleware in dev; static file server in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SecureCam Full-Stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
