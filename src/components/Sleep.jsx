import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { AlertCircle, TrendingUp, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

export default function Sleep({ onDataChange }) {
  const [bedtime, setBedtime] = useState('')
  const [waketime, setWaketime] = useState('')
  const [sleepData, setSleepData] = useState({})
  const [trendData, setTrendData] = useState([])

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todaySleep = todayData.sleep || {}

  // Load today's data
  useEffect(() => {
    if (todaySleep.bedtime) setBedtime(todaySleep.bedtime)
    if (todaySleep.waketime) setWaketime(todaySleep.waketime)
    setSleepData(todaySleep)
    loadTrendData()
  }, [todaySleep])

  // Calculate hours slept
  const calculateHours = (bed, wake) => {
    if (!bed || !wake) return 0

    const [bedHour, bedMin] = bed.split(':').map(Number)
    const [wakeHour, wakeMin] = wake.split(':').map(Number)

    let bedTotalMin = bedHour * 60 + bedMin
    let wakeTotalMin = wakeHour * 60 + wakeMin

    // If wake time is "earlier" than bed time, assume it's next day
    if (wakeTotalMin <= bedTotalMin) {
      wakeTotalMin += 24 * 60
    }

    const diffMin = wakeTotalMin - bedTotalMin
    return (diffMin / 60).toFixed(1)
  }

  // Calculate quality score
  const calculateQuality = (hours, bedtime) => {
    let score = 100
    const hoursNum = parseFloat(hours)

    // Deduct for duration outside 7-8 hour range
    if (hoursNum < 6) {
      score -= 50
    } else if (hoursNum < 7) {
      score -= 20
    } else if (hoursNum > 8) {
      score -= 10
    }

    // Deduct for late bedtime (if avg bedtime exists)
    const avgBedtime = getAverageBedtime()
    if (avgBedtime && bedtime) {
      const [bedHour, bedMin] = bedtime.split(':').map(Number)
      const [avgHour, avgMin] = avgBedtime.split(':').map(Number)
      const diff = (bedHour * 60 + bedMin) - (avgHour * 60 + avgMin)

      if (diff > 60) {
        score -= 15
      }
    }

    return Math.max(0, score)
  }

  // Get average bedtime from last 7 days
  const getAverageBedtime = () => {
    let totalMin = 0
    let count = 0

    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const sleep = dateData.sleep || {}

      if (sleep.bedtime) {
        const [hour, min] = sleep.bedtime.split(':').map(Number)
        totalMin += hour * 60 + min
        count++
      }
    }

    if (count === 0) return null

    const avgMin = Math.round(totalMin / count)
    const hour = Math.floor(avgMin / 60)
    const min = avgMin % 60
    return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`
  }

  // Load 7-day trend data
  const loadTrendData = () => {
    const trend = []

    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const sleep = dateData.sleep || {}

      const hours = sleep.bedtime && sleep.waketime
        ? parseFloat(calculateHours(sleep.bedtime, sleep.waketime))
        : 0

      const quality = sleep.bedtime && sleep.waketime
        ? calculateQuality(hours, sleep.bedtime)
        : 0

      trend.push({
        date: dateStr.slice(-2),
        hours,
        quality,
        full: dateStr
      })
    }

    setTrendData(trend)
  }

  // Save sleep data
  const handleSave = () => {
    if (!bedtime || !waketime) {
      alert('Please enter both bedtime and wake time')
      return
    }

    const hours = calculateHours(bedtime, waketime)
    const quality = calculateQuality(hours, bedtime)

    const data = {
      bedtime,
      waketime,
      hours: parseFloat(hours),
      quality,
    }

    storage.setTodayData({ sleep: data })
    setSleepData(data)
    onDataChange()
    loadTrendData()
  }

  const hours = sleepData.hours || 0
  const quality = sleepData.quality || 0
  const avgBedtime = getAverageBedtime()

  const isSleepPoor = hours < 6
  const isBedtimeLate =
    avgBedtime && bedtime && parseInt(bedtime.split(':')[0]) > parseInt(avgBedtime.split(':')[0]) + 1

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Sleep Tracker</h2>
          <button
            onClick={() => csvExport.exportSleep()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Log your sleep for {today}</p>
      </div>

      {/* Input section */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Bedtime</label>
            <input
              type="time"
              value={bedtime}
              onChange={e => setBedtime(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Wake time</label>
            <input
              type="time"
              value={waketime}
              onChange={e => setWaketime(e.target.value)}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          Log Sleep
        </button>
      </div>

      {/* Today's summary */}
      {sleepData.bedtime && (
        <div className="mb-6 space-y-3">
          {/* Alerts */}
          {isSleepPoor && (
            <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-200">Poor sleep</p>
                <p className="text-red-300 text-xs">Under 6 hours detected</p>
              </div>
            </div>
          )}
          {isBedtimeLate && (
            <div className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg flex gap-3">
              <AlertCircle size={20} className="text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-yellow-200">Late bedtime</p>
                <p className="text-yellow-300 text-xs">1+ hour later than your average</p>
              </div>
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <p className="text-gray-400 text-sm">Hours slept</p>
              <p className="text-2xl font-bold mt-1">{hours}h</p>
              <p className="text-xs text-gray-500 mt-1">
                {hours >= 7 && hours <= 8 ? '✓ Target range' : 'Outside 7-8h target'}
              </p>
            </div>
            <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
              <p className="text-gray-400 text-sm">Quality score</p>
              <p className="text-2xl font-bold mt-1">{quality}/100</p>
              <p className="text-xs text-gray-500 mt-1">Based on duration & consistency</p>
            </div>
          </div>

          {/* Consistency info */}
          {avgBedtime && (
            <div className="p-3 bg-gray-900/30 border border-gray-700/50 rounded-lg text-sm">
              <p className="text-gray-400">Your average bedtime: <span className="font-bold text-gray-200">{avgBedtime}</span></p>
              <p className="text-gray-500 text-xs mt-1">(7-day rolling average)</p>
            </div>
          )}
        </div>
      )}

      {/* 7-day trend */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} />
          <h3 className="font-bold">7-day trend</h3>
        </div>

        {/* Bar chart */}
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <div className="space-y-4">
            {/* Hours chart */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Hours slept</p>
              <div className="flex items-end gap-1 h-24">
                {trendData.map(day => (
                  <div
                    key={day.full}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div className="w-full flex flex-col-reverse items-center">
                      <div
                        className={`w-full rounded-t transition-colors ${
                          day.hours === 0
                            ? 'bg-gray-700 h-0'
                            : day.hours >= 7 && day.hours <= 8
                            ? 'bg-green-600'
                            : day.hours < 6
                            ? 'bg-red-600'
                            : 'bg-yellow-600'
                        }`}
                        style={{ height: `${Math.max(day.hours * 12, 4)}px` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">{day.date}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0h</span>
                <span>8h</span>
              </div>
            </div>

            {/* Quality chart */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Quality score</p>
              <div className="flex items-end gap-1 h-20">
                {trendData.map(day => (
                  <div
                    key={day.full}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className={`w-full rounded-t transition-colors ${
                        day.quality === 0
                          ? 'bg-gray-700'
                          : day.quality >= 80
                          ? 'bg-green-600'
                          : day.quality >= 50
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ height: `${Math.max(day.quality * 0.8, 4)}px` }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
