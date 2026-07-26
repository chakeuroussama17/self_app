import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Plus, Trash2, TrendingUp, Settings, Calendar, X, Edit2, ChevronRight, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

const OCTOBER_1 = new Date(2026, 9, 1)

export default function Business({ onDataChange }) {
  const [activeTrack, setActiveTrack] = useState('A')

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Business Tracker</h2>
        <p className="text-gray-400 text-sm">Four parallel tracks → October 1 revenue goal</p>
      </div>

      {/* Days until October 1 - Always visible */}
      <CountdownBanner />

      {/* Track tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto border-b border-gray-700 pb-4">
        {[
          { id: 'A', label: 'Outreach', icon: '📤' },
          { id: 'B', label: 'Pipeline', icon: '🔄' },
          { id: 'C', label: 'App Launch', icon: '🚀' },
          { id: 'D', label: 'Scholarships', icon: '🎓' },
          { id: 'review', label: 'Weekly Review', icon: '📊' },
        ].map(track => (
          <button
            key={track.id}
            onClick={() => setActiveTrack(track.id)}
            className={`px-4 py-2 rounded font-medium whitespace-nowrap transition-colors text-sm ${
              activeTrack === track.id
                ? 'bg-blue-900 text-blue-200'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {track.icon} {track.label}
          </button>
        ))}
      </div>

      {/* Render active track */}
      {activeTrack === 'A' && <TrackA />}
      {activeTrack === 'B' && <TrackB />}
      {activeTrack === 'C' && <TrackC />}
      {activeTrack === 'D' && <TrackD />}
      {activeTrack === 'review' && <WeeklyReview />}
    </div>
  )
}

// Countdown banner
function CountdownBanner() {
  const [daysLeft, setDaysLeft] = useState(0)

  useEffect(() => {
    const today = new Date()
    const time = OCTOBER_1.getTime() - today.getTime()
    const days = Math.ceil(time / (1000 * 60 * 60 * 24))
    setDaysLeft(Math.max(0, days))
  }, [])

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-700/50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Revenue goal deadline</p>
          <p className="text-2xl font-bold text-orange-400 mt-1">October 1, 2026</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Days remaining</p>
          <p className="text-4xl font-bold text-orange-300">{daysLeft}</p>
        </div>
      </div>
    </div>
  )
}

