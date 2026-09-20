package com.securecam.app.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "camera_devices")
data class CameraDeviceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val pairedToken: String,
    val lastSeenTimestamp: Long,
    val isOnline: Boolean = false,
    val batteryPercent: Int = 100,
    val isCharging: Boolean = false,
    val isRecording: Boolean = false,
    val motionDetected: Boolean = false,
    val networkStatus: String = "Wi-Fi",
    val thumbnailUri: String? = null
)

@Entity(tableName = "motion_events")
data class MotionEventEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val cameraId: String,
    val cameraName: String,
    val timestamp: Long,
    val motionDurationMs: Long,
    val zoneName: String? = "Full Frame",
    val photoUri: String? = null,
    val videoUri: String? = null,
    val isSynced: Boolean = false
)

@Entity(tableName = "recordings")
data class RecordingEntity(
    @PrimaryKey val id: String,
    val cameraId: String,
    val cameraName: String,
    val startTime: Long,
    val durationMs: Long,
    val fileSizeBytes: Long,
    val filePath: String,
    val thumbnailPath: String? = null,
    val recordingType: String, // MANUAL, MOTION, SCHEDULED, CONTINUOUS
    val isProtected: Boolean = false,
    val isFavorite: Boolean = false
)

@Entity(tableName = "photos")
data class PhotoEntity(
    @PrimaryKey val id: String,
    val cameraId: String,
    val cameraName: String,
    val timestamp: Long,
    val filePath: String,
    val isFavorite: Boolean = false,
    val hasTimestampOverlay: Boolean = true
)

@Entity(tableName = "motion_zones")
data class MotionZoneEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val isEnabled: Boolean = true,
    val xPercent: Float,
    val yPercent: Float,
    val widthPercent: Float,
    val heightPercent: Float,
    val sensitivity: String = "MEDIUM" // LOW, MEDIUM, HIGH, CUSTOM
)

@Entity(tableName = "schedules")
data class ScheduleEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val daysOfWeek: String, // "MON,TUE,WED,THU,FRI"
    val startMinuteOfDay: Int,
    val endMinuteOfDay: Int,
    val isMonitoringEnabled: Boolean = true,
    val isMotionDetectionEnabled: Boolean = true,
    val isRecordingEnabled: Boolean = true
)

@Entity(tableName = "app_settings")
data class AppSettingsEntity(
    @PrimaryKey val id: Int = 1,
    val role: String = "UNSET", // "CAMERA", "MONITOR", "UNSET"
    val cameraName: String = "Living Room Camera",
    val cameraLens: String = "BACK", // "BACK", "FRONT"
    val videoQuality: String = "HD_720P", // "SD_480P", "HD_720P", "FHD_1080P", "MAX"
    val targetFps: Int = 30,
    val audioEnabled: Boolean = true,
    val motionDetectionEnabled: Boolean = true,
    val motionSensitivity: String = "MEDIUM", // "LOW", "MEDIUM", "HIGH", "CUSTOM"
    val minMovementDurationMs: Long = 500,
    val motionCooldownMs: Long = 5000,
    val preMotionBufferSeconds: Int = 10,
    val postMotionBufferSeconds: Int = 20,
    val recordingMode: String = "MOTION_ONLY", // "MANUAL", "MOTION_ONLY", "CONTINUOUS", "SCHEDULED"
    val storageLimitGb: Int = 10,
    val autoBootStart: Boolean = true,
    val pauseMonitoringBelowBattery: Int = 15,
    val monitorOnlyWhileCharging: Boolean = false,
    val pinLockEnabled: Boolean = false,
    val pinCodeHash: String? = null,
    val biometricEnabled: Boolean = false,
    val signalingServerUrl: String = "wss://signaling.securecam.local:8080"
)
