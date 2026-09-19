import { useState } from 'react'
import AuthPage from './components/AuthPage'
import ProductApp from './ProductApp'
import './App.css'

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inventory-user'))
    } catch {
      return null
    }
  })

  const handleAuthenticated = (authenticatedUser) => {
    localStorage.setItem('inventory-user', JSON.stringify(authenticatedUser))
    setUser(authenticatedUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('inventory-user')
    setUser(null)
  }

  return user ? <ProductApp user={user} onLogout={handleLogout} /> : <AuthPage onAuthenticated={handleAuthenticated} />
}

export default App
