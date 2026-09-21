package com.zhuzhu.interestclass

import android.Manifest
import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.provider.CalendarContract
import androidx.core.content.ContextCompat
import java.time.LocalDateTime
import java.time.ZoneId

data class DeviceCalendar(val id: Long, val title: String)

object CalendarSync {
    fun available(context: Context) = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CALENDAR) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(context, Manifest.permission.WRITE_CALENDAR) == PackageManager.PERMISSION_GRANTED
    fun calendars(context: Context): List<DeviceCalendar> {
        if (!available(context)) return emptyList()
        val result = mutableListOf<DeviceCalendar>()
        context.contentResolver.query(CalendarContract.Calendars.CONTENT_URI, arrayOf(CalendarContract.Calendars._ID, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME),
            "${CalendarContract.Calendars.VISIBLE}=1", null, CalendarContract.Calendars.CALENDAR_DISPLAY_NAME)?.use { c ->
            while (c.moveToNext()) result += DeviceCalendar(c.getLong(0), c.getString(1) ?: "我的日历")
        }
        return result
    }
    fun sync(context: Context, course: Course, calendarId: Long): Long {
        course.calendarEventId.takeIf { it > 0 }?.let { context.contentResolver.delete(CalendarContract.Events.CONTENT_URI.buildUpon().appendPath(it.toString()).build(), null, null) }
        val start = course.nextLesson() ?: return -1L
        val end = start.withHour(course.endTime.substringBefore(':').toInt()).withMinute(course.endTime.substringAfter(':').toInt())
        val zone = ZoneId.systemDefault().id
        val values = ContentValues().apply {
            put(CalendarContract.Events.CALENDAR_ID, calendarId)
            put(CalendarContract.Events.TITLE, "兴趣课：${course.name}")
            put(CalendarContract.Events.DESCRIPTION, "由兴趣课时本同步 · 共 ${course.totalLessons} 节")
            put(CalendarContract.Events.DTSTART, start.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
            put(CalendarContract.Events.DTEND, end.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli())
            put(CalendarContract.Events.EVENT_TIMEZONE, zone)
            put(CalendarContract.Events.RRULE, "FREQ=WEEKLY;COUNT=${course.totalLessons}")
        }
        val uri = context.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values) ?: return -1L
        val id = uri.lastPathSegment?.toLongOrNull() ?: return -1L
        val reminder = ContentValues().apply { put(CalendarContract.Reminders.EVENT_ID,id); put(CalendarContract.Reminders.MINUTES,course.reminderMinutes); put(CalendarContract.Reminders.METHOD,CalendarContract.Reminders.METHOD_ALERT) }
        context.contentResolver.insert(CalendarContract.Reminders.CONTENT_URI, reminder)
        return id
    }
}
