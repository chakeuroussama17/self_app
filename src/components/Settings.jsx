import { useState, useEffect } from 'react'
import { notifications } from '../utils/notifications'
import { storage } from '../utils/storage'
import { Bell, BellRing, Clock, CheckCircle2 } from 'lucide-react'

export default function Settings() {
  const [permission, setPermission] = useState(false)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [reminderTime, setReminderTime] = useState('20:00')
  const [status, setStatus] = useState('')

  useEffect(() => {
    checkStatus()
    const saved = storage.getItem('anchor_daily_reminder')
    if (saved) {
      const { enabled, time } = JSON.parse(saved)
      setReminderEnabled(enabled)
      setReminderTime(time || '20:00')
    }
  }, [])

  const checkStatus = async () => {
    const granted = await notifications.checkPermission()
    setPermission(granted)
  }

  const enableNotifications = async () => {
    const granted = await notifications.requestPermission()
    setPermission(granted)
    setStatus(granted ? 'Notifications enabled ✓' : 'Permission denied — enable it in your device settings')
    setTimeout(() => setStatus(''), 4000)
  }

  const toggleReminder = async () => {
    const granted = await notifications.requestPermission()
    setPermission(granted)
    if (!granted) {
      setStatus('Please allow notifications first')
      setTimeout(() => setStatus(''), 4000)
      return
    }

    const newEnabled = !reminderEnabled
    if (newEnabled) {
      const [h, m] = reminderTime.split(':').map(Number)
      await notifications.scheduleDailyReminder(h, m)
      setStatus(`Daily reminder set for ${reminderTime} ✓`)
    } else {
      await notifications.cancelDailyReminder()
      setStatus('Daily reminder turned off')
    }
    setReminderEnabled(newEnabled)
    storage.setItem('anchor_daily_reminder', JSON.stringify({ enabled: newEnabled, time: reminderTime }))
    setTimeout(() => setStatus(''), 4000)
  }

  const updateTime = async (time) => {
    setReminderTime(time)
    if (reminderEnabled) {
      const [h, m] = time.split(':').map(Number)
      await notifications.scheduleDailyReminder(h, m)
    }
    storage.setItem('anchor_daily_reminder', JSON.stringify({ enabled: reminderEnabled, time }))
  }

  const sendTest = async () => {
    const granted = await notifications.requestPermission()
    if (!granted) {
      setStatus('Please allow notifications first')
      setTimeout(() => setStatus(''), 4000)
      return
    }
    await notifications.sendTest()
    setStatus('Test notification will arrive in ~5 seconds')
    setTimeout(() => setStatus(''), 4000)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Settings</h2>
        <p className="text-gray-400 text-sm">Notifications & reminders</p>
      </div>

      {status && (
        <div className="mb-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm text-blue-200">
          {status}
        </div>
      )}

      {/* Permission */}
      <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={20} className={permission ? 'text-green-500' : 'text-gray-500'} />
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-xs text-gray-400">
                {permission ? 'Enabled' : 'Not enabled yet'}
              </p>
            </div>
          </div>
          {permission ? (
            <CheckCircle2 size={22} className="text-green-500" />
          ) : (
            <button
              onClick={enableNotifications}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm transition-colors"
            >
              Enable
            </button>
          )}
        </div>
      </div>

      {/* Daily reminder */}
      <div className="mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing size={20} className={reminderEnabled ? 'text-blue-400' : 'text-gray-500'} />
            <div>
              <p className="font-medium">Daily check-in reminder</p>
              <p className="text-xs text-gray-400">Reminds you to log sleep, gym & meditation</p>
            </div>
          </div>
          <button
            onClick={toggleReminder}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              reminderEnabled ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                reminderEnabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
          <Clock size={18} className="text-gray-400" />
          <span className="text-sm text-gray-400">Reminder time</span>
          <input
            type="time"
            value={reminderTime}
            onChange={e => updateTime(e.target.value)}
            className="ml-auto bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Test */}
      <button
        onClick={sendTest}
        className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium text-sm transition-colors"
      >
        Send test notification
      </button>

      {/* Info about prayer reminders */}
      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-200">
        <p className="font-bold mb-1">🕌 Prayer reminders</p>
        <p className="text-xs text-blue-300">
          Enable these from the Prayer tab — they're scheduled from your fetched prayer times.
          Open the app each day so the next day's times get scheduled.
        </p>
      </div>

      {!notifications.isNative() && (
        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg text-xs text-yellow-200">
          ⚠️ You're viewing this in a browser. Scheduled reminders work fully only in the
          installed Android app (APK). In-browser notifications are limited.
        </div>
      )}
    </div>
  )
}
