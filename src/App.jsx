import { useState, useEffect, useRef } from 'react'
import { storage } from './utils/storage'
import Dashboard from './components/Dashboard'
import Prayer from './components/Prayer'
import Sleep from './components/Sleep'
import Gym from './components/Gym'
import Meditation from './components/Meditation'
import Social from './components/Social'
import Business from './components/Business'
import TodoList from './components/TodoList'
import ContentCreation from './components/ContentCreation'
import Settings from './components/Settings'
import Navigation from './components/Navigation'

const SECTIONS = {
  dashboard: 'dashboard',
  prayer: 'prayer',
  sleep: 'sleep',
  gym: 'gym',
  meditation: 'meditation',
  social: 'social',
  business: 'business',
  todos: 'todos',
  content: 'content',
  settings: 'settings',
}

function App() {
  const [currentSection, setCurrentSection] = useState(SECTIONS.dashboard)
  const [refreshKey, setRefreshKey] = useState(0)
  const currentDate = useRef(storage.getTodayDate())

  // Trigger refresh in all components when data changes
  const triggerRefresh = () => {
    setRefreshKey(k => k + 1)
  }

  // Roll over to a new day: when the calendar date changes (app left open
  // past midnight, or resumed the next day), remount sections so prayers
  // re-fetch and every module shows the fresh day.
  useEffect(() => {
    const checkNewDay = () => {
      const today = storage.getTodayDate()
      if (today !== currentDate.current) {
        currentDate.current = today
        triggerRefresh()
      }
    }

    const interval = setInterval(checkNewDay, 60 * 1000) // check every minute
    const onVisible = () => { if (!document.hidden) checkNewDay() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const renderSection = () => {
    switch (currentSection) {
      case SECTIONS.dashboard:
        return <Dashboard key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.prayer:
        return <Prayer key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.sleep:
        return <Sleep key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.gym:
        return <Gym key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.meditation:
        return <Meditation key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.social:
        return <Social key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.business:
        return <Business key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.todos:
        return <TodoList key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.content:
        return <ContentCreation key={refreshKey} onDataChange={triggerRefresh} />
      case SECTIONS.settings:
        return <Settings key={refreshKey} />
      default:
        return <Dashboard key={refreshKey} onDataChange={triggerRefresh} />
    }
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto pb-24">
        {renderSection()}
      </div>

      {/* Bottom navigation */}
      <Navigation
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />
    </div>
  )
}

export default App
