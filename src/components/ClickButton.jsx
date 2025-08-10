import React, { useState } from 'react'

const ClickButton = ({ onClick, moneyPerClick }) => {
  const [isAnimating, setIsAnimating] = useState(false)

  const handleClick = () => {
    setIsAnimating(true)
    onClick()
    
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
        className={`click-button ${isAnimating ? 'clicking' : ''}`}
        onClick={handleClick}
      >
        <div className="button-content">
          <div className="money-icon">💰</div>
          <div className="click-text">Cliquez pour gagner !</div>
          <div className="money-per-click">+{formatMoney(moneyPerClick)} par clic</div>
        </div>
      </button>
    </div>
  )
}

export default ClickButton 