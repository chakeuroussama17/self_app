import { Home, Zap, Moon, Dumbbell, Brain, Users, TrendingUp, CheckSquare, Video, Settings as SettingsIcon } from 'lucide-react'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'prayer', label: 'Prayer', icon: Zap },
  { id: 'sleep', label: 'Sleep', icon: Moon },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'meditation', label: 'Meditate', icon: Brain },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'todos', label: 'To-Do', icon: CheckSquare },
  { id: 'content', label: 'Content', icon: Video },
  { id: 'business', label: 'Business', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
]

export default function Navigation({ currentSection, onSectionChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-2 py-2">
      <div className="flex justify-between items-center max-w-full overflow-x-auto">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors whitespace-nowrap text-xs ${
              currentSection === id
                ? 'bg-blue-900 text-blue-200'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
