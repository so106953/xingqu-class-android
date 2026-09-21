package com.zhuzhu.interestclass

import org.json.JSONObject
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.LocalTime
import java.util.UUID

data class Course(
    val id: String = UUID.randomUUID().toString(),
    var name: String,
    var category: String = "其他",
    var totalLessons: Int = 16,
    var initialUsed: Int = 0,
    var weekday: Int = 6,
    var startTime: String = "10:30",
    var endTime: String = "12:00",
    var startDate: String = LocalDate.now().toString(),
    var reminderMinutes: Int = 30,
    var reminderEnabled: Boolean = true,
    var calendarEventId: Long = -1L,
    var skippedDates: MutableSet<String> = mutableSetOf()
) {
    fun toJson() = JSONObject().apply {
        put("id", id); put("name", name); put("category", category); put("totalLessons", totalLessons)
        put("initialUsed", initialUsed); put("weekday", weekday); put("startTime", startTime); put("endTime", endTime)
        put("startDate", startDate); put("reminderMinutes", reminderMinutes); put("reminderEnabled", reminderEnabled)
        put("calendarEventId", calendarEventId); put("skippedDates", skippedDates.joinToString(","))
    }
    companion object {
        fun fromJson(o: JSONObject) = Course(
            id=o.getString("id"), name=o.getString("name"), category=o.optString("category", "其他"),
            totalLessons=o.optInt("totalLessons",16), initialUsed=o.optInt("initialUsed",0), weekday=o.optInt("weekday",6),
            startTime=o.optString("startTime","10:30"), endTime=o.optString("endTime","12:00"),
            startDate=o.optString("startDate",LocalDate.now().toString()), reminderMinutes=o.optInt("reminderMinutes",30),
            reminderEnabled=o.optBoolean("reminderEnabled",true), calendarEventId=o.optLong("calendarEventId",-1L),
            skippedDates=o.optString("skippedDates").split(",").filter { it.isNotBlank() }.toMutableSet()
        )
    }
}

fun Course.nextLesson(now: java.time.LocalDateTime = java.time.LocalDateTime.now()): java.time.LocalDateTime? {
    val start = LocalDate.parse(startDate)
    val target = DayOfWeek.of(if (weekday == 0) 7 else weekday)
    var date = start.plusDays(((target.value - start.dayOfWeek.value + 7) % 7).toLong())
    val time = LocalTime.parse(startTime)
    val end = LocalTime.parse(endTime)
    var used = initialUsed
    while (used < totalLessons) {
        val startsAt = date.atTime(time)
        val endsAt = date.atTime(end)
        if (endsAt.isAfter(now) && !skippedDates.contains(date.toString())) return startsAt
        if (!skippedDates.contains(date.toString())) used++
        date = date.plusWeeks(1)
    }
    return null
}

fun Course.completedLessons(now: java.time.LocalDateTime = java.time.LocalDateTime.now()): Int {
    var used = initialUsed
    val start = LocalDate.parse(startDate)
    val target = DayOfWeek.of(if (weekday == 0) 7 else weekday)
    var date = start.plusDays(((target.value - start.dayOfWeek.value + 7) % 7).toLong())
    val end = LocalTime.parse(endTime)
    while (used < totalLessons && !date.atTime(end).isAfter(now)) {
        if (!skippedDates.contains(date.toString())) used++
        date = date.plusWeeks(1)
    }
    return used
}
