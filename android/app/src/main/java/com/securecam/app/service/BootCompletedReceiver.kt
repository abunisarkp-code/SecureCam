package com.securecam.app.service

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.securecam.app.data.database.SecureCamDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.launch

class BootCompletedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED || intent.action == "android.intent.action.QUICKBOOT_POWERON") {
            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val db = SecureCamDatabase.getInstance(context)
                    val settings = db.appSettingsDao().getSettings().firstOrNull()
                    if (settings?.role == "CAMERA" && settings.autoBootStart) {
                        ForegroundMonitoringService.start(context)
                    }
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }
}
