import { useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { Plus, Trash2, Edit2, TrendingUp, Globe, Eye, Users, Download } from 'lucide-react'
import { csvExport } from '../utils/csvExport'

export default function ContentCreation({ onDataChange }) {
  const [videos, setVideos] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    language: 'english',
    notes: '',
    tiktokLink: '',
    views: '',
    followers: ''
  })
  const [weeklyStats, setWeeklyStats] = useState(null)

  const today = storage.getTodayDate()
  const todayData = storage.getTodayData()
  const todayVideos = todayData.contentVideos || []

  useEffect(() => {
    setVideos(todayVideos)
    calculateWeeklyStats()
  }, [todayVideos])

  const calculateWeeklyStats = () => {
    let weekVideos = 0
    let weekViews = 0
    let weekFollowers = 0
    let videosByLang = { english: 0, arabic: 0, french: 0 }
    let viewsByLang = { english: 0, arabic: 0, french: 0 }

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dateData = storage.getDateData(dateStr)
      const dayVideos = dateData.contentVideos || []

      dayVideos.forEach(video => {
        weekVideos++
        weekViews += parseInt(video.views) || 0
        weekFollowers += parseInt(video.followers) || 0
        videosByLang[video.language]++
        viewsByLang[video.language] += parseInt(video.views) || 0
      })
    }

    setWeeklyStats({
      videos: weekVideos,
      views: weekViews,
      followers: weekFollowers,
      videosByLang,
      viewsByLang,
      avgViewsPerVideo: weekVideos > 0 ? Math.round(weekViews / weekVideos) : 0
    })
  }

  const saveVideo = () => {
    if (!formData.title.trim()) {
      alert('Please enter video title')
      return
    }

    if (editingId) {
      // Edit existing video
      const updated = videos.map(v =>
        v.id === editingId
          ? { ...v, ...formData, views: parseInt(formData.views) || 0, followers: parseInt(formData.followers) || 0 }
          : v
      )
      storage.setTodayData({ contentVideos: updated })
      setVideos(updated)
      setEditingId(null)
    } else {
      // Add new video
      const newVideo = {
        id: Date.now(),
        ...formData,
        date: today,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        views: parseInt(formData.views) || 0,
        followers: parseInt(formData.followers) || 0
      }

      const updated = [...videos, newVideo]
      storage.setTodayData({ contentVideos: updated })
      setVideos(updated)
    }

    resetForm()
    onDataChange()
    calculateWeeklyStats()
  }

  const resetForm = () => {
    setFormData({
      title: '',
      language: 'english',
      notes: '',
      tiktokLink: '',
      views: '',
      followers: ''
    })
    setShowForm(false)
    setEditingId(null)
  }

  const editVideo = (video) => {
    setFormData({
      title: video.title,
      language: video.language,
      notes: video.notes,
      tiktokLink: video.tiktokLink,
      views: video.views?.toString() || '',
      followers: video.followers?.toString() || ''
    })
    setEditingId(video.id)
    setShowForm(true)
  }

  const deleteVideo = (id) => {
    const updated = videos.filter(v => v.id !== id)
    storage.setTodayData({ contentVideos: updated })
    setVideos(updated)
    onDataChange()
    calculateWeeklyStats()
  }

  const languageColors = {
    english: 'bg-blue-900/30 border-blue-700/50 text-blue-200',
    arabic: 'bg-green-900/30 border-green-700/50 text-green-200',
    french: 'bg-purple-900/30 border-purple-700/50 text-purple-200'
  }

  const languageLabels = {
    english: '🇬🇧 English',
    arabic: '🇸🇦 Arabic',
    french: '🇫🇷 French'
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">Content Creation</h2>
          <button
            onClick={() => csvExport.exportContent()}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center gap-2 transition-colors"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
        <p className="text-gray-400 text-sm">Track your TikTok videos & performance — {today}</p>
      </div>

      {/* Weekly target */}
      <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Weekly Target: 3 Videos</h3>
          <span className="text-2xl font-bold text-blue-400">{weeklyStats?.videos || 0}/3</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all"
            style={{ width: `${Math.min(((weeklyStats?.videos || 0) / 3) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Weekly stats */}
      {weeklyStats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Total Views</p>
            <p className="text-2xl font-bold text-purple-400 mt-1">{weeklyStats.views.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Avg: {weeklyStats.avgViewsPerVideo.toLocaleString()}/video</p>
          </div>
          <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Followers Gained</p>
            <p className="text-2xl font-bold text-green-400 mt-1">+{weeklyStats.followers}</p>
          </div>
          <div className="p-3 bg-orange-900/20 border border-orange-700/50 rounded-lg">
            <p className="text-xs text-gray-400">Videos</p>
            <p className="text-2xl font-bold text-orange-400 mt-1">{weeklyStats.videos}</p>
          </div>
        </div>
      )}

      {/* Add video button */}
      <button
        onClick={() => (editingId ? resetForm() : setShowForm(!showForm))}
        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={18} />
        {editingId ? 'Cancel Edit' : 'Add Video'}
      </button>

      {/* Add/Edit video form */}
      {showForm && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-3">
          <h3 className="font-bold">{editingId ? 'Edit Video' : 'Log New Video'}</h3>

          <input
            type="text"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
            placeholder="Video title/topic"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />

          <select
            value={formData.language}
            onChange={e => setFormData({ ...formData, language: e.target.value })}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          >
            <option value="english">🇬🇧 English</option>
            <option value="arabic">🇸🇦 Arabic</option>
            <option value="french">🇫🇷 French</option>
          </select>

          <textarea
            value={formData.notes}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Notes: What did you talk about? Key topics? Anything to remember?"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm h-20 resize-none"
          />

          <input
            type="text"
            value={formData.tiktokLink}
            onChange={e => setFormData({ ...formData, tiktokLink: e.target.value })}
            placeholder="TikTok link (optional)"
            className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={formData.views}
              onChange={e => setFormData({ ...formData, views: e.target.value })}
              placeholder="Views"
              className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              min="0"
            />
            <input
              type="number"
              value={formData.followers}
              onChange={e => setFormData({ ...formData, followers: e.target.value })}
              placeholder="Followers gained"
              className="bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-blue-500 outline-none text-sm"
              min="0"
            />
          </div>

          <button
            onClick={saveVideo}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded font-medium transition-colors text-sm"
          >
            {editingId ? 'Save Changes' : 'Add Video'}
          </button>
        </div>
      )}

      {/* Videos list */}
      {videos.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-bold text-lg">Today's Videos ({videos.length})</h3>

          {videos.map(video => (
            <div
              key={video.id}
              className={`p-4 rounded-lg border ${languageColors[video.language]} space-y-2`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-bold">{video.title}</h4>
                  <p className="text-xs opacity-75">{languageLabels[video.language]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{video.views.toLocaleString()} views</p>
                  <p className="text-xs opacity-75">+{video.followers} followers</p>
                </div>
              </div>

              {video.notes && (
                <div className="p-2 bg-black/30 rounded text-xs">
                  <p className="opacity-90">{video.notes}</p>
                </div>
              )}

              {video.tiktokLink && (
                <a
                  href={video.tiktokLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs underline opacity-75 hover:opacity-100"
                >
                  🔗 TikTok Link
                </a>
              )}

              <div className="flex gap-2 pt-2 border-t border-current border-opacity-20">
                <button
                  onClick={() => editVideo(video)}
                  className="flex-1 px-2 py-1 text-xs bg-black/30 hover:bg-black/50 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => deleteVideo(video.id)}
                  className="flex-1 px-2 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-gray-400">No videos logged yet. Start creating! 🎬</p>
        </div>
      )}

      {/* Language performance comparison */}
      {weeklyStats && (
        <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <TrendingUp size={18} />
            Performance by Language (This Week)
          </h3>

          <div className="space-y-3">
            {['english', 'arabic', 'french'].map(lang => (
              <div key={lang}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{languageLabels[lang]}</span>
                  <span className="font-bold">
                    {weeklyStats.videosByLang[lang]} video{weeklyStats.videosByLang[lang] !== 1 ? 's' : ''} •{' '}
                    {weeklyStats.viewsByLang[lang].toLocaleString()} views
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${
                        weeklyStats.videos > 0 ? (weeklyStats.videosByLang[lang] / weeklyStats.videos) * 100 : 0
                      }%`
                    }}
                  />
                </div>
                {weeklyStats.videosByLang[lang] > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Avg: {Math.round(weeklyStats.viewsByLang[lang] / weeklyStats.videosByLang[lang]).toLocaleString()} views/video
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-700 text-xs text-gray-400 space-y-1">
            <p>💡 Compare average views per language to see what resonates best with your audience</p>
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg text-sm text-blue-200 space-y-2">
        <p className="font-bold">📊 Tracking Tips:</p>
        <ul className="text-xs space-y-1 ml-2">
          <li>• Log views & followers right after posting</li>
          <li>• Use notes to remember what worked well</li>
          <li>• Compare language performance to decide what to focus on</li>
          <li>• Update videos with new metrics as they gain traction</li>
        </ul>
      </div>
    </div>
  )
}
