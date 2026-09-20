package com.securecam.app

import android.app.Application
import com.securecam.app.data.database.SecureCamDatabase
import com.securecam.app.security.KeystoreManager

class SecureCamApplication : Application() {
    lateinit var database: SecureCamDatabase
        private set
    lateinit var keystoreManager: KeystoreManager
        private set

    override fun onCreate() {
        super.onCreate()
        database = SecureCamDatabase.getInstance(this)
        keystoreManager = KeystoreManager(this)
    }
}
