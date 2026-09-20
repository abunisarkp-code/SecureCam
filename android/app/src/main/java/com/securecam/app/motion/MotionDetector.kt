package com.securecam.app.motion

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer
import kotlin.math.abs

enum class MotionSensitivity(val threshold: Int, val minPixelDeltaRatio: Float) {
    LOW(threshold = 40, minPixelDeltaRatio = 0.08f),
    MEDIUM(threshold = 25, minPixelDeltaRatio = 0.04f),
    HIGH(threshold = 15, minPixelDeltaRatio = 0.015f),
    CUSTOM(threshold = 20, minPixelDeltaRatio = 0.025f)
}

data class MotionZone(
    val id: Long,
    val name: String,
    val isEnabled: Boolean,
    val xPercent: Float,
    val yPercent: Float,
    val widthPercent: Float,
    val heightPercent: Float
) {
    fun containsNormalized(x: Float, y: Float): Boolean {
        return x >= xPercent && x <= (xPercent + widthPercent) &&
               y >= yPercent && y <= (yPercent + heightPercent)
    }
}

interface MotionDetector {
    fun setSensitivity(sensitivity: MotionSensitivity)
    fun setZones(zones: List<MotionZone>)
    fun setOnMotionDetectedListener(listener: (zoneName: String?, deltaRatio: Float) -> Unit)
    fun setOnMotionStoppedListener(listener: () -> Unit)
}

class MotionAnalyzer : ImageAnalysis.Analyzer, MotionDetector {
    private var sensitivity: MotionSensitivity = MotionSensitivity.MEDIUM
    private var zones: List<MotionZone> = emptyList()
    private var onMotionDetected: ((String?, Float) -> Unit)? = null
    private var onMotionStopped: (() -> Unit)? = null

    private var previousLumaBuffer: ByteArray? = null
    private var isCurrentlyInMotion = false
    private var lastMotionTimestamp: Long = 0
    private var motionStartTimestamp: Long = 0
    private val motionCooldownMs: Long = 4000
    private val minMotionDurationMs: Long = 400

    override fun setSensitivity(sensitivity: MotionSensitivity) {
        this.sensitivity = sensitivity
    }

    override fun setZones(zones: List<MotionZone>) {
        this.zones = zones
    }

    override fun setOnMotionDetectedListener(listener: (String?, Float) -> Unit) {
        this.onMotionDetected = listener
    }

    override fun setOnMotionStoppedListener(listener: () -> Unit) {
        this.onMotionStopped = listener
    }

    override fun analyze(image: ImageProxy) {
        val plane = image.planes[0] // Y plane (luminance)
        val buffer: ByteBuffer = plane.buffer
        val width = image.width
        val height = image.height

        // Downsample grid for high performance on old Android devices
        val step = 8
        val sampledWidth = width / step
        val sampledHeight = height / step
        val currentLuma = ByteArray(sampledWidth * sampledHeight)

        val rowStride = plane.rowStride
        val pixelStride = plane.pixelStride

        var sampleIdx = 0
        for (y in 0 until height step step) {
            for (x in 0 until width step step) {
                val byteIndex = y * rowStride + x * pixelStride
                if (byteIndex < buffer.capacity()) {
                    currentLuma[sampleIdx++] = buffer.get(byteIndex)
                }
            }
        }

        val prev = previousLumaBuffer
        if (prev != null && prev.size == currentLuma.size) {
            var diffCount = 0
            var triggeredZone: String? = null
            val activeZones = zones.filter { it.isEnabled }

            for (i in currentLuma.indices) {
                val diff = abs(currentLuma[i].toInt() - prev[i].toInt())
                if (diff > sensitivity.threshold) {
                    val sampleX = (i % sampledWidth).toFloat() / sampledWidth
                    val sampleY = (i / sampledWidth).toFloat() / sampledHeight

                    // If zones are configured, check if motion falls into enabled zones
                    if (activeZones.isNotEmpty()) {
                        val matchingZone = activeZones.find { it.containsNormalized(sampleX, sampleY) }
                        if (matchingZone != null) {
                            diffCount++
                            triggeredZone = matchingZone.name
                        }
                    } else {
                        diffCount++
                    }
                }
            }

            val totalSampled = currentLuma.size.toFloat()
            val deltaRatio = diffCount / totalSampled
            val currentTime = System.currentTimeMillis()

            if (deltaRatio >= sensitivity.minPixelDeltaRatio) {
                if (!isCurrentlyInMotion) {
                    if (motionStartTimestamp == 0L) {
                        motionStartTimestamp = currentTime
                    } else if (currentTime - motionStartTimestamp >= minMotionDurationMs) {
                        isCurrentlyInMotion = true
                        lastMotionTimestamp = currentTime
                        onMotionDetected?.invoke(triggeredZone ?: "Full Frame", deltaRatio)
                    }
                } else {
                    lastMotionTimestamp = currentTime
                }
            } else {
                motionStartTimestamp = 0L
                if (isCurrentlyInMotion && (currentTime - lastMotionTimestamp > motionCooldownMs)) {
                    isCurrentlyInMotion = false
                    onMotionStopped?.invoke()
                }
            }
        }

        previousLumaBuffer = currentLuma
        image.close()
    }
}
