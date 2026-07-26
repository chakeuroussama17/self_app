import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { CheckCircle2, Circle, MapPin, Loader, Download, Bell } from 'lucide-react'
import { csvExport } from '../utils/csvExport'
import { notifications } from '../utils/notifications'

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export default function Prayer({ onDataChange }) {
  const [location, setLocation] = useState('')
  const [savedLocation, setSavedLocation] = useState('')
  const [prayers, setPrayers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [notifStatus, setNotifStatus] = useState('')
  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const prayerStatus = todayData.prayerTimes || {}

  // Load saved location on mount
  useEffect(() => {
    const saved = localStorage.getItem('anchor_prayer_location')
    if (saved) {
      setSavedLocation(saved)
      fetchPrayers(saved)
    } else {
      setShowInput(true)
    }
  }, [])

  // Fetch prayers by city name
  const fetchPrayers = async (cityName) => {
    if (!cityName.trim()) {
      setError('Please enter a city name')
      return
    }

    setLoading(true)
    setError('')

    try {
      // First, get city coordinates using Aladhan's method
      const response = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(
          cityName
        )}&country=&method=2`
      )

      if (!response.ok) {
        throw new Error('City not found. Try another city name.')
      }

      const data = await response.json()
      const timings = data.data.timings

      const prayerTimes = PRAYER_NAMES.map(name => ({
        name,
        time: timings[name],
      }))

      setPrayers(prayerTimes)
      localStorage.setItem('anchor_prayer_location', cityName)
      setSavedLocation(cityName)
      setShowInput(false)
      setLocation('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Toggle prayer status
  const togglePrayer = (prayerName) => {
    const current = prayerStatus[prayerName] || 'pending'
    const next = current === 'done' ? 'pending' : 'done'

    const updated = { ...prayerStatus, [prayerName]: next }
    storage.setTodayData({ prayerTimes: updated })
    onDataChange()
  }

  // Mark as missed
  const markMissed = (prayerName) => {
    const updated = { ...prayerStatus, [prayerName]: 'missed' }
    storage.setTodayData({ prayerTimes: updated })
    onDataChange()
  }

  // Calculate weekly stats
  const getWeeklyStats = () => {
    let totalPrayers = 0
    let completedPrayers = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const dayPrayers = dateData.prayerTimes || {}

      PRAYER_NAMES.forEach(name => {
        totalPrayers++
        if (dayPrayers[name] === 'done') completedPrayers++
      })
    }

    return { completed: completedPrayers, total: totalPrayers }
  }

  const weekly = getWeeklyStats()

  // Schedule local notifications for today's remaining prayers
  const enablePrayerReminders = async () => {
    const granted = await notifications.requestPermission()
    if (!granted) {
      setNotifStatus('Permission denied — enable notifications in device settings')
      setTimeout(() => setNotifStatus(''), 4000)
      return
    }
    const count = await notifications.schedulePrayerNotifications(prayers)
    setNotifStatus(
      count > 0
        ? `Reminders set for ${count} upcoming prayer${count > 1 ? 's' : ''} today ✓`
        : 'All of today\'s prayers have passed — reminders will be set tomorrow'
    )
    setTimeout(() => setNotifStatus(''), 5000)
  }

  const getStatusIcon = (prayerName) => {
    const status = prayerStatus[prayerName] || 'pending'
    if (status === 'done') return <CheckCircle2 className="text-green-500" size={24} />
    if (status === 'missed') return <Circle className="text-red-500" size={24} />
    return <Circle className="text-gray-600" size={24} />
  }

  const getStatusBg = (prayerName) => {
    const status = prayerStatus[prayerName] || 'pending'
    if (status === 'done') return 'bg-green-900/20 border-green-700/50 hover:bg-green-900/30'
    if (status === 'missed') return 'bg-red-900/20 border-red-700/50 hover:bg-red-900/30'
    return 'bg-gray-900/20 border-gray-700/50 hover:bg-gray-800/20'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Prayer Times</h2>
          <button
            onClick={() => csvExport.exportPrayer()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        {savedLocation && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <MapPin size={16} />
            <span>{savedLocation}</span>
            <button
              onClick={() => setShowInput(true)}
              className="text-blue-400 hover:text-blue-300 ml-2"
            >
              Change
            </button>
          </div>
        )}
      </div>

      {/* Location input */}
      {showInput && (
        <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && fetchPrayers(location)}
              placeholder="Enter your city (e.g., Cairo, New York)"
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
            <button
              onClick={() => fetchPrayers(location)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Set'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      )}

      {/* Weekly stats */}
      {prayers.length > 0 && (
        <div className="mb-6 p-4 bg-blue-900/20 rounded-lg border border-blue-700/50">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(weekly.completed / weekly.total) * 100}%` }}
                />
              </div>
            </div>
            <span className="font-bold whitespace-nowrap">{weekly.completed}/{weekly.total}</span>
          </div>
          <p className="text-xs text-gray-400 mt-2">This week's prayers</p>
        </div>
      )}

      {/* Enable prayer reminders */}
      {prayers.length > 0 && (
        <div className="mb-6">
          <button
            onClick={enablePrayerReminders}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Bell size={18} />
            Enable prayer reminders
          </button>
          {notifStatus && (
            <p className="text-xs text-blue-300 mt-2 text-center">{notifStatus}</p>
          )}
        </div>
      )}

      {/* Prayer times list */}
      {prayers.length > 0 ? (
        <div className="space-y-2">
          {prayers.map(prayer => {
            const status = prayerStatus[prayer.name] || 'pending'
            return (
              <div
                key={prayer.name}
                className={`p-4 rounded-lg border ${getStatusBg(prayer.name)} transition-colors`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{prayer.name}</h3>
                    <p className="text-gray-400 text-sm">{prayer.time}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePrayer(prayer.name)}
                      className="p-2 hover:bg-black/30 rounded transition-colors"
                      title={status === 'done' ? 'Mark pending' : 'Mark done'}
                    >
                      {getStatusIcon(prayer.name)}
                    </button>
                    {status !== 'missed' && (
                      <button
                        onClick={() => markMissed(prayer.name)}
                        className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded transition-colors"
                      >
                        Missed
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2 capitalize">{status}</p>
              </div>
            )
          })}
        </div>
      ) : (
        !showInput && (
          <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-center">
            <p className="text-gray-400">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader size={16} className="animate-spin" />
                  Loading...
                </div>
              ) : (
                'Set your location to see prayer times'
              )}
            </p>
          </div>
        )
      )}
    </div>
  )
}
