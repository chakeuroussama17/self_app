import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Play, Pause, RotateCcw, Flame, Clock, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

const PRESETS = [5, 10, 15, 20]

export default function Meditation({ onDataChange }) {
  const [customMinutes, setCustomMinutes] = useState('')
  const [duration, setDuration] = useState(null) // in seconds
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState([])

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todaySessions = todayData.meditation || []

  // Load today's sessions
  useEffect(() => {
    setSessions(todaySessions)
  }, [todaySessions])

  // Timer logic
  useEffect(() => {
    let interval
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            setIsRunning(false)
            // Auto-save session
            saveSession(duration)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRunning, timeLeft, duration])

  // Start timer with preset or custom duration
  const startTimer = (minutes) => {
    if (isRunning) return
    const seconds = minutes * 60
    setDuration(seconds)
    setTimeLeft(seconds)
    setIsRunning(true)
    setCustomMinutes('')
  }

  // Start custom timer
  const startCustom = () => {
    const minutes = parseInt(customMinutes)
    if (!minutes || minutes < 1 || minutes > 180) {
      alert('Enter minutes between 1 and 180')
      return
    }
    startTimer(minutes)
  }

  // Save session
  const saveSession = (seconds) => {
    if (!seconds || seconds < 60) {
      // Don't save if less than 1 minute
      return
    }

    const minutes = Math.round(seconds / 60)
    const newSession = {
      id: Date.now(),
      duration: minutes,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...sessions, newSession]
    storage.setTodayData({ meditation: updated })
    setSessions(updated)
    onDataChange()

    // Reset timer
    setTimeLeft(null)
    setDuration(null)
  }

  // Pause/resume
  const togglePause = () => {
    setIsRunning(!isRunning)
  }

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false)
    setTimeLeft(null)
    setDuration(null)
  }

  // Skip to end (save session manually)
  const skipToEnd = () => {
    if (duration) {
      saveSession(duration)
      resetTimer()
    }
  }

  // Delete session
  const deleteSession = (id) => {
    const updated = sessions.filter(s => s.id !== id)
    storage.setTodayData({ meditation: updated })
    setSessions(updated)
    onDataChange()
  }

  // Calculate stats
  const getTodayStats = () => {
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0)
    return {
      sessions: sessions.length,
      totalMinutes
    }
  }

  // Calculate streak
  const getStreak = () => {
    let streak = 0
    let currentDate = new Date()

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const daySessions = dateData.meditation || []

      if (daySessions.length === 0) break

      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }

  // Calculate monthly total
  const getMonthlyTotal = () => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let total = 0
    const allData = storage.getAllData()

    Object.entries(allData).forEach(([dateStr, data]) => {
      const date = new Date(dateStr)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        const daySessions = data.meditation || []
        total += daySessions.reduce((sum, s) => sum + s.duration, 0)
      }
    })

    return total
  }

  const todayStats = getTodayStats()
  const streak = getStreak()
  const monthlyTotal = getMonthlyTotal()

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const progressPercent = duration ? ((duration - (timeLeft || 0)) / duration) * 100 : 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Meditation</h2>
          <button
            onClick={() => csvExport.exportMeditation()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Today: {today}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <p className="text-xs text-gray-400">Today</p>
          <p className="text-2xl font-bold mt-1">{todayStats.totalMinutes}m</p>
          <p className="text-xs text-gray-500 mt-1">{todayStats.sessions} session{todayStats.sessions !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Flame size={14} className="text-orange-500" />
            <p className="text-xs text-gray-400">Streak</p>
          </div>
          <p className="text-2xl font-bold mt-1">{streak}d</p>
          <p className="text-xs text-gray-500 mt-1">days</p>
        </div>
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Clock size={14} className="text-purple-500" />
            <p className="text-xs text-gray-400">This month</p>
          </div>
          <p className="text-2xl font-bold mt-1">{monthlyTotal}m</p>
          <p className="text-xs text-gray-500 mt-1">total</p>
        </div>
      </div>

      {/* Timer */}
      <div className="mb-6 p-6 bg-gray-900/50 rounded-lg border border-gray-700">
        {/* Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold font-mono mb-2 text-blue-400">
            {formatTime(timeLeft)}
          </div>
          {duration && (
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Preset buttons */}
        {!isRunning && !timeLeft && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESETS.map(mins => (
              <button
                key={mins}
                onClick={() => startTimer(mins)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded font-bold transition-colors text-sm"
              >
                {mins}m
              </button>
            ))}
          </div>
        )}

        {/* Custom input */}
        {!isRunning && !timeLeft && (
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={customMinutes}
              onChange={e => setCustomMinutes(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && startCustom()}
              placeholder="Custom minutes"
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              min="1"
              max="180"
            />
            <button
              onClick={startCustom}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded font-medium transition-colors text-sm"
            >
              Go
            </button>
          </div>
        )}

        {/* Control buttons */}
        {timeLeft && (
          <div className="flex gap-2">
            <button
              onClick={togglePause}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isRunning ? (
                <>
                  <Pause size={18} />
                  Pause
                </>
              ) : (
                <>
                  <Play size={18} />
                  Resume
                </>
              )}
            </button>
            <button
              onClick={skipToEnd}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
            >
              Done
            </button>
            <button
              onClick={resetTimer}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium flex items-center justify-center transition-colors"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Today's sessions */}
      {sessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">Today's sessions</h3>
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700"
              >
                <div>
                  <p className="font-medium">{session.duration} min</p>
                  <p className="text-xs text-gray-500">{session.timestamp}</p>
                </div>
                <button
                  onClick={() => deleteSession(session.id)}
                  className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
