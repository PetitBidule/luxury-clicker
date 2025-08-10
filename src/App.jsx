import { useState, useEffect } from 'react'
import './App.css'
import AuthContainer from './components/AuthContainer'
import GameHeader from './components/GameHeader'
import MoneyDisplay from './components/MoneyDisplay'
import ClickButton from './components/ClickButton'
import UpgradesPanel from './components/UpgradesPanel'
import StatsPanel from './components/StatsPanel'
import AudioManager, { useAudio } from './components/AudioManager'


function AppContent() {

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)

  const [money, setMoney] = useState(0)
  const [moneyPerClick, setMoneyPerClick] = useState(1)
  const [moneyPerSecond, setMoneyPerSecond] = useState(0)
  const [upgrades, setUpgrades] = useState({
    clickUpgrade: { level: 0, cost: 10, effect: 1, name: "Click Upgrade" },
    autoClicker: { level: 0, cost: 50, effect: 1, name: "Auto Clicker" },
    investment: { level: 0, cost: 200, effect: 5, name: "Investment" },
    business: { level: 0, cost: 1000, effect: 25, name: "Business" },
    luxury: { level: 0, cost: 5000, effect: 100, name: "Luxury" }
  })
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalMoney: 0,
    playTime: 0
  })


  const { playCashSound } = useAudio()

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    
    if (savedToken && savedUser) {
      // Vérifier la validité du token
      verifyToken(savedToken, JSON.parse(savedUser))
    }
  }, [])

  // Vérifier la validité du token
  const verifyToken = async (token, userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (data.success) {
        setToken(token)
        setUser(userData)
        setIsAuthenticated(true)
        // Charger la sauvegarde du jeu
        loadGameSave(token)
      } else {
        // Token invalide, déconnecter
        logout()
      }
    } catch (error) {
      console.error('Erreur de vérification du token:', error)
      logout()
    }
  }

  // Charger la sauvegarde du jeu
  const loadGameSave = async (userToken) => {
    try {
      const response = await fetch('http://localhost:5000/api/game/save', {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const save = data.save
          setMoney(save.money)
          setMoneyPerClick(save.moneyPerClick)
          setMoneyPerSecond(save.moneyPerSecond)
          setUpgrades(save.upgrades)
          setStats(save.stats)
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la sauvegarde:', error)
    }
  }

  // Sauvegarder le jeu
  const saveGame = async () => {
    if (!token) return

    try {
      const gameData = {
        money,
        moneyPerClick,
        moneyPerSecond,
        upgrades,
        stats
      }

      await fetch('http://localhost:5000/api/game/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameData)
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Gérer l'authentification réussie
  const handleAuthSuccess = (userData, userToken) => {
    setUser(userData)
    setToken(userToken)
    setIsAuthenticated(true)
    // Charger la sauvegarde du jeu
    loadGameSave(userToken)
  }

  // Déconnexion
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)
    // Réinitialiser le jeu
    resetGame()
  }

  // Sauvegarde automatique
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(saveGame, 10000) // Sauvegarde toutes les 10 secondes
    return () => clearInterval(interval)
  }, [money, moneyPerClick, moneyPerSecond, upgrades, stats, isAuthenticated])

  // Mise à jour automatique de l'argent par seconde
  useEffect(() => {
    const interval = setInterval(() => {
      if (moneyPerSecond > 0) {
        setMoney(prev => prev + moneyPerSecond)
        setStats(prev => ({ ...prev, totalMoney: prev.totalMoney + moneyPerSecond }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [moneyPerSecond])

  // Mise à jour du temps de jeu
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({ ...prev, playTime: prev.playTime + 1 }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleClick = () => {
    setMoney(prev => prev + moneyPerClick)
    setStats(prev => ({ 
      ...prev, 
      totalClicks: prev.totalClicks + 1,
      totalMoney: prev.totalMoney + moneyPerClick
    }))
  }

  const buyUpgrade = (upgradeKey) => {
    const upgrade = upgrades[upgradeKey]
    if (money >= upgrade.cost) {
      // Jouer le son de cash
      playCashSound()
      
      setMoney(prev => prev - upgrade.cost)
      
      const newUpgrades = { ...upgrades }
      newUpgrades[upgradeKey].level += 1
      newUpgrades[upgradeKey].cost = Math.floor(upgrade.cost * 1.15) // Augmentation de 15% du coût
      
      setUpgrades(newUpgrades)
      
      // Mise à jour des effets
      if (upgradeKey === 'clickUpgrade') {
        setMoneyPerClick(prev => prev + upgrade.effect)
      } else {
        setMoneyPerSecond(prev => prev + upgrade.effect)
      }
    }
  }

  const resetGame = () => {
    if (confirm('Are you sure you want to reset the game?')) {
      setMoney(0)
      setMoneyPerClick(1)
      setMoneyPerSecond(0)
      setUpgrades({
        clickUpgrade: { level: 0, cost: 10, effect: 1, name: "Click Upgrade" },
        autoClicker: { level: 0, cost: 50, effect: 1, name: "Auto Clicker" },
        investment: { level: 0, cost: 200, effect: 5, name: "Investment" },
        business: { level: 0, cost: 1000, effect: 25, name: "Business" },
        luxury: { level: 0, cost: 5000, effect: 100, name: "Luxury" }
      })
      setStats({
        totalClicks: 0,
        totalMoney: 0,
        playTime: 0
      })
    }
  }

  // Afficher l'écran d'authentification si non connecté
  if (!isAuthenticated) {
    return <AuthContainer onAuthSuccess={handleAuthSuccess} />
  }

  // Afficher le jeu si connecté
  return (
    <div className="App">
      <GameHeader onReset={resetGame} onLogout={logout} username={user?.username} />
      
      <main className="game-container">
        <div className="left-panel">
          <MoneyDisplay money={money} moneyPerSecond={moneyPerSecond} />
          <ClickButton onClick={handleClick} moneyPerClick={moneyPerClick} />
        </div>
        
        <div className="right-panel">
          <UpgradesPanel upgrades={upgrades} money={money} onBuyUpgrade={buyUpgrade} />
          <StatsPanel stats={stats} />
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AudioManager>
      <AppContent />
    </AudioManager>
  )
}

export default App

