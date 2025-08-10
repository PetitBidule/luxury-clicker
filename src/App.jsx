import { useState, useEffect } from 'react'
import './App.css'
import GameHeader from './components/GameHeader'
import MoneyDisplay from './components/MoneyDisplay'
import ClickButton from './components/ClickButton'
import UpgradesPanel from './components/UpgradesPanel'
import StatsPanel from './components/StatsPanel'

function App() {
  const [money, setMoney] = useState(0)
  const [moneyPerClick, setMoneyPerClick] = useState(1)
  const [moneyPerSecond, setMoneyPerSecond] = useState(0)
  const [upgrades, setUpgrades] = useState({
    clickUpgrade: { level: 0, cost: 10, effect: 1, name: "Amélioration du Clic" },
    autoClicker: { level: 0, cost: 50, effect: 1, name: "Clic Automatique" },
    investment: { level: 0, cost: 200, effect: 5, name: "Investissement" },
    business: { level: 0, cost: 1000, effect: 25, name: "Entreprise" },
    luxury: { level: 0, cost: 5000, effect: 100, name: "Luxe" }
  })
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalMoney: 0,
    playTime: 0
  })

  // Sauvegarde automatique
  useEffect(() => {
    const savedGame = localStorage.getItem('luxuryClickerSave')
    if (savedGame) {
      const gameData = JSON.parse(savedGame)
      setMoney(gameData.money || 0)
      setMoneyPerClick(gameData.moneyPerClick || 1)
      setMoneyPerSecond(gameData.moneyPerSecond || 0)
      setUpgrades(gameData.upgrades || upgrades)
      setStats(gameData.stats || stats)
    }
  }, [])

  useEffect(() => {
    const saveGame = () => {
      const gameData = {
        money,
        moneyPerClick,
        moneyPerSecond,
        upgrades,
        stats,
        timestamp: Date.now()
      }
      localStorage.setItem('luxuryClickerSave', JSON.stringify(gameData))
    }

    const interval = setInterval(saveGame, 5000) // Sauvegarde toutes les 5 secondes
    return () => clearInterval(interval)
  }, [money, moneyPerClick, moneyPerSecond, upgrades, stats])

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
    if (confirm('Êtes-vous sûr de vouloir recommencer le jeu ?')) {
      setMoney(0)
      setMoneyPerClick(1)
      setMoneyPerSecond(0)
      setUpgrades({
        clickUpgrade: { level: 0, cost: 10, effect: 1, name: "Amélioration du Clic" },
        autoClicker: { level: 0, cost: 50, effect: 1, name: "Clic Automatique" },
        investment: { level: 0, cost: 200, effect: 5, name: "Investissement" },
        business: { level: 0, cost: 1000, effect: 25, name: "Entreprise" },
        luxury: { level: 0, cost: 5000, effect: 100, name: "Luxe" }
      })
      setStats({
        totalClicks: 0,
        totalMoney: 0,
        playTime: 0
      })
      localStorage.removeItem('luxuryClickerSave')
    }
  }

  return (
    <div className="App">
      <GameHeader onReset={resetGame} />
      
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

export default App
