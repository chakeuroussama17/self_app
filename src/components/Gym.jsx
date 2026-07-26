import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Plus, Trash2, Copy, TrendingUp, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

export default function Gym({ onDataChange }) {
  const [exercise, setExercise] = useState('')
  const [weight, setWeight] = useState('')
  const [reps, setReps] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [workouts, setWorkouts] = useState([])
  const [showChart, setShowChart] = useState(null)
  const [setsAdded, setSetsAdded] = useState(0)

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todayWorkouts = todayData.gym || []

  // Load today's workouts
  useEffect(() => {
    setWorkouts(todayWorkouts)
  }, [todayWorkouts])

  // Get all unique exercise names from history
  const getAllExercises = () => {
    const allData = storage.getAllData()
    const exercises = new Set()

    Object.values(allData).forEach(dateData => {
      const dayWorkouts = dateData.gym || []
      dayWorkouts.forEach(w => {
        if (w.exercise) exercises.add(w.exercise)
      })
    })

    return Array.from(exercises).sort()
  }

  // Handle exercise input with autocomplete
  const handleExerciseChange = (value) => {
    setExercise(value)

    if (value.trim().length > 0) {
      const allExercises = getAllExercises()
      const filtered = allExercises.filter(e =>
        e.toLowerCase().includes(value.toLowerCase())
      )
      setSuggestions(filtered.slice(0, 5))
    } else {
      setSuggestions([])
    }
  }

  // Add a single set
  const addSet = () => {
    if (!exercise.trim() || !weight || !reps) {
      alert('Please fill exercise name, weight, and reps')
      return
    }

    const newSet = {
      id: Date.now(),
      exercise: exercise.trim(),
      weight: parseFloat(weight),
      reps: parseInt(reps),
      sets: 1,
      volume: parseFloat(weight) * parseInt(reps),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...workouts, newSet]
    storage.setTodayData({ gym: updated })
    setWorkouts(updated)
    onDataChange()

    // Clear weight/reps only, keep exercise for next set
    setWeight('')
    setReps('')
    setSetsAdded(setsAdded + 1)
  }

  // Switch to new exercise
  const switchExercise = () => {
    if (!exercise.trim() || !weight || !reps) {
      alert('Please fill exercise name, weight, and reps')
      return
    }

    // Save current set first
    addSet()

    // Then clear everything for new exercise
    setTimeout(() => {
      setExercise('')
      setWeight('')
      setReps('')
      setSuggestions([])
      setSetsAdded(0)
    }, 0)
  }

  // Get last workout
  const getLastWorkout = () => {
    const allData = storage.getAllData()
    const dates = Object.keys(allData).sort().reverse()

    for (const date of dates) {
      if (date === today) continue
      const dayWorkouts = allData[date].gym || []
      if (dayWorkouts.length > 0) {
        return dayWorkouts
      }
    }
    return null
  }

  // Repeat last workout
  const repeatLastWorkout = () => {
    const lastWorkout = getLastWorkout()
    if (!lastWorkout) {
      alert('No previous workouts found')
      return
    }

    const updated = [...workouts, ...lastWorkout.map(w => ({
      ...w,
      id: Date.now() + Math.random(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }))]

    storage.setTodayData({ gym: updated })
    setWorkouts(updated)
    onDataChange()
  }

  // Delete workout
  const deleteWorkout = (id) => {
    const updated = workouts.filter(w => w.id !== id)
    storage.setTodayData({ gym: updated })
    setWorkouts(updated)
    onDataChange()
  }

  // Get exercise history for chart
  const getExerciseHistory = (exerciseName) => {
    const allData = storage.getAllData()
    const history = []

    const dates = Object.keys(allData).sort()
    dates.forEach(date => {
      const dayWorkouts = allData[date].gym || []
      const matching = dayWorkouts.filter(w => w.exercise.toLowerCase() === exerciseName.toLowerCase())

      if (matching.length > 0) {
        const maxWeight = Math.max(...matching.map(w => w.weight))
        const totalVolume = matching.reduce((sum, w) => sum + w.volume, 0)

        history.push({
          date,
          weight: maxWeight,
          volume: totalVolume,
          count: matching.length
        })
      }
    })

    return history
  }

  // Get unique exercises from today
  const uniqueExercises = [...new Set(workouts.map(w => w.exercise))]
  const lastWorkout = getLastWorkout()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Gym Tracker</h2>
          <button
            onClick={() => csvExport.exportGym()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Log your workouts for {today}</p>
      </div>

      {/* Quick add form */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <div className="relative">
          <label className="block text-sm text-gray-400 mb-2">Exercise</label>
          <input
            type="text"
            value={exercise}
            onChange={e => handleExerciseChange(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && weight && reps && addSet()}
            placeholder="Bench press, squats, etc."
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            autoFocus
          />
          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded z-10">
              {suggestions.map(ex => (
                <button
                  key={ex}
                  onClick={() => {
                    setExercise(ex)
                    setSuggestions([])
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-gray-700 text-sm"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {exercise && (
          <div className="text-sm text-gray-400 py-2">
            📝 {setsAdded > 0 && `${setsAdded} set${setsAdded > 1 ? 's' : ''} added •`} Now entering set {setsAdded + 1}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Weight (kg)</label>
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && reps && addSet()}
              placeholder="85"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Reps</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && weight && addSet()}
              placeholder="8"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={addSet}
            disabled={!exercise.trim() || !weight || !reps}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Set
          </button>
          <button
            onClick={switchExercise}
            disabled={!exercise.trim() || !weight || !reps}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded font-medium transition-colors"
          >
            New Exercise
          </button>
          {lastWorkout && (
            <button
              onClick={repeatLastWorkout}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-medium flex items-center justify-center gap-2 transition-colors"
              title="Repeat last workout"
            >
              <Copy size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Today's workouts */}
      {workouts.length > 0 ? (
        <div className="mb-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <span className="text-lg">{workouts.length} sets logged</span>
          </h3>

          {/* Grouped by exercise */}
          <div className="space-y-4">
            {uniqueExercises.map(exName => {
              const exerciseSets = workouts.filter(w => w.exercise === exName)
              const totalVolume = exerciseSets.reduce((sum, w) => sum + w.volume, 0)
              const maxWeight = Math.max(...exerciseSets.map(w => w.weight))

              return (
                <div
                  key={exName}
                  className="p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg">{exName}</h4>
                      <p className="text-xs text-gray-400">
                        {exerciseSets.length} set{exerciseSets.length > 1 ? 's' : ''} • Max: {maxWeight}kg • Volume: {totalVolume.toFixed(0)}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowChart(showChart === exName ? null : exName)}
                      className="p-2 hover:bg-gray-800 rounded transition-colors"
                      title="Show progress chart"
                    >
                      <TrendingUp size={18} className="text-blue-400" />
                    </button>
                  </div>

                  {/* Sets list */}
                  <div className="space-y-2 mb-3">
                    {exerciseSets.map((w, idx) => (
                      <div
                        key={w.id}
                        className="flex items-center justify-between text-sm bg-gray-800/50 p-2 rounded"
                      >
                        <span className="text-gray-300">
                          Set {idx + 1}: {w.weight}kg × {w.reps}r ({w.volume.toFixed(0)} vol)
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{w.timestamp}</span>
                          <button
                            onClick={() => deleteWorkout(w.id)}
                            className="p-1 hover:bg-red-900/30 rounded transition-colors"
                          >
                            <Trash2 size={16} className="text-red-400" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress chart */}
                  {showChart === exName && (
                    <ExerciseChart exercise={exName} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-800 text-center">
          <p className="text-gray-400">No workouts logged yet</p>
          {lastWorkout && (
            <p className="text-sm text-gray-500 mt-2">
              👉 Use copy icon to quickly repeat your last workout
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// Exercise progress chart component
function ExerciseChart({ exercise }) {
  const history = (() => {
    const allData = storage.getAllData()
    const hist = []
    const dates = Object.keys(allData).sort()

    dates.forEach(date => {
      const dayWorkouts = allData[date].gym || []
      const matching = dayWorkouts.filter(w => w.exercise.toLowerCase() === exercise.toLowerCase())

      if (matching.length > 0) {
        const maxWeight = Math.max(...matching.map(w => w.weight))
        hist.push({
          date: date.slice(-2),
          weight: maxWeight,
          fullDate: date
        })
      }
    })

    return hist
  })()

  if (history.length === 0) return null

  const maxWeight = Math.max(...history.map(h => h.weight))
  const minWeight = Math.min(...history.map(h => h.weight))
  const range = maxWeight - minWeight || 1

  return (
    <div className="mt-3 p-3 bg-gray-800/50 rounded border border-gray-700">
      <p className="text-xs text-gray-400 mb-2">Weight progression</p>
      <div className="flex items-end gap-1 h-20">
        {history.slice(-14).map((day, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full bg-blue-600 rounded-t transition-all hover:bg-blue-500"
              style={{
                height: `${((day.weight - minWeight) / range) * 80 + 4}px`
              }}
              title={`${day.weight}kg on ${day.fullDate}`}
            />
            <p className="text-xs text-gray-500">{day.date}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>{minWeight}kg</span>
        <span>{maxWeight}kg</span>
      </div>
    </div>
  )
}
