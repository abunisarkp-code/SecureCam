package com.securecam.app.camera

import android.content.Context
import android.util.Log
import androidx.camera.core.*
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.*
import androidx.camera.video.VideoCapture
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.securecam.app.motion.MotionAnalyzer
import java.io.File
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class CameraController(
    private val context: Context,
    private val lifecycleOwner: LifecycleOwner,
    private val motionAnalyzer: MotionAnalyzer
) {
    private val cameraExecutor: ExecutorService = Executors.newSingleThreadExecutor()
    private var cameraProvider: ProcessCameraProvider? = null
    private var camera: Camera? = null
    private var preview: Preview? = null
    private var imageCapture: ImageCapture? = null
    private var videoCapture: VideoCapture<Recorder>? = null
    private var activeRecording: Recording? = null
    private var lensFacing = CameraSelector.LENS_FACING_BACK

    var isTorchEnabled: Boolean = false
        private set

    fun startCamera(
        surfaceProvider: Preview.SurfaceProvider,
        useFrontCamera: Boolean = false,
        onInitialized: () -> Unit = {}
    ) {
        lensFacing = if (useFrontCamera) CameraSelector.LENS_FACING_FRONT else CameraSelector.LENS_FACING_BACK
        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)

        cameraProviderFuture.addListener({
            cameraProvider = cameraProviderFuture.get()

            preview = Preview.Builder().build().also {
                it.setSurfaceProvider(surfaceProvider)
            }

            imageCapture = ImageCapture.Builder()
                .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                .build()

            val recorder = Recorder.Builder()
                .setQualitySelector(QualitySelector.from(Quality.HD, FallbackStrategy.lowerQualityOrHigherThan(Quality.SD)))
                .build()
            videoCapture = VideoCapture.withOutput(recorder)

            val imageAnalyzer = ImageAnalysis.Builder()
                .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                .build()
                .also {
                    it.setAnalyzer(cameraExecutor, motionAnalyzer)
                }

            val cameraSelector = CameraSelector.Builder().requireLensFacing(lensFacing).build()

            try {
                cameraProvider?.unbindAll()
                camera = cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageCapture,
                    videoCapture,
                    imageAnalyzer
                )
                onInitialized()
            } catch (exc: Exception) {
                Log.e("CameraController", "Camera binding failed", exc)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    fun switchCamera(surfaceProvider: Preview.SurfaceProvider) {
        val useFront = lensFacing == CameraSelector.LENS_FACING_BACK
        startCamera(surfaceProvider, useFrontCamera = useFront)
    }

    fun toggleTorch(enable: Boolean) {
        camera?.let {
            if (it.cameraInfo.hasFlashUnit()) {
                it.cameraControl.enableTorch(enable)
                isTorchEnabled = enable
            }
        }
    }

    fun takePhoto(outputDirectory: File, onPhotoTaken: (File) -> Unit, onError: (Exception) -> Unit) {
        val photoFile = File(
            outputDirectory,
            "SECURECAM_IMG_${SimpleDateFormat("yyyyMMdd_HHmmss", Locale.US).format(Date())}.jpg"
        )
        val outputOptions = ImageCapture.OutputFileOptions.Builder(photoFile).build()

        imageCapture?.takePicture(
            outputOptions,
            cameraExecutor,
            object : ImageCapture.OnImageSavedCallback {
                override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                    onPhotoTaken(photoFile)
                }

                override fun onError(exception: ImageCaptureException) {
                    onError(exception)
                }
            }
        )
    }

    fun startRecording(outputFile: File, enableAudio: Boolean, onStarted: () -> Unit, onFinished: (File) -> Unit) {
        val outputOptions = FileOutputOptions.Builder(outputFile).build()
        val pendingRecording = videoCapture?.output?.prepareRecording(context, outputOptions)

        if (enableAudio && ContextCompat.checkSelfPermission(context, android.Manifest.permission.RECORD_AUDIO) == android.content.pm.PackageManager.PERMISSION_GRANTED) {
            pendingRecording?.withAudioEnabled()
        }

        activeRecording = pendingRecording?.start(ContextCompat.getMainExecutor(context)) { event ->
            when (event) {
                is VideoRecordEvent.Start -> onStarted()
                is VideoRecordEvent.Finalize -> {
                    if (!event.hasError()) {
                        onFinished(outputFile)
                    }
                }
            }
        }
    }

    fun stopRecording() {
        activeRecording?.stop()
        activeRecording = null
    }

    fun shutdown() {
        stopRecording()
        cameraProvider?.unbindAll()
        cameraExecutor.shutdown()
    }
}
