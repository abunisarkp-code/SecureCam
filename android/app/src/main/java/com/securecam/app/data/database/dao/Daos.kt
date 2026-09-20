package com.securecam.app.data.database.dao

import androidx.room.*
import com.securecam.app.data.database.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface CameraDao {
    @Query("SELECT * FROM camera_devices ORDER BY lastSeenTimestamp DESC")
    fun getAllCameras(): Flow<List<CameraDeviceEntity>>

    @Query("SELECT * FROM camera_devices WHERE id = :id")
    suspend fun getCameraById(id: String): CameraDeviceEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrUpdateCamera(camera: CameraDeviceEntity)

    @Delete
    suspend fun deleteCamera(camera: CameraDeviceEntity)

    @Query("UPDATE camera_devices SET isOnline = :isOnline, lastSeenTimestamp = :lastSeen WHERE id = :id")
    suspend fun updatePresence(id: String, isOnline: Boolean, lastSeen: Long)

    @Query("UPDATE camera_devices SET name = :newName WHERE id = :id")
    suspend fun renameCamera(id: String, newName: String)
}

@Dao
interface MotionEventDao {
    @Query("SELECT * FROM motion_events ORDER BY timestamp DESC")
    fun getAllEvents(): Flow<List<MotionEventEntity>>

    @Query("SELECT * FROM motion_events WHERE cameraId = :cameraId ORDER BY timestamp DESC")
    fun getEventsForCamera(cameraId: String): Flow<List<MotionEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: MotionEventEntity): Long

    @Query("DELETE FROM motion_events WHERE id = :id")
    suspend fun deleteEvent(id: Long)
}

@Dao
interface RecordingDao {
    @Query("SELECT * FROM recordings ORDER BY startTime DESC")
    fun getAllRecordings(): Flow<List<RecordingEntity>>

    @Query("SELECT * FROM recordings WHERE isFavorite = 1 ORDER BY startTime DESC")
    fun getFavoriteRecordings(): Flow<List<RecordingEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRecording(recording: RecordingEntity)

    @Delete
    suspend fun deleteRecording(recording: RecordingEntity)

    @Query("UPDATE recordings SET isFavorite = :isFavorite WHERE id = :id")
    suspend fun updateFavorite(id: String, isFavorite: Boolean)

    @Query("UPDATE recordings SET isProtected = :isProtected WHERE id = :id")
    suspend fun updateProtected(id: String, isProtected: Boolean)

    @Query("SELECT * FROM recordings WHERE isProtected = 0 ORDER BY startTime ASC")
    suspend fun getUnprotectedRecordingsOldestFirst(): List<RecordingEntity>
}

@Dao
interface MotionZoneDao {
    @Query("SELECT * FROM motion_zones")
    fun getAllZones(): Flow<List<MotionZoneEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertZone(zone: MotionZoneEntity): Long

    @Update
    suspend fun updateZone(zone: MotionZoneEntity)

    @Delete
    suspend fun deleteZone(zone: MotionZoneEntity)
}

@Dao
interface AppSettingsDao {
    @Query("SELECT * FROM app_settings WHERE id = 1")
    fun getSettings(): Flow<AppSettingsEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveSettings(settings: AppSettingsEntity)
}
