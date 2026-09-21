# 兴趣课时本 Android APK

独立 Android 项目，包名 `com.zhuzhu.interestclass`。数据保存在应用私有存储中，不与网站或微信小程序共享。

功能：课程与请假记录、课前提醒、精确闹钟权限引导、手机重启后提醒恢复、手机日历同步、课程修改/删除联动、离线数据保存。

构建前在 `local.properties` 配置 Android SDK 路径，然后使用 Android Studio 或 Gradle 8.7.3 构建 `app` 模块。首次使用请在系统中允许通知、闹钟和提醒；需要同步日历时允许日历读写权限。
