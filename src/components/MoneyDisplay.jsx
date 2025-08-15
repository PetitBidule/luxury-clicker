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
        <h2>Current Money</h2>
        <div className="money-amount">{formatMoney(money)}</div>
      </div>
      <div className="money-per-second">
        <span className="label">Per Second</span>
        <span className="amount">+{formatMoney(moneyPerSecond)}</span>
      </div>
      
<stripe-buy-button
  buy-button-id="buy_btn_1RusnfBJTCuuY1AKgywBDLuP"
  publishable-key="pk_live_51RusN4BJTCuuY1AKpMt6EvTEKoOLMeY72WhSRuHuWy7zEK00WtFJEXUPSKOykPfst6llCiZDWn5CdIOU3YCfthQn00EfZLZfrU"
>
</stripe-buy-button>

    </div>
  )
}

export default MoneyDisplay 