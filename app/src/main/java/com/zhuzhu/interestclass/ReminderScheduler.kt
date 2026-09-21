package com.zhuzhu.interestclass

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import java.time.LocalDateTime
import java.time.ZoneId

object ReminderScheduler {
    private fun requestCode(course: Course) = course.id.hashCode()
    private fun pending(context: Context, course: Course): PendingIntent = PendingIntent.getBroadcast(
        context, requestCode(course), Intent(context, ReminderReceiver::class.java).putExtra("courseId", course.id),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    fun schedule(context: Context, course: Course, after: LocalDateTime = LocalDateTime.now()) {
        cancel(context, course)
        if (!course.reminderEnabled) return
        val next = course.nextLesson(after) ?: return
        val trigger = next.minusMinutes(course.reminderMinutes.toLong()).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        if (trigger <= System.currentTimeMillis()) return
        val alarms = context.getSystemService(AlarmManager::class.java)
        val intent = pending(context, course)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarms.canScheduleExactAlarms()) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, intent)
        } else {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, intent)
        }
    }
    fun cancel(context: Context, course: Course) {
        val alarms = context.getSystemService(AlarmManager::class.java)
        alarms.cancel(pending(context, course))
    }
    fun rescheduleAll(context: Context) = CourseStore(context).load().forEach { schedule(context, it) }
}
