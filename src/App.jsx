import { useState, useEffect } from 'react'
import './App.css'
import ChatInterface from './components/ChatInterface'
import AdminPanel from './components/AdminPanel'

function App() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminToggle, setShowAdminToggle] = useState(false)
  const [toggleCount, setToggleCount] = useState(0)
  const [lastToggleTime, setLastToggleTime] = useState(0)

  // 双击标题栏显示管理员切换
  const handleTitleDoubleClick = () => {
    const now = Date.now()
    if (now - lastToggleTime < 1000) {
      setToggleCount(prev => {
        if (prev >= 3) {
          setShowAdminToggle(true)
          return 0
        }
        return prev + 1
      })
    } else {
      setToggleCount(1)
    }
    setLastToggleTime(now)
  }

  return (
    <div className="App">
      <header className="App-header" onDoubleClick={handleTitleDoubleClick}>
        <h1 onClick={() => setShowAdminToggle(false)}>AI网页应用</h1>
        {showAdminToggle && (
          <div className="admin-toggle">
            <button onClick={() => setIsAdmin(!isAdmin)}>
              {isAdmin ? '切换到用户界面' : '切换到管理后台'}
            </button>
          </div>
        )}
      </header>
      <main>
        {isAdmin ? <AdminPanel /> : <ChatInterface />}
      </main>
    </div>
  )
}

export default App