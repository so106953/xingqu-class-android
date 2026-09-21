package com.zhuzhu.interestclass

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL

data class AppUpdate(val versionCode: Int, val versionName: String, val apkUrl: String, val notes: String)

object UpdateChecker {
    private const val UPDATE_URL = "https://website-delta-seven-19.vercel.app/apk/update.json"

    fun check(onUpdate: (AppUpdate) -> Unit) {
        Thread {
            try {
                val connection = URL(UPDATE_URL).openConnection() as HttpURLConnection
                connection.connectTimeout = 8_000
                connection.readTimeout = 8_000
                connection.useCaches = false
                val raw = connection.inputStream.bufferedReader().use { it.readText() }
                val json = JSONObject(raw)
                val update = AppUpdate(
                    versionCode = json.getInt("versionCode"),
                    versionName = json.getString("versionName"),
                    apkUrl = json.getString("apkUrl"),
                    notes = json.optString("notes", "优化体验并修复问题")
                )
                if (update.versionCode > BuildConfig.VERSION_CODE) onUpdate(update)
            } catch (_: Exception) {
                // Network or server errors must never prevent the course tracker from opening.
            }
        }.start()
    }
}
