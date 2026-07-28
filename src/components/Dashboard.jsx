import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { CheckCircle2, Circle, AlertCircle, TrendingUp, Target } from 'lucide-react'
import BusinessDashboard from './BusinessDashboard'

export default function Dashboard({ onDataChange }) {
  const [showBusiness, setShowBusiness] = useState(false)
  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()

  const modules = [
    { key: 'prayer', label: 'Prayer', status: todayData.prayer || 'pending' },
    { key: 'sleep', label: 'Sleep', status: todayData.sleep || 'pending' },
    { key: 'gym', label: 'Gym', status: todayData.gym || 'pending' },
    { key: 'meditation', label: 'Meditation', status: todayData.meditation || 'pending' },
    { key: 'social', label: 'Social', status: todayData.social || 'pending' },
    { key: 'business', label: 'Business', status: todayData.business || 'pending' },
  ]

  const completed = modules.filter(m => m.status === 'done').length
  const total = modules.length

  const getStatusIcon = (status) => {
    if (status === 'done') return <CheckCircle2 className="text-green-500" size={24} />
    if (status === 'missed') return <AlertCircle className="text-red-500" size={24} />
    return <Circle className="text-gray-600" size={24} />
  }

  const getStatusColor = (status) => {
    if (status === 'done') return 'bg-green-900/20 border-green-700/50'
    if (status === 'missed') return 'bg-red-900/20 border-red-700/50'
    return 'bg-gray-900/20 border-gray-700/50'
  }

  if (showBusiness) {
    return (
      <div>
        <button
          onClick={() => setShowBusiness(false)}
          className="fixed top-6 left-6 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded font-medium text-sm transition-colors z-10"
        >
          ← Back to Daily
        </button>
        <BusinessDashboard />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Anchor</h1>
        <p className="text-gray-400">{today}</p>
      </div>

      {/* Business summary card */}
      <BusinessSummaryCard onViewFull={() => setShowBusiness(true)} />
      <div className="mb-8"></div>

      {/* Progress overview */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="w-full bg-gray-800 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all"
                style={{ width: `${(completed / total) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xl font-bold">{completed}/{total}</span>
        </div>
      </div>

      {/* Module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map(module => (
          <div
            key={module.key}
            className={`p-4 rounded-lg border border-gray-700 ${getStatusColor(module.status)}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{module.label}</span>
              {getStatusIcon(module.status)}
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {module.status === 'done' && 'Completed'}
              {module.status === 'missed' && 'Missed'}
              {module.status === 'pending' && 'Not started'}
            </div>
          </div>
        ))}
      </div>

      {/* Quick info */}
      <div className="mt-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
        <p className="text-xs text-gray-400">
          👉 Click on any module in the bottom nav to log your progress
        </p>
      </div>
    </div>
  )
}

function BusinessSummaryCard({ onViewFull }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    loadBusinessStats()
  }, [])

  const loadBusinessStats = () => {
    const allData = storage.getAllData()
    let mrrTotal = 0
    let onetimeTotal = 0
    let weekMessages = 0
    let weekReplies = 0
    let weekConversations = 0

    // Calculate weekly totals
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = allData[dateStr] || {}
      const trackA = dateData.businessA || {}

      weekMessages += trackA.messagesSent || 0
      weekReplies += trackA.repliesReceived || 0
      weekConversations += trackA.conversations || 0

      if (trackA.clients) {
        trackA.clients.forEach(client => {
          if (client.type === 'monthly') {
            mrrTotal += client.value
          } else {
            onetimeTotal += client.value
          }
        })
      }
    }

    // Load pipeline deals
    const dealsStr = storage.getItem('anchor_business_trackB_deals')
    const deals = dealsStr ? JSON.parse(dealsStr) : []
    const activePipeline = deals.filter(d => d.status !== 'won' && d.status !== 'lost').length

    // Days until October 1
    const OCTOBER_1 = new Date(2026, 9, 1)
    const today = new Date()
    const daysLeft = Math.ceil((OCTOBER_1.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    setStats({
      mrrTotal,
      onetimeTotal,
      totalRevenue: mrrTotal + onetimeTotal,
      weekMessages,
      weekReplies,
      weekConversations,
      replyRate: weekMessages > 0 ? ((weekReplies / weekMessages) * 100).toFixed(1) : 0,
      activePipeline,
      daysLeft: Math.max(0, daysLeft)
    })
  }

  if (!stats) return null

  return (
    <button
      onClick={onViewFull}
      className="w-full mb-6 p-4 bg-gradient-to-r from-purple-900/30 to-orange-900/30 border border-purple-700/50 rounded-lg hover:from-purple-900/40 hover:to-orange-900/40 transition-all text-left"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-400" />
            Business Progress
          </h3>
          <p className="text-xs text-gray-400 mt-1">This week • {stats.daysLeft} days until October 1</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Revenue</p>
          <p className="text-2xl font-bold text-green-400">${stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div>
          <p className="text-gray-400">Messages</p>
          <p className="font-bold text-lg">{stats.weekMessages}</p>
        </div>
        <div>
          <p className="text-gray-400">Reply Rate</p>
          <p className="font-bold text-lg text-green-400">{stats.replyRate}%</p>
        </div>
        <div>
          <p className="text-gray-400">Conversations</p>
          <p className="font-bold text-lg">{stats.weekConversations}</p>
        </div>
        <div>
          <p className="text-gray-400">Active Deals</p>
          <p className="font-bold text-lg text-blue-400">{stats.activePipeline}</p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">Click to view detailed dashboard →</p>
    </button>
  )
}
