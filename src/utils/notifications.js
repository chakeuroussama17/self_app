import { LocalNotifications } from '@capacitor/local-notifications'
import { Capacitor } from '@capacitor/core'

// Notification ID ranges:
//   1-5   => today's prayers (Fajr, Dhuhr, Asr, Maghrib, Isha)
//   100   => daily evening check-in reminder
const PRAYER_IDS = [1, 2, 3, 4, 5]
const DAILY_REMINDER_ID = 100

export const notifications = {
  isNative: () => Capacitor.isNativePlatform(),

  // Ask the OS for permission. Works on native (Capacitor) and falls back to
  // the browser Notification API when running as a plain web app in dev.
  async requestPermission() {
    try {
      const result = await LocalNotifications.requestPermissions()
      return result.display === 'granted'
    } catch (e) {
      if (typeof Notification !== 'undefined') {
        const p = await Notification.requestPermission()
        return p === 'granted'
      }
      return false
    }
  },

  async checkPermission() {
    try {
      const result = await LocalNotifications.checkPermissions()
      return result.display === 'granted'
    } catch (e) {
      if (typeof Notification !== 'undefined') {
        return Notification.permission === 'granted'
      }
      return false
    }
  },

  // Schedule one notification per upcoming prayer for the rest of today.
  // prayers: [{ name: 'Fajr', time: '05:12' }, ...]
  // Returns how many were scheduled (prayers already passed today are skipped).
  async schedulePrayerNotifications(prayers) {
    try {
      // Clear any previously scheduled prayer notifications first
      await LocalNotifications.cancel({
        notifications: PRAYER_IDS.map(id => ({ id }))
      })

      const now = new Date()
      const toSchedule = []

      prayers.forEach((p, idx) => {
        if (!p.time) return
        const [h, m] = p.time.split(':').map(Number)
        const at = new Date()
        at.setHours(h, m, 0, 0)

        // Only schedule prayers that are still ahead today
        if (at > now) {
          toSchedule.push({
            id: PRAYER_IDS[idx],
            title: `${p.name} prayer`,
            body: `It's time for ${p.name}. 🕌`,
            schedule: { at },
            smallIcon: 'ic_stat_icon_config_sample'
          })
        }
      })

      if (toSchedule.length > 0) {
        await LocalNotifications.schedule({ notifications: toSchedule })
      }
      return toSchedule.length
    } catch (e) {
      console.warn('Could not schedule prayer notifications:', e)
      return 0
    }
  },

  // Repeating daily reminder at a fixed time (e.g. 20:00) to log the day.
  async scheduleDailyReminder(hour = 20, minute = 0) {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] })
      await LocalNotifications.schedule({
        notifications: [{
          id: DAILY_REMINDER_ID,
          title: 'Daily check-in',
          body: "Have you logged sleep, gym, and meditation today?",
          schedule: { on: { hour, minute }, repeats: true },
          smallIcon: 'ic_stat_icon_config_sample'
        }]
      })
      return true
    } catch (e) {
      console.warn('Could not schedule daily reminder:', e)
      return false
    }
  },

  async cancelDailyReminder() {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] })
      return true
    } catch (e) {
      return false
    }
  },

  // Fire a one-off test notification a few seconds from now.
  async sendTest() {
    try {
      const at = new Date(Date.now() + 5000)
      await LocalNotifications.schedule({
        notifications: [{
          id: 999,
          title: 'Anchor test 🔔',
          body: 'Notifications are working!',
          schedule: { at }
        }]
      })
      return true
    } catch (e) {
      console.warn('Test notification failed:', e)
      return false
    }
  }
}