// TRACK A: Outreach & Client Acquisition
function TrackA() {
  const [connReq, setConnReq] = useState('')
  const [msgSent, setMsgSent] = useState('')
  const [repliesRecv, setRepliesRecv] = useState('')
  const [conversations, setConversations] = useState('')
  const [propSent, setPropSent] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientValue, setClientValue] = useState('')
  const [clientType, setClientType] = useState('one-time')
  const [dailyLogs, setDailyLogs] = useState([])
  const [targets, setTargets] = useState({ connections: 100, conversations: 20, proposals: 1 })
  const [editingTargets, setEditingTargets] = useState(false)

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todayTrackA = todayData.businessA || {}

  useEffect(() => {
    if (todayTrackA.connections !== undefined) setConnReq(todayTrackA.connections)
    if (todayTrackA.messagesSent !== undefined) setMsgSent(todayTrackA.messagesSent)
    if (todayTrackA.repliesReceived !== undefined) setRepliesRecv(todayTrackA.repliesReceived)
    if (todayTrackA.conversations !== undefined) setConversations(todayTrackA.conversations)
    if (todayTrackA.proposalsSent !== undefined) setPropSent(todayTrackA.proposalsSent)

    loadWeeklyLogs()

    const saved = localStorage.getItem('anchor_business_targets')
    if (saved) setTargets(JSON.parse(saved))
  }, [])

  const saveDailyEntry = () => {
    const entry = {
      connections: connReq ? parseInt(connReq) : 0,
      messagesSent: msgSent ? parseInt(msgSent) : 0,
      repliesReceived: repliesRecv ? parseInt(repliesRecv) : 0,
      conversations: conversations ? parseInt(conversations) : 0,
      proposalsSent: propSent ? parseInt(propSent) : 0,
      clients: todayTrackA.clients || []
    }

    if (clientName.trim() && clientValue) {
      entry.clients.push({
        id: Date.now(),
        name: clientName.trim(),
        value: parseFloat(clientValue),
        type: clientType
      })
      setClientName('')
      setClientValue('')
      setClientType('one-time')
    }

    storage.setTodayData({ businessA: entry })
    loadWeeklyLogs()
  }

  const deleteClient = (clientId) => {
    const updated = {
      ...todayTrackA,
      clients: (todayTrackA.clients || []).filter(c => c.id !== clientId)
    }
    storage.setTodayData({ businessA: updated })
    loadWeeklyLogs()
  }

  const loadWeeklyLogs = () => {
    const week = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const trackA = dateData.businessA || {}

      week.push({
        date: dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        ...trackA
      })
    }
    setDailyLogs(week)
  }

  const saveTargets = () => {
    localStorage.setItem('anchor_business_targets', JSON.stringify(targets))
    setEditingTargets(false)
  }

  const calculateWeekly = () => {
    let totals = {
      connections: 0,
      messages: 0,
      replies: 0,
      conversations: 0,
      proposals: 0,
      clients: 0,
      clientsData: []
    }

    dailyLogs.forEach(day => {
      totals.connections += day.connections || 0
      totals.messages += day.messagesSent || 0
      totals.replies += day.repliesReceived || 0
      totals.conversations += day.conversations || 0
      totals.proposals += day.proposalsSent || 0
      if (day.clients) {
        totals.clients += day.clients.length
        totals.clientsData.push(...day.clients)
      }
    })

    totals.replyRate = totals.messages > 0 ? ((totals.replies / totals.messages) * 100).toFixed(1) : 0
    totals.conversationRate = totals.replies > 0 ? ((totals.conversations / totals.replies) * 100).toFixed(1) : 0
    totals.closeRate = totals.proposals > 0 ? ((totals.clients / totals.proposals) * 100).toFixed(1) : 0

    return totals
  }

  const calculateRevenue = () => {
    const allData = storage.getAllData()
    let mrrTotal = 0
    let onetimeTotal = 0

    Object.values(allData).forEach(dateData => {
      const trackA = dateData.businessA || {}
      if (trackA.clients) {
        trackA.clients.forEach(client => {
          if (client.type === 'monthly') {
            mrrTotal += client.value
          } else {
            onetimeTotal += client.value
          }
        })
      }
    })

    return { mrrTotal, onetimeTotal }
  }

  const getDaysSinceLastReply = () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const trackA = dateData.businessA || {}
      if (trackA.repliesReceived > 0) return i
    }
    return null
  }

  const getDaysSinceLastClient = () => {
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const trackA = dateData.businessA || {}
      if (trackA.clients && trackA.clients.length > 0) return i
    }
    return null
  }

  const weekly = calculateWeekly()
  const revenue = calculateRevenue()
  const daysSinceReply = getDaysSinceLastReply()
  const daysSinceClient = getDaysSinceLastClient()

  return (
    <div className="space-y-6">
      <button
        onClick={() => csvExport.exportTrackA()}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
      >
        <Download size={16} />
        Download CSV
      </button>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard label="MRR" value={`$${revenue.mrrTotal}`} color="green" />
        <MetricCard label="One-time Revenue" value={`$${revenue.onetimeTotal}`} color="blue" />
        <MetricCard label="Days Since Reply" value={daysSinceReply ?? '—'} color={daysSinceReply && daysSinceReply > 7 ? 'red' : 'yellow'} />
        <MetricCard label="Days Since Client" value={daysSinceClient ?? '—'} color={daysSinceClient && daysSinceClient > 14 ? 'red' : 'yellow'} />
      </div>

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <h3 className="font-bold flex items-center gap-2">
          <Calendar size={18} />
          Today's Entry ({storage.getTodayDate()})
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <input
            type="number"
            value={connReq}
            onChange={e => setConnReq(e.target.value)}
            placeholder="Conn. Req"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <input
            type="number"
            value={msgSent}
            onChange={e => setMsgSent(e.target.value)}
            placeholder="Msgs Sent"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <input
            type="number"
            value={repliesRecv}
            onChange={e => setRepliesRecv(e.target.value)}
            placeholder="Replies"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <input
            type="number"
            value={conversations}
            onChange={e => setConversations(e.target.value)}
            placeholder="Conversations"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <input
            type="number"
            value={propSent}
            onChange={e => setPropSent(e.target.value)}
            placeholder="Proposals"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
        </div>

        <button
          onClick={saveDailyEntry}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors text-sm"
        >
          Save Daily Entry
        </button>
      </div>

      {todayTrackA.clients && todayTrackA.clients.length > 0 && (
        <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
          <h3 className="font-bold mb-2 text-green-200">Clients Closed Today</h3>
          <div className="space-y-2">
            {todayTrackA.clients.map(client => (
              <div key={client.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded text-sm">
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-xs text-gray-400">${client.value} • {client.type}</p>
                </div>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <h3 className="font-bold">Add Client (Optional)</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            placeholder="Client name"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="number"
            value={clientValue}
            onChange={e => setClientValue(e.target.value)}
            placeholder="$ Value"
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <select
            value={clientType}
            onChange={e => setClientType(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          >
            <option value="one-time">One-time</option>
            <option value="monthly">Monthly Recurring</option>
          </select>
          <button
            onClick={() => {
              if (clientName.trim() && clientValue) {
                saveDailyEntry()
              }
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors text-sm"
          >
            Add Client
          </button>
        </div>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <TrendingUp size={18} />
          This Week's Performance
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatBox label="Messages" value={weekly.messages} />
          <StatBox label="Reply Rate" value={`${weekly.replyRate}%`} />
          <StatBox label="Conversations" value={weekly.conversations} />
          <StatBox label="Conv. Rate" value={`${weekly.conversationRate}%`} />
          <StatBox label="Proposals" value={weekly.proposals} />
          <StatBox label="Close Rate" value={`${weekly.closeRate}%`} />
        </div>

        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-bold">Weekly Targets</p>
            <button
              onClick={() => setEditingTargets(!editingTargets)}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>

          {editingTargets ? (
            <div className="space-y-2 mb-2">
              <input
                type="number"
                value={targets.connections}
                onChange={e => setTargets({ ...targets, connections: parseInt(e.target.value) })}
                placeholder="Connections target"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              />
              <input
                type="number"
                value={targets.conversations}
                onChange={e => setTargets({ ...targets, conversations: parseInt(e.target.value) })}
                placeholder="Conversations target"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              />
              <input
                type="number"
                value={targets.proposals}
                onChange={e => setTargets({ ...targets, proposals: parseInt(e.target.value) })}
                placeholder="Proposals target"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              />
              <button
                onClick={saveTargets}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium text-sm transition-colors"
              >
                Save Targets
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <ProgressBar label={`Connections: ${weekly.connections}/${targets.connections}`} current={weekly.connections} target={targets.connections} />
              <ProgressBar label={`Conversations: ${weekly.conversations}/${targets.conversations}`} current={weekly.conversations} target={targets.conversations} />
              <ProgressBar label={`Proposals: ${weekly.proposals}/${targets.proposals}`} current={weekly.proposals} target={targets.proposals} />
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="font-bold mb-3">7-Day Log</h3>
        <div className="overflow-x-auto text-sm">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 border-b border-gray-700">
                <th className="text-left py-2 px-2">Day</th>
                <th className="text-center py-2 px-2">Conn</th>
                <th className="text-center py-2 px-2">Msgs</th>
                <th className="text-center py-2 px-2">Replies</th>
                <th className="text-center py-2 px-2">Conv</th>
                <th className="text-center py-2 px-2">Props</th>
                <th className="text-center py-2 px-2">Clients</th>
              </tr>
            </thead>
            <tbody>
              {dailyLogs.map(day => (
                <tr key={day.date} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="text-left py-2 px-2 text-xs">{day.dayName}</td>
                  <td className="text-center py-2 px-2">{day.connections || 0}</td>
                  <td className="text-center py-2 px-2">{day.messagesSent || 0}</td>
                  <td className="text-center py-2 px-2">{day.repliesReceived || 0}</td>
                  <td className="text-center py-2 px-2">{day.conversations || 0}</td>
                  <td className="text-center py-2 px-2">{day.proposalsSent || 0}</td>
                  <td className="text-center py-2 px-2">{(day.clients || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// TRACK B: Automation Product Pipeline
function TrackB() {
  const [deals, setDeals] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    business: '',
    niche: '',
    source: 'linkedin',
    automationType: 'lead-capture',
    priceQuoted: '',
    nextAction: '',
    nextActionDate: '',
    status: 'lead'
  })

  useEffect(() => {
    const saved = localStorage.getItem('anchor_business_trackB_deals')
    if (saved) setDeals(JSON.parse(saved))
  }, [])

  const saveDeals = (updated) => {
    setDeals(updated)
    localStorage.setItem('anchor_business_trackB_deals', JSON.stringify(updated))
  }

  const addDeal = () => {
    if (!formData.business.trim()) {
      alert('Please enter business name')
      return
    }

    const newDeal = {
      id: Date.now(),
      ...formData,
      priceQuoted: formData.priceQuoted ? parseFloat(formData.priceQuoted) : null,
      createdDate: storage.getTodayDate()
    }

    saveDeals([...deals, newDeal])
    setFormData({
      business: '',
      niche: '',
      source: 'linkedin',
      automationType: 'lead-capture',
      priceQuoted: '',
      nextAction: '',
      nextActionDate: '',
      status: 'lead'
    })
    setShowForm(false)
  }

  const updateDealStatus = (id, newStatus) => {
    const updated = deals.map(d => d.id === id ? { ...d, status: newStatus } : d)
    saveDeals(updated)
  }

  const deleteDeal = (id) => {
    saveDeals(deals.filter(d => d.id !== id))
  }

  const statuses = ['lead', 'contacted', 'demo-sent', 'proposal', 'negotiating', 'won', 'lost']
  const statusLabels = {
    lead: 'Lead',
    contacted: 'Contacted',
    'demo-sent': 'Demo Sent',
    proposal: 'Proposal',
    negotiating: 'Negotiating',
    won: '✓ Won',
    lost: '✗ Lost'
  }

  const statusColors = {
    lead: 'bg-gray-800',
    contacted: 'bg-blue-900/30',
    'demo-sent': 'bg-cyan-900/30',
    proposal: 'bg-purple-900/30',
    negotiating: 'bg-yellow-900/30',
    won: 'bg-green-900/30',
    lost: 'bg-red-900/30'
  }

  // Funnel stats
  const funnelStats = {}
  statuses.forEach(s => {
    funnelStats[s] = deals.filter(d => d.status === s).length
  })

  return (
    <div className="space-y-6">
      <button
        onClick={() => csvExport.exportTrackB()}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
      >
        <Download size={16} />
        Download CSV
      </button>

      {/* Funnel view */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="font-bold mb-4">Sales Funnel</h3>
        <div className="space-y-2">
          {statuses.map(status => (
            <div key={status}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{statusLabels[status]}</span>
                <span className="font-bold">{funnelStats[status]}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${statusColors[status]}`}
                  style={{ width: `${Math.max((funnelStats[status] / Math.max(...Object.values(funnelStats), 1)) * 100, 5)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add deal button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={18} />
        Add Deal
      </button>

      {/* Add deal form */}
      {showForm && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
          <input
            type="text"
            value={formData.business}
            onChange={e => setFormData({ ...formData, business: e.target.value })}
            placeholder="Business name"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="text"
            value={formData.niche}
            onChange={e => setFormData({ ...formData, niche: e.target.value })}
            placeholder="Niche (e.g., e-commerce, SaaS)"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <select
            value={formData.source}
            onChange={e => setFormData({ ...formData, source: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          >
            <option value="linkedin">LinkedIn</option>
            <option value="referral">Referral</option>
            <option value="cold">Cold Outreach</option>
            <option value="other">Other</option>
          </select>
          <select
            value={formData.automationType}
            onChange={e => setFormData({ ...formData, automationType: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          >
            <option value="lead-capture">Lead Capture</option>
            <option value="invoice">Invoice Processing</option>
            <option value="chatbot">Chatbot</option>
            <option value="custom">Custom</option>
          </select>
          <input
            type="number"
            value={formData.priceQuoted}
            onChange={e => setFormData({ ...formData, priceQuoted: e.target.value })}
            placeholder="Price quoted ($)"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
            min="0"
          />
          <input
            type="text"
            value={formData.nextAction}
            onChange={e => setFormData({ ...formData, nextAction: e.target.value })}
            placeholder="Next action (e.g., send proposal)"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="date"
            value={formData.nextActionDate}
            onChange={e => setFormData({ ...formData, nextActionDate: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <button
            onClick={addDeal}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors text-sm"
          >
            Save Deal
          </button>
        </div>
      )}

      {/* Deals list */}
      <div className="space-y-3">
        {deals.length === 0 ? (
          <p className="text-gray-400 text-sm">No deals yet. Add one to get started.</p>
        ) : (
          deals.map(deal => (
            <div key={deal.id} className={`p-4 rounded-lg border border-gray-700 ${statusColors[deal.status]}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold">{deal.business}</h4>
                  <p className="text-xs text-gray-400">{deal.niche}</p>
                </div>
                <button
                  onClick={() => deleteDeal(deal.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="text-xs text-gray-300 mb-2 space-y-1">
                <p>Source: {deal.source} • Type: {deal.automationType}</p>
                {deal.priceQuoted && <p>Price: ${deal.priceQuoted}</p>}
                {deal.nextAction && <p>Next: {deal.nextAction} {deal.nextActionDate && `by ${deal.nextActionDate}`}</p>}
              </div>
              <div className="flex gap-1 flex-wrap">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => updateDealStatus(deal.id, status)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      deal.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// TRACK C: App Launch
function TrackC() {
  const [milestones, setMilestones] = useState({
    deployed: false,
    appStoreSubmitted: false,
    marketingReady: false,
    launchDay: false,
    firstTenUsers: false,
    firstPayingUser: false
  })
  const [weeklyMetrics, setWeeklyMetrics] = useState({
    downloads: '',
    activeUsers: '',
    payingSubscribers: '',
    mrrApp: '',
    marketingNote: ''
  })
  const [weeklyHistory, setWeeklyHistory] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('anchor_business_trackC_milestones')
    if (saved) setMilestones(JSON.parse(saved))

    const savedMetrics = localStorage.getItem('anchor_business_trackC_metrics')
    if (savedMetrics) {
      const parsed = JSON.parse(savedMetrics)
      setWeeklyMetrics(parsed)
    }

    const savedHistory = localStorage.getItem('anchor_business_trackC_history')
    if (savedHistory) setWeeklyHistory(JSON.parse(savedHistory))
  }, [])

  const toggleMilestone = (key) => {
    const updated = { ...milestones, [key]: !milestones[key] }
    setMilestones(updated)
    localStorage.setItem('anchor_business_trackC_milestones', JSON.stringify(updated))
  }

  const saveMetrics = () => {
    localStorage.setItem('anchor_business_trackC_metrics', JSON.stringify(weeklyMetrics))

    const entry = {
      week: storage.getTodayDate(),
      ...weeklyMetrics
    }
    const updated = [...weeklyHistory, entry]
    setWeeklyHistory(updated)
    localStorage.setItem('anchor_business_trackC_history', JSON.stringify(updated))

    alert('Weekly metrics saved!')
  }

  const milestoneList = [
    { key: 'deployed', label: 'Deployed' },
    { key: 'appStoreSubmitted', label: 'App Store Submitted' },
    { key: 'marketingReady', label: 'Marketing Assets Ready' },
    { key: 'launchDay', label: 'Launch Day' },
    { key: 'firstTenUsers', label: 'First 10 Users' },
    { key: 'firstPayingUser', label: 'First Paying Subscriber' }
  ]

  const completedMilestones = Object.values(milestones).filter(Boolean).length

  return (
    <div className="space-y-6">
      <button
        onClick={() => csvExport.exportTrackC()}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
      >
        <Download size={16} />
        Download CSV
      </button>

      {/* Milestone checklist */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="font-bold mb-4">Milestones ({completedMilestones}/{milestoneList.length})</h3>
        <div className="space-y-2">
          {milestoneList.map(milestone => (
            <button
              key={milestone.key}
              onClick={() => toggleMilestone(milestone.key)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                milestones[milestone.key]
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-sm ${
                  milestones[milestone.key]
                    ? 'bg-green-600 border-green-600'
                    : 'border-gray-600'
                }`}>
                  {milestones[milestone.key] && '✓'}
                </div>
                <span className="font-medium">{milestone.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Weekly metrics */}
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <h3 className="font-bold">Weekly Metrics Update</h3>
        <input
          type="number"
          value={weeklyMetrics.downloads}
          onChange={e => setWeeklyMetrics({ ...weeklyMetrics, downloads: e.target.value })}
          placeholder="Downloads/Signups"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          min="0"
        />
        <input
          type="number"
          value={weeklyMetrics.activeUsers}
          onChange={e => setWeeklyMetrics({ ...weeklyMetrics, activeUsers: e.target.value })}
          placeholder="Active Users"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          min="0"
        />
        <input
          type="number"
          value={weeklyMetrics.payingSubscribers}
          onChange={e => setWeeklyMetrics({ ...weeklyMetrics, payingSubscribers: e.target.value })}
          placeholder="Paying Subscribers"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          min="0"
        />
        <input
          type="number"
          value={weeklyMetrics.mrrApp}
          onChange={e => setWeeklyMetrics({ ...weeklyMetrics, mrrApp: e.target.value })}
          placeholder="MRR from App ($)"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          min="0"
        />
        <textarea
          value={weeklyMetrics.marketingNote}
          onChange={e => setWeeklyMetrics({ ...weeklyMetrics, marketingNote: e.target.value })}
          placeholder="What marketing action did you take this week? (post, ad, outreach, etc.)"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm h-20 resize-none"
        />
        <button
          onClick={saveMetrics}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors text-sm"
        >
          Save Weekly Metrics
        </button>
      </div>

      {/* Historical metrics */}
      {weeklyHistory.length > 0 && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold mb-3">Historical Metrics</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {weeklyHistory.slice().reverse().map((entry, idx) => (
              <div key={idx} className="p-2 bg-gray-800/50 rounded text-sm">
                <p className="text-xs text-gray-400 mb-1">{entry.week}</p>
                <p className="text-xs">📥 {entry.downloads} downloads • 👥 {entry.activeUsers} active • 💰 {entry.payingSubscribers} paying</p>
                {entry.mrrApp && <p className="text-xs">💵 ${entry.mrrApp} MRR</p>}
                {entry.marketingNote && <p className="text-xs italic text-gray-300 mt-1">"{entry.marketingNote}"</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// TRACK D: Scholarship & Opportunity Applications
function TrackD() {
  const [apps, setApps] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    deadline: '',
    status: 'researching',
    result: ''
  })

  useEffect(() => {
    const saved = localStorage.getItem('anchor_business_trackD_apps')
    if (saved) setApps(JSON.parse(saved))
  }, [])

  const saveApps = (updated) => {
    setApps(updated)
    localStorage.setItem('anchor_business_trackD_apps', JSON.stringify(updated))
  }

  const addApp = () => {
    if (!formData.name.trim() || !formData.deadline) {
      alert('Please enter name and deadline')
      return
    }

    const newApp = {
      id: Date.now(),
      ...formData
    }

    saveApps([...apps, newApp])
    setFormData({ name: '', country: '', deadline: '', status: 'researching', result: '' })
    setShowForm(false)
  }

  const updateApp = (id, updates) => {
    const updated = apps.map(a => a.id === id ? { ...a, ...updates } : a)
    saveApps(updated)
  }

  const deleteApp = (id) => {
    saveApps(apps.filter(a => a.id !== id))
  }

  const getDaysUntilDeadline = (deadline) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const time = deadlineDate.getTime() - today.getTime()
    return Math.ceil(time / (1000 * 60 * 60 * 24))
  }

  const statuses = ['researching', 'docs-prep', 'submitted', 'interview', 'result']
  const statusLabels = {
    researching: 'Researching',
    'docs-prep': 'Docs Prep',
    submitted: 'Submitted',
    interview: 'Interview',
    result: 'Result'
  }

  const submitted = apps.filter(a => a.status === 'submitted' || a.status === 'interview' || a.status === 'result').length

  // Sort by deadline
  const sortedApps = [...apps].sort((a, b) => new Date(a.deadline) - new Date(b.deadline))

  // Upcoming deadlines
  const upcomingDeadlines = sortedApps.filter(a => {
    const days = getDaysUntilDeadline(a.deadline)
    return days > 0 && days <= 14
  })

  return (
    <div className="space-y-6">
      <button
        onClick={() => csvExport.exportTrackD()}
        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
      >
        <Download size={16} />
        Download CSV
      </button>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Applications" value={apps.length} color="blue" />
        <MetricCard label="Submitted" value={submitted} color="green" />
      </div>

      {/* Upcoming deadlines alert */}
      {upcomingDeadlines.length > 0 && (
        <div className="p-4 bg-orange-900/20 border border-orange-700/50 rounded-lg">
          <h3 className="font-bold text-orange-200 mb-2">⏰ Upcoming Deadlines (14 days)</h3>
          <div className="space-y-1 text-sm">
            {upcomingDeadlines.map(app => (
              <p key={app.id} className="text-orange-300">
                {app.name} — {getDaysUntilDeadline(app.deadline)} days left
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Add app button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors text-sm"
      >
        <Plus size={18} />
        Add Application
      </button>

      {/* Add form */}
      {showForm && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Scholarship/Opportunity name"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="text"
            value={formData.country}
            onChange={e => setFormData({ ...formData, country: e.target.value })}
            placeholder="Country"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <input
            type="date"
            value={formData.deadline}
            onChange={e => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />
          <button
            onClick={addApp}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors text-sm"
          >
            Save
          </button>
        </div>
      )}

      {/* Applications list */}
      <div className="space-y-3">
        {sortedApps.map(app => {
          const daysLeft = getDaysUntilDeadline(app.deadline)
          const isUrgent = daysLeft > 0 && daysLeft <= 14

          return (
            <div key={app.id} className={`p-4 rounded-lg border ${isUrgent ? 'bg-orange-900/20 border-orange-700/50' : 'bg-gray-900/50 border-gray-700'}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold">{app.name}</h4>
                  <p className="text-xs text-gray-400">{app.country} • Deadline: {app.deadline} ({daysLeft} days)</p>
                </div>
                <button
                  onClick={() => deleteApp(app.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X size={18} />
                </button>
              </div>

              {app.result && (
                <p className="text-sm font-bold mb-2">
                  Result: <span className={app.result === 'accepted' ? 'text-green-400' : 'text-red-400'}>{app.result}</span>
                </p>
              )}

              <div className="flex gap-1 flex-wrap">
                {statuses.map(status => (
                  <button
                    key={status}
                    onClick={() => updateApp(app.id, { status })}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      app.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {statusLabels[status]}
                  </button>
                ))}
              </div>

              {app.status === 'result' && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => updateApp(app.id, { result: 'accepted' })}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      app.result === 'accepted'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    ✓ Accepted
                  </button>
                  <button
                    onClick={() => updateApp(app.id, { result: 'rejected' })}
                    className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                      app.result === 'rejected'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  >
                    ✕ Rejected
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Weekly Review
function WeeklyReview() {
  const [review, setReview] = useState('')

  useEffect(() => {
    const weekStart = getWeekStart(storage.getTodayDate())
    const saved = localStorage.getItem(`anchor_business_review_${weekStart}`)
    if (saved) setReview(saved)
  }, [])

  const getWeekStart = (dateStr) => {
    const date = new Date(dateStr)
    const dayOfWeek = date.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const start = new Date(date)
    start.setDate(start.getDate() - daysToMonday)
    return start.toISOString().split('T')[0]
  }

  const saveReview = () => {
    const weekStart = getWeekStart(storage.getTodayDate())
    localStorage.setItem(`anchor_business_review_${weekStart}`, review)
    alert('Review saved!')
  }

  // Gather weekly data
  const gatherWeeklyData = () => {
    const week = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const trackA = dateData.businessA || {}
      week.push(trackA)
    }

    let totals = {
      messages: 0,
      replies: 0,
      conversations: 0,
      proposals: 0,
      clients: 0
    }

    week.forEach(day => {
      totals.messages += day.messagesSent || 0
      totals.replies += day.repliesReceived || 0
      totals.conversations += day.conversations || 0
      totals.proposals += day.proposalsSent || 0
      if (day.clients) totals.clients += day.clients.length
    })

    return totals
  }

  const weeklyData = gatherWeeklyData()

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="font-bold mb-4">Weekly Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Messages</p>
            <p className="text-2xl font-bold">{weeklyData.messages}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Replies</p>
            <p className="text-2xl font-bold">{weeklyData.replies}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Conversations</p>
            <p className="text-2xl font-bold">{weeklyData.conversations}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Proposals</p>
            <p className="text-2xl font-bold">{weeklyData.proposals}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Deals</p>
            <p className="text-2xl font-bold">{weeklyData.clients}</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
        <h3 className="font-bold">What Worked / What Didn't</h3>
        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="Reflect on your week: What messaging worked? Which channels paid off? What should you do differently? Any wins or blockers?"
          className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none h-32 resize-none"
        />
        <button
          onClick={saveReview}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          Save Review
        </button>
      </div>

      <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-200">
        <p>💡 This review space is for you to capture insights before the week ends. Reflect on what worked, what didn't, and what to try differently next week.</p>
      </div>
    </div>
  )
}

// Helper components
function MetricCard({ label, value, color }) {
  const bgColor = {
    green: 'bg-green-900/20 border-green-700/50',
    blue: 'bg-blue-900/20 border-blue-700/50',
    yellow: 'bg-yellow-900/20 border-yellow-700/50',
    red: 'bg-red-900/20 border-red-700/50'
  }[color]

  return (
    <div className={`p-3 rounded-lg border ${bgColor}`}>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-xl font-bold mt-1">{value}</p>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="bg-gray-800/50 p-2 rounded text-center">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  )
}

function ProgressBar({ label, current, target }) {
  const percent = Math.min((current / target) * 100, 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-gray-500">{Math.round(percent)}%</span>
      </div>
      <div className="w-full bg-gray-800 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
