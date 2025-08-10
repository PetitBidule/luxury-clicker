import React, { useState } from 'react'
import { useAudio } from './AudioManager'

const ClickButton = ({ onClick, moneyPerClick, money, clickCost }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const { playClickSound } = useAudio()

  const handleClick = () => {
    setIsAnimating(true)
    onClick()
    
    // Jouer le son de clic
    playClickSound()
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 150)
  }

  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  const canClick = money >= clickCost

  return (
    <div className="click-button-container">
      <button 
        className={`click-button ${isAnimating ? 'clicking' : ''} ${!canClick ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={!canClick}
      >
        <div className="button-content">
          <div className="money-icon">💰</div>
          <div className="click-text">Cliquez pour gagner !</div>
          <div className="money-per-click">+{formatMoney(moneyPerClick)} par clic</div>
          <div className="click-cost">Coût: 1 centime par clic</div>
          {!canClick && (
            <div className="insufficient-funds">
              Solde insuffisant pour cliquer
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

export default ClickButton 