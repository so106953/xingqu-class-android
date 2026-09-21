package com.zhuzhu.interestclass

import android.content.Context
import org.json.JSONArray

class CourseStore(context: Context) {
    private val prefs = context.getSharedPreferences("interest_class_android_v1", Context.MODE_PRIVATE)
    fun load(): MutableList<Course> = try {
        val list = JSONArray(prefs.getString("courses", "[]"))
        MutableList(list.length()) { Course.fromJson(list.getJSONObject(it)) }
    } catch (_: Exception) { mutableListOf() }
    fun save(courses: List<Course>) {
        val list = JSONArray(); courses.forEach { list.put(it.toJson()) }
        prefs.edit().putString("courses", list.toString()).apply()
    }
    fun seedIfEmpty(): MutableList<Course> {
        val current = load(); if (current.isNotEmpty()) return current
        val seeded = mutableListOf(Course(name="篮球", category="运动"), Course(name="英语", category="语言", weekday=0, startTime="13:20", endTime="15:20"))
        save(seeded); return seeded
    }
}
