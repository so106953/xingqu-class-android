package com.zhuzhu.interestclass

import android.Manifest
import android.app.AlarmManager
import android.app.AlertDialog
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

class MainActivity : AppCompatActivity() {
    private val store by lazy { CourseStore(this) }
    private lateinit var webView: WebView
    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private val filePicker = registerForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        fileCallback?.onReceiveValue(uri?.let { arrayOf(it) }); fileCallback = null
    }
    private val notificationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { }
    private var calendarCourseId: String? = null
    private val calendarPermission = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) {
        calendarCourseId?.let { syncCalendar(it) }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        title = "兴趣课时本"
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = true
            settings.allowContentAccess = true
            addJavascriptInterface(NativeBridge(), "AndroidBridge")
            webViewClient = WebViewClient()
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(view: WebView?, callback: ValueCallback<Array<Uri>>?, params: FileChooserParams?): Boolean {
                    fileCallback?.onReceiveValue(null)
                    fileCallback = callback
                    filePicker.launch("image/*")
                    return true
                }
            }
            loadUrl("file:///android_asset/www/index.html")
        }
        setContentView(webView)
        requestNotificationPermissionIfNeeded()
        checkForUpdate()
    }

    override fun onBackPressed() {
        if (::webView.isInitialized && webView.canGoBack()) webView.goBack() else super.onBackPressed()
    }

    private inner class NativeBridge {
        @JavascriptInterface fun syncCourses(json: String) {
            try {
                val array = JSONArray(json)
                val converted = MutableList(array.length()) { index -> webCourse(array.getJSONObject(index)) }
                store.save(converted)
                ReminderScheduler.rescheduleAll(this@MainActivity)
            } catch (_: Exception) { }
        }
        @JavascriptInterface fun requestAlarmPermission() { runOnUiThread { this@MainActivity.requestAlarmPermission() } }
        @JavascriptInterface fun syncCalendar(courseId: String) = runOnUiThread { this@MainActivity.syncCalendar(courseId) }
        @JavascriptInterface fun showMessage(message: String) = runOnUiThread { toast(message) }
    }

    private fun webCourse(o: JSONObject): Course {
        val skips = mutableSetOf<String>()
        val skipObject = o.optJSONObject("skips")
        if (skipObject != null) {
            val keys = skipObject.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                if (skipObject.opt(key) != false) skips.add(key)
            }
        }
        val category = when ((o.optString("imageKey") + o.optString("name")).lowercase()) {
            in listOf("basketball篮球","badminton羽毛球","football足球","swimming游泳") -> "运动"
            else -> "兴趣"
        }
        return Course(
            id = o.optString("id"), name = o.optString("name", "兴趣班"), category = category,
            totalLessons = o.optInt("total", 16), initialUsed = o.optInt("initialUsed", 0),
            weekday = o.optInt("weekday", 6), startTime = o.optString("startTime", "10:30"),
            endTime = o.optString("endTime", "12:00"), startDate = o.optString("startDate"),
            reminderMinutes = o.optInt("reminderMinutes", 30), reminderEnabled = o.optBoolean("reminderEnabled", true),
            skippedDates = skips
        )
    }

    private fun requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= 33 && ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            notificationPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }
    private fun checkForUpdate() {
        UpdateChecker.check { update -> runOnUiThread {
            AlertDialog.Builder(this).setTitle("发现新版本 v${update.versionName}")
                .setMessage(update.notes)
                .setNegativeButton("以后再说", null)
                .setPositiveButton("立即更新") { _, _ ->
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(update.apkUrl)))
                }.show()
        } }
    }
    private fun requestAlarmPermission() {
        if (Build.VERSION.SDK_INT >= 31 && !getSystemService(AlarmManager::class.java).canScheduleExactAlarms()) {
            startActivity(Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:$packageName")))
        } else toast("手机提醒已可用")
    }
    private fun syncCalendar(courseId: String) {
        val course = store.load().firstOrNull { it.id == courseId } ?: run { toast("请先保存课程设置"); return }
        calendarCourseId = courseId
        if (!CalendarSync.available(this)) {
            calendarPermission.launch(arrayOf(Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR))
            return
        }
        val calendars = CalendarSync.calendars(this)
        if (calendars.isEmpty()) { toast("手机上没有可写入的日历"); return }
        AlertDialog.Builder(this).setTitle("同步到手机日历").setItems(calendars.map { it.title }.toTypedArray()) { _, which ->
            val eventId = CalendarSync.sync(this, course, calendars[which].id)
            if (eventId > 0) { course.calendarEventId = eventId; store.save(store.load().map { if (it.id == course.id) course else it }); toast("已同步到手机日历") }
            else toast("日历同步失败")
        }.show()
    }
    private fun toast(text: String) = Toast.makeText(this, text, Toast.LENGTH_SHORT).show()
}
