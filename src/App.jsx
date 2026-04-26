import { useState } from 'react'
import './App.scss'
import Login from './Login'
import Register from './Register'
import MainMenu from './MainMenu'
import SelectCharacter from './SelectCharacter'
import CharacterMap from './CharacterMap'

function App() {
  const [page, setPage] = useState(() => localStorage.getItem('token') ? 'menu' : 'login')
  const [selectedCharacter, setSelectedCharacter] = useState(null)

  const handleEnterMap = (character) => {
    setSelectedCharacter(character)
    setPage('map')
  }

  return (
    <>
      {page === 'login' && <Login onSwitch={() => setPage('register')} onLogin={() => setPage('menu')} />}
      {page === 'register' && <Register onSwitch={() => setPage('login')} />}
      {page === 'menu' && <MainMenu onNavigate={setPage} />}
      {page === 'selectCharacter' && (
        <SelectCharacter
          onBack={() => setPage('menu')}
          onEnterMap={handleEnterMap}
        />
      )}
      {page === 'map' && (
        <CharacterMap
          character={selectedCharacter}
          onBack={() => setPage(selectedCharacter ? 'selectCharacter' : 'menu')}
          onSelectCharacter={() => setPage('selectCharacter')}
        />
      )}
    </>
  )
}

export default App
