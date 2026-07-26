import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Plus, Trash2, CheckCircle2, Circle, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

export default function TodoList({ onDataChange }) {
  const [tasks, setTasks] = useState([])
  const [input, setInput] = useState('')

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todayTasks = todayData.todos || []

  useEffect(() => {
    setTasks(todayTasks)
  }, [todayTasks])

  const addTask = () => {
    if (!input.trim()) return

    const newTask = {
      id: Date.now(),
      text: input.trim(),
      done: false,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const updated = [...tasks, newTask]
    storage.setTodayData({ todos: updated })
    setTasks(updated)
    setInput('')
    onDataChange()
  }

  const toggleTask = (id) => {
    const updated = tasks.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    )
    storage.setTodayData({ todos: updated })
    setTasks(updated)
    onDataChange()
  }

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id)
    storage.setTodayData({ todos: updated })
    setTasks(updated)
    onDataChange()
  }

  const completed = tasks.filter(t => t.done).length
  const total = tasks.length

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">To-Do List</h2>
          <button
            onClick={() => csvExport.exportTodos()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Today's work tasks — {today}</p>
      </div>

      {/* Progress */}
      {total > 0 && (
        <div className="mb-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex-1">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(completed / total) * 100}%` }}
                />
              </div>
            </div>
            <span className="font-bold whitespace-nowrap">{completed}/{total}</span>
          </div>
        </div>
      )}

      {/* Add task form */}
      <div className="mb-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && addTask()}
            placeholder="Add a task..."
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none"
            autoFocus
          />
          <button
            onClick={addTask}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Tasks list */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {/* Pending tasks */}
          {tasks.filter(t => !t.done).length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-400 font-bold px-2">PENDING</p>
              {tasks
                .filter(t => !t.done)
                .map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:bg-gray-900/70 transition-colors flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      <Circle size={20} />
                    </button>
                    <span className="flex-1 text-white">{task.text}</span>
                    <span className="text-xs text-gray-500">{task.createdAt}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}

          {/* Completed tasks */}
          {tasks.filter(t => t.done).length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400 font-bold px-2">COMPLETED</p>
              {tasks
                .filter(t => t.done)
                .map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-green-900/20 rounded-lg border border-green-700/50 flex items-center gap-3"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 text-green-500"
                    >
                      <CheckCircle2 size={20} />
                    </button>
                    <span className="flex-1 text-gray-400 line-through">{task.text}</span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <div className="p-6 text-center bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-gray-400">No tasks yet. Add one to get started! 🎯</p>
        </div>
      )}
    </div>
  )
}
