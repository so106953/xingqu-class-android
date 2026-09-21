package com.zhuzhu.interestclass

import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationCompat

class ReminderReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val course = CourseStore(context).load().firstOrNull { it.id == intent.getStringExtra("courseId") } ?: return
        val manager = context.getSystemService(NotificationManager::class.java)
        val channelId = "class_reminders"
        manager.createNotificationChannel(NotificationChannel(channelId, "上课提醒", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "课程开始前提醒"
            setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM), AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).build())
        })
        val next = course.nextLesson()
        manager.notify(course.id.hashCode(), NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("${course.name} 即将开始")
            .setContentText("${course.reminderMinutes} 分钟后上课${next?.let { " · ${it.toLocalTime()}" } ?: ""}")
            .setPriority(NotificationCompat.PRIORITY_HIGH).setAutoCancel(true).build())
        ReminderScheduler.schedule(context, course, (next ?: return).plusHours(3))
    }
}
