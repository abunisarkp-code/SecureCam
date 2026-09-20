# SecureCam Signaling Server

Production-ready, lightweight WebRTC signaling and device registry server for the **SecureCam** Android Security Camera system.

## Features
- **Zero Video Relay Storage**: Live camera video is never stored on the server. All video/audio streams flow peer-to-peer via WebRTC or direct encrypted TURN relays.
- **WebSocket & TLS**: Real-time bidirectional message exchange with JSON Web Token (JWT) cryptographic device authentication.
- **Dynamic QR & 6-Digit Pairing**: Secure camera authorization with short code fallback and QR-encoded cryptographic token.
- **Heartbeat & Telemetry**: Relays camera status (battery percentage, charging state, active recording, motion alarms, network quality).
- **Remote Camera RPC**: Relays authenticated commands from Monitor to Camera (start/stop recording, snap high-res photo, flip camera lens, toggle two-way talk audio).

## Quick Start (Local Development)

```bash
cd securecam-server
npm install
npm run dev
```

The server will start at `http://0.0.0.0:8080` (WebSocket at `ws://0.0.0.0:8080`).

## Production Deployment (Linux / Cloud VPS)

### 1. Environment Variables
Copy `.env.example` to `.env` and fill in your values:

```env
PORT=8080
HOST=0.0.0.0
NODE_ENV=production
JWT_SECRET=use_a_very_strong_random_32_character_secret_key_here
STUN_SERVER=stun:stun.l.google.com:19302
TURN_SERVER=turn:your-coturn-domain.com:3478
TURN_USERNAME=securecam_user
TURN_PASSWORD=securecam_turn_password
```

### 2. Run with PM2 or Systemd

```bash
npm run build
npm install -g pm2
pm2 start dist/index.js --name "securecam-signaling"
pm2 save
```

### 3. Nginx Reverse Proxy & SSL (HTTPS/WSS)
Set up Nginx with Let's Encrypt SSL on port 443:

```nginx
server {
    server_name signaling.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/signaling.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/signaling.yourdomain.com/privkey.pem;
}
```

### 4. Setting up STUN / TURN (coturn)
For carrier NAT, firewalls, and mobile data (4G/5G) traversal, install `coturn`:

```bash
sudo apt update && sudo apt install coturn -y
```

Edit `/etc/turnserver.conf`:
```conf
listening-port=3478
fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=securecam_turn_password
realm=yourdomain.com
user=securecam_user:securecam_turn_password
```

Open UDP/TCP port 3478 and UDP ports 49152-65535 on your firewall.
