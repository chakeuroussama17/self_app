import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { TrendingUp, DollarSign } from 'lucide-react'

const OCTOBER_1 = new Date(2026, 9, 1)

export default function BusinessDashboard() {
  const [daysLeft, setDaysLeft] = useState(0)
  const [data, setData] = useState({
    trackAStats: null,
    trackBStats: null,
    trackCStats: null,
    trackDStats: null,
    weeklyTrend: []
  })
  const [error, setError] = useState(null)

  useEffect(() => {
    try {
      console.log('Loading business dashboard...')

      // Calculate days left
      const today = new Date()
      const time = OCTOBER_1.getTime() - today.getTime()
      const days = Math.ceil(time / (1000 * 60 * 60 * 24))
      setDaysLeft(Math.max(0, days))

      // Load Track A
      const trackAStats = loadTrackA()
      console.log('Track A loaded:', trackAStats)

      // Load Track B
      const trackBStats = loadTrackB()
      console.log('Track B loaded:', trackBStats)

      // Load Track C
      const trackCStats = loadTrackC()
      console.log('Track C loaded:', trackCStats)

      // Load Track D
      const trackDStats = loadTrackD()
      console.log('Track D loaded:', trackDStats)

      // Load weekly trend
      const weeklyTrend = loadWeeklyTrend()
      console.log('Weekly trend loaded:', weeklyTrend)

      setData({
        trackAStats,
        trackBStats,
        trackCStats,
        trackDStats,
        weeklyTrend
      })
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError(err.message)
    }
  }, [])

  function loadTrackA() {
    const allData = storage.getAllData()
    let totalMessages = 0, totalReplies = 0, totalConversations = 0, totalProposals = 0, totalClients = 0
    let mrrTotal = 0, onetimeTotal = 0
    let lastReplyDate = null, lastClientDate = null

    Object.entries(allData).forEach(([dateStr, dateData]) => {
      const trackA = dateData.businessA || {}
      totalMessages += trackA.messagesSent || 0
      totalReplies += trackA.repliesReceived || 0
      totalConversations += trackA.conversations || 0
      totalProposals += trackA.proposalsSent || 0

      if (trackA.repliesReceived > 0) lastReplyDate = new Date(dateStr)

      if (trackA.clients) {
        totalClients += trackA.clients.length
        trackA.clients.forEach(client => {
          if (client.type === 'monthly') mrrTotal += client.value
          else onetimeTotal += client.value
          lastClientDate = new Date(dateStr)
        })
      }
    })

    return {
      messages: totalMessages,
      replies: totalReplies,
      conversations: totalConversations,
      proposals: totalProposals,
      clients: totalClients,
      mrrTotal,
      onetimeTotal,
      totalRevenue: mrrTotal + onetimeTotal,
      replyRate: totalMessages > 0 ? ((totalReplies / totalMessages) * 100).toFixed(1) : 0,
      convRate: totalReplies > 0 ? ((totalConversations / totalReplies) * 100).toFixed(1) : 0,
      closeRate: totalProposals > 0 ? ((totalClients / totalProposals) * 100).toFixed(1) : 0,
      lastReplyDate,
      lastClientDate
    }
  }

  function loadTrackB() {
    const saved = localStorage.getItem('anchor_business_trackB_deals')
    const deals = saved ? JSON.parse(saved) : []

    const byStage = {
      lead: 0, contacted: 0, 'demo-sent': 0, proposal: 0, negotiating: 0, won: 0, lost: 0
    }
    deals.forEach(d => { if (byStage[d.status] !== undefined) byStage[d.status]++ })

    return {
      totalDeals: deals.length,
      byStage,
      wonValue: deals.filter(d => d.status === 'won').reduce((s, d) => s + (d.priceQuoted || 0), 0),
      activeDeals: deals.filter(d => d.status !== 'won' && d.status !== 'lost').length
    }
  }

  function loadTrackC() {
    const milestones = localStorage.getItem('anchor_business_trackC_milestones')
    const metrics = localStorage.getItem('anchor_business_trackC_metrics')

    const parsedMilestones = milestones ? JSON.parse(milestones) : {}
    const parsedMetrics = metrics ? JSON.parse(metrics) : {}

    return {
      downloads: parseInt(parsedMetrics.downloads) || 0,
      activeUsers: parseInt(parsedMetrics.activeUsers) || 0,
      payingSubscribers: parseInt(parsedMetrics.payingSubscribers) || 0,
      mrrApp: parseInt(parsedMetrics.mrrApp) || 0,
      completedMilestones: Object.values(parsedMilestones).filter(Boolean).length,
      totalMilestones: 6
    }
  }

  function loadTrackD() {
    const saved = localStorage.getItem('anchor_business_trackD_apps')
    const apps = saved ? JSON.parse(saved) : []

    const submitted = apps.filter(a => ['submitted', 'interview', 'result'].includes(a.status)).length

    return {
      total: apps.length,
      submitted,
      upcomingDeadlines: apps.length > 0 ? apps.slice(0, 3) : []
    }
  }

  function loadWeeklyTrend() {
    const allData = storage.getAllData()
    const trend = []

    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      let messages = 0, conversations = 0, clients = 0, revenue = 0

      for (let j = 0; j < 7; j++) {
        const checkDate = new Date(date)
        checkDate.setDate(checkDate.getDate() + j - i * 7)
        const checkDateStr = checkDate.toISOString().split('T')[0]
        const dateData = allData[checkDateStr] || {}
        const trackA = dateData.businessA || {}

        messages += trackA.messagesSent || 0
        conversations += trackA.conversations || 0
        if (trackA.clients) {
          clients += trackA.clients.length
          trackA.clients.forEach(c => { revenue += c.value })
        }
      }

      if (messages > 0 || conversations > 0 || clients > 0) {
        trend.push({ week: `W${i}`, messages, conversations, clients, revenue })
      }
    }

    return trend
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg">
          <p className="text-red-200 font-bold">Error loading dashboard</p>
          <p className="text-red-300 text-sm mt-2">{error}</p>
          <p className="text-xs text-gray-400 mt-3">Check console for details. Try refreshing the page.</p>
        </div>
      </div>
    )
  }

  if (!data.trackAStats) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const { trackAStats, trackBStats, trackCStats, trackDStats, weeklyTrend } = data

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Business Progress Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Track your path to revenue by October 1</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Days left</p>
          <p className="text-5xl font-bold text-orange-400">{daysLeft}</p>
        </div>
      </div>

      {/* Revenue card */}
      <div className="p-6 bg-gradient-to-r from-green-900/20 to-blue-900/20 border border-green-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2">
              <DollarSign size={20} />
              Revenue So Far
            </h3>
            <p className="text-xs text-gray-400 mt-1">MRR: ${trackAStats.mrrTotal} | One-time: ${trackAStats.onetimeTotal}</p>
          </div>
          <p className="text-4xl font-bold text-green-400">${trackAStats.totalRevenue}</p>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 mt-4">
          <div
            className="bg-green-600 h-3 rounded-full"
            style={{ width: `${Math.min((trackAStats.totalRevenue / 10000) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="Messages" value={trackAStats.messages} icon="📤" />
        <MetricCard label="Reply Rate" value={`${trackAStats.replyRate}%`} icon="✓" />
        <MetricCard label="Conversations" value={trackAStats.conversations} icon="💬" />
        <MetricCard label="Deals Closed" value={trackAStats.clients} icon="🎯" />
      </div>

      {/* Track summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-3">📤 Track A: Outreach</h3>
          <div className="space-y-2 text-sm">
            <Line label="Messages" value={trackAStats.messages} />
            <Line label="Replies" value={trackAStats.replies} />
            <Line label="Conversations" value={trackAStats.conversations} />
            <Line label="Proposals" value={trackAStats.proposals} />
            <Line label="Clients" value={trackAStats.clients} />
            <Line label="Close Rate" value={`${trackAStats.closeRate}%`} />
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-3">🔄 Track B: Pipeline</h3>
          <div className="space-y-2 text-sm">
            <Line label="Total Deals" value={trackBStats.totalDeals} />
            <Line label="Active Deals" value={trackBStats.activeDeals} />
            <Line label="Won" value={trackBStats.byStage.won} />
            <Line label="Won Value" value={`$${trackBStats.wonValue}`} />
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-3">🚀 Track C: App</h3>
          <div className="space-y-2 text-sm">
            <Line label="Milestones" value={`${trackCStats.completedMilestones}/${trackCStats.totalMilestones}`} />
            <Line label="Downloads" value={trackCStats.downloads} />
            <Line label="Active Users" value={trackCStats.activeUsers} />
            <Line label="Paying Subs" value={trackCStats.payingSubscribers} />
            <Line label="MRR" value={`$${trackCStats.mrrApp}`} />
          </div>
        </div>

        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-3">🎓 Track D: Scholarships</h3>
          <div className="space-y-2 text-sm">
            <Line label="Applications" value={trackDStats.total} />
            <Line label="Submitted" value={trackDStats.submitted} />
          </div>
        </div>
      </div>

      {/* Weekly trend chart */}
      {weeklyTrend.length > 0 && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Weekly Trend
          </h3>
          <div className="flex items-end gap-2 h-40 overflow-x-auto pb-2">
            {weeklyTrend.map((week, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-12 flex items-end gap-1 h-32">
                  <div
                    className="flex-1 bg-blue-600 rounded-t"
                    style={{ height: `${Math.max((week.messages / Math.max(...weeklyTrend.map(w => w.messages), 1)) * 100, 2)}%` }}
                  />
                  <div
                    className="flex-1 bg-purple-600 rounded-t"
                    style={{ height: `${Math.max((week.conversations / Math.max(...weeklyTrend.map(w => w.conversations), 1)) * 100, 2)}%` }}
                  />
                  <div
                    className="flex-1 bg-green-600 rounded-t"
                    style={{ height: `${Math.max((week.clients / Math.max(...weeklyTrend.map(w => w.clients), 1)) * 100, 5)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{week.week}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3 text-xs">
            <span>🔵 Messages</span>
            <span>🟣 Conversations</span>
            <span>🟢 Clients</span>
          </div>
        </div>
      )}

      {/* No data message */}
      {weeklyTrend.length === 0 && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-center text-gray-400">
          <p>No activity logged yet. Start logging your outreach to see trends!</p>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon }) {
  return (
    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  )
}

function Line({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  )
}
