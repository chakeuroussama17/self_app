const STORAGE_KEY = 'anchor_data'

export const storage = {
  // Initialize or get all data
  getAllData: () => {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : initializeData()
  },

  // Get data for a specific date (YYYY-MM-DD)
  getDateData: (date) => {
    const allData = storage.getAllData()
    return allData[date] || {}
  },

  // Update data for a specific date
  setDateData: (date, data) => {
    const allData = storage.getAllData()
    allData[date] = { ...allData[date], ...data }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allData))
  },

  // Get today's date in YYYY-MM-DD format
  getTodayDate: () => {
    return new Date().toISOString().split('T')[0]
  },

  // Get data for today
  getTodayData: () => {
    return storage.getDateData(storage.getTodayDate())
  },

  // Update today's data
  setTodayData: (data) => {
    storage.setDateData(storage.getTodayDate(), data)
  },

  // Delete all data (for testing)
  clear: () => {
    localStorage.removeItem(STORAGE_KEY)
  }
}

function initializeData() {
  const data = {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  return data
}
