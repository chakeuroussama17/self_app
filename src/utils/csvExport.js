import { storage } from './storage'

export const csvExport = {
  // Convert array of objects to CSV string
  convertToCSV: (data, headers) => {
    if (!data || data.length === 0) {
      return headers.join(',')
    }

    const rows = data.map(item =>
      headers.map(header => {
        const value = header.split('.').reduce((obj, key) => obj?.[key], item)
        // Escape quotes and wrap in quotes if contains comma or quote
        const stringValue = String(value || '')
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue
      })
    )

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  },

  // Download CSV file
  downloadCSV: (csvContent, filename) => {
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent))
    element.setAttribute('download', filename)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  },

  // Export Prayer data
  exportPrayer: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const prayerTimes = data.prayerTimes || {}
      const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

      prayers.forEach(prayer => {
        rows.push({
          date,
          prayer,
          status: prayerTimes[prayer] || 'not logged'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'prayer', 'status'])
    csvExport.downloadCSV(csv, `prayer_tracker_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Sleep data
  exportSleep: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const sleep = data.sleep || {}
      if (sleep.bedtime || sleep.waketime) {
        rows.push({
          date,
          bedtime: sleep.bedtime || '-',
          waketime: sleep.waketime || '-',
          hours: sleep.hours || '-',
          quality_score: sleep.quality || '-'
        })
      }
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'bedtime', 'waketime', 'hours', 'quality_score'])
    csvExport.downloadCSV(csv, `sleep_tracker_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Gym data
  exportGym: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const gym = data.gym || []
      gym.forEach(set => {
        rows.push({
          date,
          exercise: set.exercise,
          weight_kg: set.weight,
          reps: set.reps,
          sets: set.sets,
          volume: set.volume,
          time: set.timestamp || '-'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'exercise', 'weight_kg', 'reps', 'sets', 'volume', 'time'])
    csvExport.downloadCSV(csv, `gym_tracker_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Meditation data
  exportMeditation: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const meditation = data.meditation || []
      meditation.forEach(session => {
        rows.push({
          date,
          duration_minutes: session.duration,
          time: session.timestamp || '-'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'duration_minutes', 'time'])
    csvExport.downloadCSV(csv, `meditation_tracker_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Social data
  exportSocial: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const social = data.social || []
      social.forEach(interaction => {
        rows.push({
          date,
          name: interaction.name,
          type: interaction.type,
          note: interaction.note || '-',
          time: interaction.timestamp || '-'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'name', 'type', 'note', 'time'])
    csvExport.downloadCSV(csv, `social_tracker_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Track A (Outreach)
  exportTrackA: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const trackA = data.businessA || {}
      if (
        trackA.connections ||
        trackA.messagesSent ||
        trackA.repliesReceived ||
        trackA.conversations ||
        trackA.proposalsSent ||
        trackA.clients
      ) {
        const clientsList = trackA.clients?.map(c => `${c.name}($${c.value}-${c.type})`).join('; ') || '-'

        rows.push({
          date,
          connections_requests: trackA.connections || 0,
          messages_sent: trackA.messagesSent || 0,
          replies_received: trackA.repliesReceived || 0,
          conversations: trackA.conversations || 0,
          proposals_sent: trackA.proposalsSent || 0,
          clients_closed: trackA.clients?.length || 0,
          client_details: clientsList
        })
      }
    })

    const csv = csvExport.convertToCSV(rows, [
      'date',
      'connections_requests',
      'messages_sent',
      'replies_received',
      'conversations',
      'proposals_sent',
      'clients_closed',
      'client_details'
    ])
    csvExport.downloadCSV(csv, `business_track_a_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Track B (Pipeline)
  exportTrackB: () => {
    const saved = storage.getItem('anchor_business_trackB_deals')
    const deals = saved ? JSON.parse(saved) : []

    const rows = deals.map(deal => ({
      business: deal.business,
      niche: deal.niche,
      source: deal.source,
      automation_type: deal.automationType,
      price_quoted: deal.priceQuoted || '-',
      status: deal.status,
      next_action: deal.nextAction || '-',
      next_action_date: deal.nextActionDate || '-',
      created_date: deal.createdDate || '-'
    }))

    const csv = csvExport.convertToCSV(rows, [
      'business',
      'niche',
      'source',
      'automation_type',
      'price_quoted',
      'status',
      'next_action',
      'next_action_date',
      'created_date'
    ])
    csvExport.downloadCSV(csv, `business_track_b_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Track C (App)
  exportTrackC: () => {
    const saved = storage.getItem('anchor_business_trackC_history')
    const history = saved ? JSON.parse(saved) : []

    const rows = history.map(entry => ({
      week: entry.week,
      downloads_signups: entry.downloads || 0,
      active_users: entry.activeUsers || 0,
      paying_subscribers: entry.payingSubscribers || 0,
      mrr_app: entry.mrrApp || 0,
      marketing_action: entry.marketingNote || '-'
    }))

    const csv = csvExport.convertToCSV(rows, [
      'week',
      'downloads_signups',
      'active_users',
      'paying_subscribers',
      'mrr_app',
      'marketing_action'
    ])
    csvExport.downloadCSV(csv, `business_track_c_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Track D (Scholarships)
  exportTrackD: () => {
    const saved = storage.getItem('anchor_business_trackD_apps')
    const apps = saved ? JSON.parse(saved) : []

    const rows = apps.map(app => ({
      name: app.name,
      country: app.country || '-',
      deadline: app.deadline,
      status: app.status,
      result: app.result || '-'
    }))

    const csv = csvExport.convertToCSV(rows, ['name', 'country', 'deadline', 'status', 'result'])
    csvExport.downloadCSV(csv, `business_track_d_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export Content Creation
  exportContent: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const videos = data.contentVideos || []
      videos.forEach(video => {
        rows.push({
          date,
          title: video.title,
          language: video.language,
          views: video.views || 0,
          followers_gained: video.followers || 0,
          notes: video.notes || '-',
          tiktok_link: video.tiktokLink || '-'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, [
      'date',
      'title',
      'language',
      'views',
      'followers_gained',
      'notes',
      'tiktok_link'
    ])
    csvExport.downloadCSV(csv, `content_creation_${new Date().toISOString().split('T')[0]}.csv`)
  },

  // Export To-Do List
  exportTodos: () => {
    const allData = storage.getAllData()
    const rows = []

    Object.entries(allData).forEach(([date, data]) => {
      const todos = data.todos || []
      todos.forEach(todo => {
        rows.push({
          date,
          task: todo.text,
          status: todo.done ? 'done' : 'pending',
          created_at: todo.createdAt || '-'
        })
      })
    })

    const csv = csvExport.convertToCSV(rows, ['date', 'task', 'status', 'created_at'])
    csvExport.downloadCSV(csv, `todos_${new Date().toISOString().split('T')[0]}.csv`)
  }
}
