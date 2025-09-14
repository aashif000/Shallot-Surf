package com.vag890.shallotsurf.tor

import android.content.*
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Handler
import android.os.Looper
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class TorModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  companion object {
    private const val ORBOT_PACKAGE = "org.torproject.android"
    private const val ACTION_START = "org.torproject.android.intent.action.START"
    private const val ACTION_STATUS = "org.torproject.android.intent.action.STATUS"
    private const val EXTRA_STATUS = "org.torproject.android.intent.extra.STATUS"
    private const val EXTRA_PACKAGE_NAME = "org.torproject.android.intent.extra.PACKAGE_NAME"
    private const val JS_EVENT_TOR_STATUS = "TorStatus"
  }

  private var receiver: BroadcastReceiver? = null

  override fun getName(): String = "TorModule"

  @ReactMethod
  fun isOrbotInstalled(promise: Promise) {
    try {
      reactContext.packageManager.getPackageInfo(ORBOT_PACKAGE, 0)
      promise.resolve(true)
    } catch (e: PackageManager.NameNotFoundException) {
      promise.resolve(false)
    } catch (e: Exception) {
      promise.reject("ORBOT_CHECK_ERROR", e)
    }
  }

  @ReactMethod
  fun openOrbotAppOrStore(promise: Promise) {
    try {
      val pm = reactContext.packageManager
      val launch = pm.getLaunchIntentForPackage(ORBOT_PACKAGE)
      if (launch != null) {
        launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(launch)
        promise.resolve(true)
        return
      }

      // Not installed: open Play Store (fallback to web)
      val market = Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$ORBOT_PACKAGE"))
      market.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      val resolved = pm.queryIntentActivities(market, 0)
      if (resolved != null && resolved.isNotEmpty()) {
        reactContext.startActivity(market)
      } else {
        val web = Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=$ORBOT_PACKAGE"))
        web.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(web)
      }
      promise.resolve(false)
    } catch (e: Exception) {
      promise.reject("OPEN_ORBOT_ERROR", e)
    }
  }

  @ReactMethod
  fun requestOrbotStart(promise: Promise) {
    try {
      // Ensure Orbot exists first
      try {
        reactContext.packageManager.getPackageInfo(ORBOT_PACKAGE, 0)
      } catch (e: PackageManager.NameNotFoundException) {
        promise.reject("ORBOT_MISSING", "Orbot not installed")
        return
      }

      ensureReceiverRegistered()

      val intent = Intent(ACTION_START)
      intent.setPackage(ORBOT_PACKAGE)
      intent.putExtra(EXTRA_PACKAGE_NAME, reactContext.packageName)
      reactContext.sendBroadcast(intent)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("REQUEST_START_ERROR", e)
    }
  }

  private fun ensureReceiverRegistered() {
    if (receiver != null) return

    receiver = object : BroadcastReceiver() {
      override fun onReceive(context: Context?, intent: Intent?) {
        if (intent == null) return
        val action = intent.action ?: return
        if (action == ACTION_STATUS) {
          val status = intent.getStringExtra(EXTRA_STATUS) ?: "UNKNOWN"
          sendStatusToJs(status)
        }
      }
    }

    val filter = IntentFilter(ACTION_STATUS)
    reactContext.registerReceiver(receiver, filter, null, Handler(Looper.getMainLooper()))
  }

  private fun sendStatusToJs(status: String) {
    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(JS_EVENT_TOR_STATUS, status)
  }

  @ReactMethod
  fun stopStatusListener() {
    if (receiver != null) {
      try {
        reactContext.unregisterReceiver(receiver)
      } catch (e: Exception) {
        // ignore
      }
      receiver = null
    }
  }

  override fun onCatalystInstanceDestroy() {
    stopStatusListener()
    super.onCatalystInstanceDestroy()
  }
}
