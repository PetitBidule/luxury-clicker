import React, { useState } from 'react'
import { useAudio } from './AudioManager'

const ClickButton = ({ onClick, moneyPerClick, disabled }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const { playClickSound } = useAudio()

  const handleClick = () => {
    if (disabled) return
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

  return (
    <div className="click-button-container">
      <button 
        className={`click-button ${isAnimating ? 'clicking' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        title={disabled ? 'Solde insuffisant: 0,01€ par clic requis' : undefined}
      >
        <div className="button-content">
          <div className="money-icon">💰</div>
          <div className="click-text">Click to earn! (0,01€ par clic)</div>
          <div className="money-per-click">+{formatMoney(moneyPerClick)} per click</div>
        </div>
      </button>
    </div>
  )
}

export default ClickButton 