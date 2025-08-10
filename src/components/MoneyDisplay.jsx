import React from 'react'

const MoneyDisplay = ({ money, moneyPerSecond }) => {
  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  return (
    <div className="money-display">
      <div className="current-money">
        <h2>Argent Actuel</h2>
        <div className="money-amount">{formatMoney(money)}</div>
      </div>
      
      {moneyPerSecond > 0 && (
        <div className="money-per-second">
          <span className="label">Par seconde :</span>
          <span className="amount">+{formatMoney(moneyPerSecond)}</span>
        </div>
      )}
    </div>
  )
}

export default MoneyDisplay 