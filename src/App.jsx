import { useState } from 'react'
import './App.scss'
import Login from './Login'
import Register from './Register'
import MainMenu from './MainMenu'

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('token') ? 'menu' : 'login')

  return (
    <>
      {page === 'login' && <Login onSwitch={() => setPage('register')} onLogin={() => setPage('menu')} />}
      {page === 'register' && <Register onSwitch={() => setPage('login')} />}
      {page === 'menu' && <MainMenu onNavigate={setPage} />}
    </>
  )
}

export default App
