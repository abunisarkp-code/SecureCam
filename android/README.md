# SecureCam Android App Project

This directory contains the full native Android application codebase for **SecureCam**, built using **Kotlin**, **Jetpack Compose**, **CameraX**, **Room SQLite**, and **WebRTC**.

---

## 3 Ways to Run / Build SecureCam

### Method 1: No Build Required — Use on Your Phone Right Now (Easiest!)
You don't need Android Studio or Gradle to run SecureCam on your devices:
1. Open your running SecureCam web app URL in **Google Chrome** on your Android phone (or **Safari** on iPhone).
2. Tap the browser menu (`⋮`) and tap **"Install App"** or **"Add to Home screen"**.
3. Launch SecureCam from your home screen. You get full camera access, background audio, motion detection, and remote monitor viewing immediately!

---

### Method 2: Open in Android Studio (Recommended for APK)
1. Download and install **[Android Studio Ladybug / Koala](https://developer.android.com/studio)**.
2. In Android Studio, select **File > Open...** and select this `android` folder.
3. Wait for Gradle sync to complete (Android Studio will automatically download the correct JDK and Android SDK 35).
4. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Once finished, click **"locate"** in the popup notification to get your `app-debug.apk`.
6. Copy `app-debug.apk` to any Android phone and tap to install!

---

### Method 3: Build via Command Line
Ensure you have **Java JDK 17+** and **Android SDK platform 35** installed.

```bash
# On macOS / Linux:
chmod +x gradlew
./gradlew assembleDebug

# On Windows (cmd/powershell):
gradlew.bat assembleDebug
```

The APK will be generated at:
```
app/build/outputs/apk/debug/app-debug.apk
```

---

### Method 4: Free Cloud Build with GitHub Actions (Zero Local Tools Needed)
If you do not have Android Studio or Java installed on your computer:
1. Push this folder to a GitHub repository.
2. Go to the **Actions** tab on your GitHub repo.
3. The included `.github/workflows/build-apk.yml` will automatically build the APK in the cloud.
4. Download the `SecureCam-Debug-APK` artifact directly from the workflow run!

---

## Common Build Errors & Solutions

### 1. `SDK location not found`
Create a file named `local.properties` in this `android/` directory and add the path to your Android SDK:
- **Windows**: `sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk`
- **macOS**: `sdk.dir=/Users/YourUsername/Library/Android/sdk`
- **Linux**: `sdk.dir=/home/YourUsername/Android/Sdk`

*(Opening the project in Android Studio creates this file automatically).*

### 2. `JAVA_HOME is not set` or `unsupported class file version`
Android Gradle Plugin 8.8 requires **Java 17**.
- Download **JDK 17** from [Adoptium Temurin](https://adoptium.net/temurin/releases/?version=17).
- Set `export JAVA_HOME=/path/to/jdk-17`.

### 3. `./gradlew: Permission denied`
Run:
```bash
chmod +x gradlew
```
