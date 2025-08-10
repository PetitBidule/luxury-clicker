import React from 'react'

const MoneyDisplay = ({ money, moneyPerSecond, onRecharge }) => {
  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  const formatBalance = (centimes) => {
    const euros = Math.floor(centimes / 100)
    const remainingCentimes = centimes % 100
    if (euros === 0) {
      return `${remainingCentimes} centimes`
    } else if (remainingCentimes === 0) {
      return `${euros}€`
    } else {
      return `${euros}€ ${remainingCentimes} centimes`
    }
  }

  return (
    <div className="money-display">
      <div className="current-money">
        <h2>Solde du compte</h2>
        <div className="money-amount">{formatMoney(money)}</div>
        <div className="balance-details">{formatBalance(money)}</div>
      </div>
      <div className="money-per-second">
        <span className="label">Par seconde</span>
        <span className="amount">+{formatMoney(moneyPerSecond)}</span>
      </div>
      <button className="recharge-button" onClick={onRecharge}>
        💳 Recharger avec carte bancaire
      </button>
    </div>
  )
}

export default MoneyDisplay 