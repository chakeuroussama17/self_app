import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Plus, Trash2, Users, Target, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

export default function Social({ onDataChange }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('friend')
  const [note, setNote] = useState('')
  const [interactions, setInteractions] = useState([])
  const [weeklyView, setWeeklyView] = useState([])

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todayInteractions = todayData.social || []

  // Load today's interactions
  useEffect(() => {
    setInteractions(todayInteractions)
  }, [todayInteractions])

  // Load weekly view
  useEffect(() => {
    loadWeeklyView()
  }, [interactions])

  // Get day of week name
  const getDayName = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  // Check if date is weekend (Saturday=6, Sunday=0)
  const isWeekend = (dateStr) => {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()
    return dayOfWeek === 0 || dayOfWeek === 6
  }

  // Get start of current week (Monday)
  const getWeekStart = (dateStr) => {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const start = new Date(date)
    start.setDate(start.getDate() - daysToMonday)
    return start.toISOString().split('T')[0]
  }

  // Get end of current week (Sunday)
  const getWeekEnd = (dateStr) => {
    const weekStart = getWeekStart(dateStr)
    const start = new Date(weekStart)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return end.toISOString().split('T')[0]
  }

  // Load this week's data for view
  const loadWeeklyView = () => {
    const weekStart = getWeekStart(today)
    const weekEnd = getWeekEnd(today)
    const allData = storage.getAllData()
    const week = []

    let current = new Date(weekStart)
    const end = new Date(weekEnd)
    end.setDate(end.getDate() + 1)

    while (current < end) {
      const dateStr = current.toISOString().split('T')[0]
      const dateData = allData[dateStr] || {}
      const dayInteractions = dateData.social || []
      const isWeekendDay = isWeekend(dateStr)
      const hasInteraction = dayInteractions.length > 0

      week.push({
        date: dateStr,
        dayName: getDayName(dateStr),
        isWeekend: isWeekendDay,
        interactions: dayInteractions,
        hit: isWeekendDay && hasInteraction
      })

      current.setDate(current.getDate() + 1)
    }

    setWeeklyView(week)
  }

  // Add interaction
  const addInteraction = () => {
    if (!name.trim()) {
      alert('Please enter a name or initial')
      return
    }

    const newInteraction = {
      id: Date.now(),
      name: name.trim(),
      type,
      note: note.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...interactions, newInteraction]
    storage.setTodayData({ social: updated })
    setInteractions(updated)
    onDataChange()

    // Reset form
    setName('')
    setType('friend')
    setNote('')
  }

  // Delete interaction
  const deleteInteraction = (id) => {
    const updated = interactions.filter(i => i.id !== id)
    storage.setTodayData({ social: updated })
    setInteractions(updated)
    onDataChange()
  }

  // Calculate weekend streak
  const getWeekendStreak = () => {
    let streak = 0
    let currentDate = new Date()

    // Start from last Sunday
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    // Count backwards from last Sunday
    while (true) {
      // Check both Saturday and Sunday for that weekend
      const saturday = new Date(currentDate)
      saturday.setDate(saturday.getDate() - 1)
      const saturdayStr = saturday.toISOString().split('T')[0]
      const sundayStr = currentDate.toISOString().split('T')[0]

      const saturdayData = storage.getDateData(saturdayStr)
      const sundayData = storage.getDateData(sundayStr)
      const saturdayInteractions = saturdayData.social || []
      const sundayInteractions = sundayData.social || []

      if (saturdayInteractions.length > 0 || sundayInteractions.length > 0) {
        streak++
      } else {
        break
      }

      currentDate.setDate(currentDate.getDate() - 7)
    }

    return streak
  }

  // Get this week's weekend goal status
  const getThisWeekendStatus = () => {
    const weekStart = getWeekStart(today)
    const allData = storage.getAllData()

    // Get Saturday and Sunday of this week
    const startDate = new Date(weekStart)
    let saturday, sunday

    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(startDate)
      checkDate.setDate(checkDate.getDate() + i)
      if (checkDate.getDay() === 6) {
        saturday = checkDate.toISOString().split('T')[0]
        sunday = new Date(checkDate)
        sunday.setDate(sunday.getDate() + 1)
        sunday = sunday.toISOString().split('T')[0]
        break
      }
    }

    if (!saturday || !sunday) return null

    const saturdayData = allData[saturday] || {}
    const sundayData = allData[sunday] || {}
    const saturdayInteractions = saturdayData.social || []
    const sundayInteractions = sundayData.social || []

    const hasInteraction = saturdayInteractions.length > 0 || sundayInteractions.length > 0

    return {
      hasInteraction,
      saturdayStr: saturday,
      sundayStr: sunday,
      totalInteractions: saturdayInteractions.length + sundayInteractions.length
    }
  }

  const weekendStreak = getWeekendStreak()
  const thisWeekendStatus = getThisWeekendStatus()

  const typeColors = {
    friend: 'bg-blue-900/30 text-blue-200 border-blue-700/50',
    new: 'bg-green-900/30 text-green-200 border-green-700/50'
  }

  const typeName = {
    friend: 'Friend',
    new: 'New Person/Date'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Social Tracker</h2>
          <button
            onClick={() => csvExport.exportSocial()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Log your social interactions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Target size={14} className="text-purple-500" />
            <p className="text-xs text-gray-400">This weekend</p>
          </div>
          <p className="text-2xl font-bold mt-1">
            {thisWeekendStatus?.hasInteraction ? '✓' : '○'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {thisWeekendStatus?.totalInteractions || 0} interaction{thisWeekendStatus?.totalInteractions !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
          <div className="flex items-center gap-1 mb-1">
            <Users size={14} className="text-orange-500" />
            <p className="text-xs text-gray-400">Weekend streak</p>
          </div>
          <p className="text-2xl font-bold mt-1">{weekendStreak}</p>
          <p className="text-xs text-gray-500 mt-1">weeks in a row</p>
        </div>
      </div>

      {/* Add interaction form */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Name/Initial</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && addInteraction()}
              placeholder="John, Alex, etc."
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            >
              <option value="friend">Friend</option>
              <option value="new">New Person/Date</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Note (optional)</label>
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addInteraction()}
            placeholder="Coffee, dinner, call..."
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
        </div>

        <button
          onClick={addInteraction}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} />
          Log Interaction
        </button>
      </div>

      {/* Today's interactions */}
      {interactions.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="font-bold">Today's interactions ({interactions.length})</h3>
          <div className="space-y-2">
            {interactions.map(interaction => (
              <div
                key={interaction.id}
                className={`p-3 rounded-lg border ${typeColors[interaction.type]}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <p className="font-bold">{interaction.name}</p>
                    <p className="text-xs opacity-80">{typeName[interaction.type]}</p>
                  </div>
                  <button
                    onClick={() => deleteInteraction(interaction.id)}
                    className="px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
                {interaction.note && (
                  <p className="text-xs opacity-75 mt-1">{interaction.note}</p>
                )}
                <p className="text-xs opacity-60 mt-1">{interaction.timestamp}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* This week's view */}
      {weeklyView.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold">This week</h3>
          <div className="space-y-2">
            {weeklyView.map(day => (
              <div
                key={day.date}
                className={`p-3 rounded-lg border ${
                  day.isWeekend
                    ? day.hit
                      ? 'bg-green-900/20 border-green-700/50'
                      : 'bg-red-900/20 border-red-700/50'
                    : 'bg-gray-900/30 border-gray-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium text-sm">{day.dayName}</p>
                  {day.isWeekend && (
                    <span className="text-xs px-2 py-0.5 bg-black/30 rounded">
                      {day.hit ? '✓ Goal met' : '○ No interaction'}
                    </span>
                  )}
                </div>
                {day.interactions.length > 0 ? (
                  <p className="text-xs text-gray-400">
                    {day.interactions.length} interaction{day.interactions.length !== 1 ? 's' : ''}: {day.interactions.map(i => i.name).join(', ')}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">No interactions</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
