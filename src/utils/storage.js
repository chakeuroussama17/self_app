import { Preferences } from '@capacitor/preferences'

// Persistence model
// -----------------
// The app used to read/write the browser's localStorage directly. Inside the
// Android APK WebView, localStorage is NOT durable — Android can wipe it when
// the app is backgrounded/killed. So we now persist through Capacitor
// Preferences (real native storage) while keeping a synchronous in-memory
// cache so every component can keep calling these methods synchronously.
//
// Two Preferences blobs:
//   anchor_data => date-keyed tracker data (todos, prayers, sleep, gym, ...)
//   anchor_misc => flat string map for the "settings-ish" keys that used to
//                  live in localStorage (prayer location, business tracks, ...)

const DATA_KEY = 'anchor_data'
const MISC_KEY = 'anchor_misc'

// Known misc keys to migrate over from a previous localStorage-based install.
const MISC_KEYS = [
  'anchor_prayer_location',
  'anchor_business_targets',
  'anchor_business_trackB_deals',
  'anchor_business_trackC_milestones',
  'anchor_business_trackC_metrics',
  'anchor_business_trackC_history',
  'anchor_business_trackD_apps',
  'anchor_daily_reminder',
]

let _data = {}   // date-keyed object, held in memory
let _misc = {}   // flat string map, held in memory
let _ready = false

// --- persistence (fire-and-forget; also mirror to localStorage as a fallback)
async function persistData() {
  const json = JSON.stringify(_data)
  try { await Preferences.set({ key: DATA_KEY, value: json }) } catch (e) { /* ignore */ }
  try { localStorage.setItem(DATA_KEY, json) } catch (e) { /* ignore */ }
}

async function persistMisc() {
  const json = JSON.stringify(_misc)
  try { await Preferences.set({ key: MISC_KEY, value: json }) } catch (e) { /* ignore */ }
  try { localStorage.setItem(MISC_KEY, json) } catch (e) { /* ignore */ }
}

export const storage = {
  // Load everything into memory once, before the app renders.
  init: async () => {
    if (_ready) return

    // 1) date-keyed data
    let loaded = null
    try {
      const r = await Preferences.get({ key: DATA_KEY })
      if (r.value) loaded = JSON.parse(r.value)
    } catch (e) { /* ignore */ }
    if (!loaded) {
      // migrate from an older localStorage-only install
      try {
        const ls = localStorage.getItem(DATA_KEY)
        if (ls) loaded = JSON.parse(ls)
      } catch (e) { /* ignore */ }
    }
    _data = loaded || {}

    // 2) misc string map
    let misc = null
    try {
      const r = await Preferences.get({ key: MISC_KEY })
      if (r.value) misc = JSON.parse(r.value)
    } catch (e) { /* ignore */ }
    if (!misc) {
      misc = {}
      // migrate known keys + any dynamic weekly-review keys from localStorage
      try {
        MISC_KEYS.forEach(k => {
          const v = localStorage.getItem(k)
          if (v != null) misc[k] = v
        })
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k && k.startsWith('anchor_business_review_')) {
            misc[k] = localStorage.getItem(k)
          }
        }
      } catch (e) { /* ignore */ }
    }
    _misc = misc || {}

    _ready = true

    // Write the merged state straight back so it's durable going forward.
    await persistData()
    await persistMisc()
  },

  // ---- date-keyed tracker data (synchronous) ----
  getAllData: () => _data,

  getDateData: (date) => _data[date] || {},

  setDateData: (date, data) => {
    _data[date] = { ..._data[date], ...data }
    persistData()
  },

  // Local calendar date (NOT UTC) so "today" matches the user's actual day.
  getTodayDate: () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  },

  getTodayData: () => storage.getDateData(storage.getTodayDate()),

  setTodayData: (data) => storage.setDateData(storage.getTodayDate(), data),

  // ---- misc string map (drop-in replacement for localStorage get/set/remove) ----
  getItem: (key) => (_misc[key] !== undefined ? _misc[key] : null),

  setItem: (key, value) => {
    _misc[key] = String(value)
    persistMisc()
  },

  removeItem: (key) => {
    delete _misc[key]
    persistMisc()
  },

  clear: () => {
    _data = {}
    persistData()
  },
}
