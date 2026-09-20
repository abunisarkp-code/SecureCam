package com.securecam.app.data.database

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.securecam.app.data.database.dao.*
import com.securecam.app.data.database.entity.*

@Database(
    entities = [
        CameraDeviceEntity::class,
        MotionEventEntity::class,
        RecordingEntity::class,
        PhotoEntity::class,
        MotionZoneEntity::class,
        ScheduleEntity::class,
        AppSettingsEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class SecureCamDatabase : RoomDatabase() {
    abstract fun cameraDao(): CameraDao
    abstract fun motionEventDao(): MotionEventDao
    abstract fun recordingDao(): RecordingDao
    abstract fun motionZoneDao(): MotionZoneDao
    abstract fun appSettingsDao(): AppSettingsDao

    companion object {
        @Volatile
        private var INSTANCE: SecureCamDatabase? = null

        fun getInstance(context: Context): SecureCamDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    SecureCamDatabase::class.java,
                    "securecam_local.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
