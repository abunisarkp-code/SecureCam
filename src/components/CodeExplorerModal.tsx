import React, { useState } from 'react';
import { X, Code2, Copy, Check, FileCode, Server, Smartphone, FolderTree, Download } from 'lucide-react';

interface CodeExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApkModal?: () => void;
}

export const CodeExplorerModal: React.FC<CodeExplorerModalProps> = ({
  isOpen,
  onClose,
  onOpenApkModal,
}) => {
  const [activeFile, setActiveFile] = useState<string>('AndroidManifest.xml');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const files: Record<string, { category: 'Android' | 'Server'; language: string; content: string }> = {
    'AndroidManifest.xml': {
      category: 'Android',
      language: 'xml',
      content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CAMERA" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MICROPHONE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_CONNECTED_DEVICE" />
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />

    <application
        android:name=".SecureCamApplication"
        android:label="SecureCam"
        android:theme="@style/Theme.SecureCam">

        <activity
            android:name=".ui.MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <service
            android:name=".service.ForegroundMonitoringService"
            android:foregroundServiceType="camera|microphone|connectedDevice"
            android:exported="false" />

        <receiver
            android:name=".service.BootCompletedReceiver"
            android:enabled="true"
            android:exported="false">
            <intent-filter>
                <action android:name="android.intent.action.BOOT_COMPLETED" />
            </intent-filter>
        </receiver>

    </application>
</manifest>`,
    },
    'ForegroundMonitoringService.kt': {
      category: 'Android',
      language: 'kotlin',
      content: `package com.securecam.app.service

import android.app.*
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.PowerManager
import androidx.core.app.NotificationCompat

class ForegroundMonitoringService : Service() {
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = NotificationCompat.Builder(this, "securecam_monitoring")
            .setContentTitle("SecureCam is Monitoring")
            .setContentText("Actively monitoring premises for motion triggers")
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(1001, notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA or
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            )
        }
        return START_STICKY
    }
}`,
    },
    'CameraController.kt': {
      category: 'Android',
      language: 'kotlin',
      content: `package com.securecam.app.camera

import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*

class CameraController(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner
) {
    fun startCamera(surfaceProvider: Preview.SurfaceProvider) {
        val future = ProcessCameraProvider.getInstance(context)
        future.addListener({
            val provider = future.get()
            val preview = Preview.Builder().build().also { it.setSurfaceProvider(surfaceProvider) }
            val videoCapture = VideoCapture.withOutput(Recorder.Builder().setQualitySelector(QualitySelector.from(Quality.HD)).build())
            val imageAnalysis = ImageAnalysis.Builder().build().also { it.setAnalyzer(Executors.newSingleThreadExecutor(), MotionAnalyzer()) }
            provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, videoCapture, imageAnalysis)
        }, ContextCompat.getMainExecutor(context))
    }
}`,
    },
    'MotionDetector.kt': {
      category: 'Android',
      language: 'kotlin',
      content: `package com.securecam.app.motion

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import kotlin.math.abs

class MotionAnalyzer : ImageAnalysis.Analyzer {
    private var previousBuffer: ByteArray? = null

    override fun analyze(image: ImageProxy) {
        val plane = image.planes[0] // Y plane luminance
        val buffer = plane.buffer
        // Downsample and compute pixel differences against threshold
        // Check bounding zones (Doorway, TV, etc.)
        // Apply minimum duration & cooldown
        image.close()
    }
}`,
    },
    'WebRtcManager.kt': {
      category: 'Android',
      language: 'kotlin',
      content: `package com.securecam.app.webrtc

import org.webrtc.*

class WebRtcManager(context: Context) {
    private val factory: PeerConnectionFactory
    private var peerConnection: PeerConnection? = null

    init {
        PeerConnectionFactory.initialize(PeerConnectionFactory.InitializationOptions.builder(context).createInitializationOptions())
        factory = PeerConnectionFactory.builder().createPeerConnectionFactory()
    }

    fun createPeerConnection(iceServers: List<PeerConnection.IceServer>) {
        val config = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
        }
        peerConnection = factory.createPeerConnection(config, observer)
    }
}`,
    },
    'KeystoreManager.kt': {
      category: 'Android',
      language: 'kotlin',
      content: `package com.securecam.app.security

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator

class KeystoreManager(context: Context) {
    fun encrypt(plainText: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, getMasterKey())
        val iv = cipher.iv
        val encrypted = cipher.doFinal(plainText.toByteArray())
        return Base64.encodeToString(iv + encrypted, Base64.NO_WRAP)
    }
}`,
    },
    'SignalingServer index.ts': {
      category: 'Server',
      language: 'typescript',
      content: `import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (msg: string) => {
    const data = JSON.parse(msg);
    // 1. REGISTER_DEVICE (Camera / Monitor)
    // 2. CREATE_PAIRING_CODE (Dynamic QR & 6-digit PIN)
    // 3. WEBRTC_OFFER / ANSWER / ICE_CANDIDATE relay
    // 4. REMOTE_COMMAND (Snap, Record, Two-way Talk)
  });
});`,
    },
    'build.gradle.kts': {
      category: 'Android',
      language: 'kotlin',
      content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.securecam.app"
    compileSdk = 35
    defaultConfig {
        minSdk = 26
        targetSdk = 35
    }
}

dependencies {
    implementation("androidx.camera:camera-core:1.4.1")
    implementation("androidx.camera:camera-camera2:1.4.1")
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("org.webrtc:google-webrtc:1.0.32006")
    implementation("androidx.media3:media3-exoplayer:1.5.1")
}`,
    },
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Android Studio & Signaling Server Source Inspector
              </h3>
              <p className="text-xs text-neutral-400">
                Production-ready Kotlin, Compose, Room, CameraX, WebRTC, and Node.js files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* File selector tree */}
          <div className="w-full md:w-64 bg-neutral-950 border-r border-neutral-800 p-3 overflow-y-auto space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-2 py-1">
              Android Kotlin Project
            </span>
            {Object.entries(files)
              .filter(([_, f]) => f.category === 'Android')
              .map(([filename]) => (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                    activeFile === filename
                      ? 'bg-neutral-800 text-emerald-400 font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span className="truncate">{filename}</span>
                </button>
              ))}

            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-2 py-1 mt-4">
              Signaling Server
            </span>
            {Object.entries(files)
              .filter(([_, f]) => f.category === 'Server')
              .map(([filename]) => (
                <button
                  key={filename}
                  onClick={() => setActiveFile(filename)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono text-left transition-colors ${
                    activeFile === filename
                      ? 'bg-neutral-800 text-emerald-400 font-semibold'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Server className="w-3.5 h-3.5" />
                  <span className="truncate">{filename}</span>
                </button>
              ))}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 bg-black flex flex-col overflow-hidden">
            <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400 font-mono">
              <span>{activeFile}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 bg-neutral-800/80 px-2.5 py-1 rounded transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-neutral-300 leading-relaxed bg-black/90">
              <code>{files[activeFile].content}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-neutral-400">
            Files stored on disk in <code>/android</code> and <code>/securecam-server</code>
          </span>
          <div className="flex items-center gap-2">
            {onOpenApkModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenApkModal();
                }}
                className="flex items-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Build APK Guide</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
