# SecureCam — Smart Android Security Camera & Monitor System

**SecureCam** turns an old Android phone into a high-performance, remotely controlled security camera and allows any modern Android device (or web browser) to act as the primary monitoring and control console.

The system connects seamlessly across different networks (same Wi-Fi, separate Wi-Fi networks, cellular data, carrier NAT) using **WebRTC**, **STUN/TURN**, and a secure WebSocket signaling server.

---

## System Architecture

```
                       [ STUN / TURN Relay ]
                                ▲
                                │ (NAT Traversal / Relayed Media)
                                ▼
 [ Camera Android Device ] ◄══[ WebRTC P2P ]══► [ Monitor Android Device ]
 (CameraX + Motion Detection)                    (Live View + Remote Controls)
          │                                                    │
          ▼ (WebSocket / TLS)                                  ▼ (WebSocket / TLS)
     ┌──────────────────────────────────────────────────────────────┐
     │           SecureCam Node.js Signaling Server                │
     │      (Authentication, Dynamic QR Pairing, Telemetry)         │
     │              * Zero Video Stored On Server *                 │
     └──────────────────────────────────────────────────────────────┘
```

---

## 1. Project Directory Overview

- **`/android`**: Complete Android Studio project (Kotlin, Jetpack Compose, CameraX, Room, WebRTC, Media3/ExoPlayer, Foreground Monitoring Service).
- **`/securecam-server`**: Standalone Node.js & TypeScript WebSocket signaling and authentication server.
- **`/src`**: Web-based SecureCam Live Simulator & Management Hub with full browser webcam motion analysis, WebRTC loopback, zones editor, recording buffer, and source code viewer.

---

## 2. Building & Running the Android App

### Prerequisites
- **Android Studio**: Ladybug / Meerkat (2024.2+) or later
- **JDK**: Java 17
- **Target SDK**: Android 15 (API 35) | **Min SDK**: Android 8.0 (API 26)
- **Devices**: 2 Android phones (one for Camera, one for Monitor)

### Setup in Android Studio
1. Open Android Studio and select **Open**, then navigate to the `/android` folder.
2. Wait for Gradle sync to complete. Gradle will download dependencies (CameraX, WebRTC, Room, Compose).
3. Connect your first Android phone (to be used as the **Camera**).
4. Run the app (`app` configuration).
5. Connect your second Android phone (to be used as the **Monitor**).
6. Run the app again.

---

## 3. Initial Setup & Pairing Flow

### Phone 1: Setup as Camera
1. On the first launch screen, select **SET UP AS CAMERA**.
2. Grant **Camera**, **Microphone**, and **Notification** permissions when prompted.
3. Choose camera orientation (**Back Camera** or **Front Camera**).
4. Select desired stream resolution (**720p HD** or **1080p Full HD**) and FPS (**30 FPS**).
5. Name your camera (e.g., *"Living Room Camera"* or *"Front Porch"*).
6. SecureCam generates a **Secure QR Pairing Code** and a **6-digit pairing code fallback**.
7. Tap **START MONITORING**. A persistent Android foreground notification will appear: *"SecureCam is Monitoring"*.

### Phone 2: Setup as Monitor
1. On the first launch screen, select **SET UP AS MONITOR**.
2. Tap **ADD CAMERA**.
3. Select **SCAN QR CODE** and point the monitor phone at Phone 1's screen (or enter the 6-digit code).
4. The devices exchange cryptographic tokens validated by the signaling server.
5. Device credentials are encrypted with AES-256-GCM and stored inside the **Android Keystore**.
6. Phone 1 will now appear on your **MY CAMERAS** dashboard!

---

## 4. Running the Signaling Server

The signaling server coordinates device presence, QR authentication, and WebRTC SDP offers/answers. It **never** buffers or stores camera video.

```bash
cd securecam-server
npm install
npm run build
npm start
```

### Environment Configuration (`securecam-server/.env`)
```env
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=generate_a_random_32_character_secret_key
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:turn.yourdomain.com:3478
TURN_USERNAME=securecam_user
TURN_PASSWORD=securecam_password
```

---

## 5. Background Operation & Battery Optimization

Android places restrictions on background camera execution to protect user privacy. To ensure continuous 24/7 monitoring on the camera device:

1. **Persistent Foreground Service**: SecureCam runs an official Android Foreground Service (`FOREGROUND_SERVICE_TYPE_CAMERA` and `FOREGROUND_SERVICE_TYPE_MICROPHONE`) displaying an ongoing notification.
2. **Battery Optimization Exemption**:
   - Go to Android Settings > **Apps** > **SecureCam** > **Battery**.
   - Select **Unrestricted** (prevents Android Doze from putting the camera CPU to sleep).
3. **Keep Plugged In**: It is strongly recommended to keep the Camera phone connected to power.
4. **Auto-Start on Boot**: Enable *"Start Monitoring After Reboot"* in SecureCam Settings so the camera resumes monitoring automatically if the phone restarts.

---

## 6. Remote Camera Controls & Two-Way Audio

From the Monitor screen, you can:
- **Watch Live Video**: Real-time WebRTC stream with latency, FPS, and bitrate stats.
- **Two-Way Audio (TALK)**: Hold the **TALK** button to transmit your voice to the camera phone's loudspeaker.
- **Remote Snap & Record**: Trigger photos and high-definition video recordings saved to the camera device.
- **Visual Motion Zones**: Draw bounding boxes on the camera feed (e.g., monitor doorway, ignore TV movement).
- **Pre-Motion Rolling Buffer**: Configurable 10-second rolling buffer prepended to motion video recordings so you never miss what caused the trigger.
- **Storage Auto-Purge**: Set storage limits (10GB, 20GB, etc.). Oldest unprotected recordings are automatically deleted when space is needed.
