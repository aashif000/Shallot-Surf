package com.shallotsurf.browser.tor

import com.facebook.react.bridge.*
import org.torproject.android.binary.TorServiceInitializer

class TorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    override fun getName() = "TorModule"

    @ReactMethod
    fun startTor(promise: Promise) {
        try {
            TorServiceInitializer.startTorService(reactApplicationContext)
            promise.resolve("Tor started")
        } catch (e: Exception) {
            promise.reject("TOR_START_ERROR", e)
        }
    }

    @ReactMethod
    fun stopTor(promise: Promise) {
        try {
            TorServiceInitializer.stopTorService(reactApplicationContext)
            promise.resolve("Tor stopped")
        } catch (e: Exception) {
            promise.reject("TOR_STOP_ERROR", e)
        }
    }

    @ReactMethod
    fun getStatus(promise: Promise) {
        val connected = TorServiceInitializer.isTorRunning(reactApplicationContext)
        promise.resolve(if (connected) "connected" else "not connected")
    }
}
