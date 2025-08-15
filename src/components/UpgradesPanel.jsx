import React from 'react'

const UpgradesPanel = ({ upgrades, money, onBuyUpgrade }) => {
  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  const getUpgradeIcon = (upgradeKey) => {
    const icons = {
      clickUpgrade: '⚡',
      autoClicker: '🤖',
      investment: '📈',
      business: '🏢',
      luxury: '💎',
      cryptocurrency: '₿',
      realEstate: '🏠',
      stockMarket: '📊',
      oilIndustry: '🛢️',
      spaceMining: '🚀'
    }
    return icons[upgradeKey] || '🔧'
  }

  return (
    <div className="upgrades-panel">
      <h3>🚀 Upgrades</h3>
      <div className="upgrades-grid">
        {Object.entries(upgrades).map(([key, upgrade]) => (
          <div key={key} className="upgrade-item">
            <div className="upgrade-info">
              <div className="upgrade-header">
                <span className="upgrade-icon">{getUpgradeIcon(key)}</span>
                <span className="upgrade-name">{upgrade.name}</span>
              </div>
              <div className="upgrade-details">
                <span className="upgrade-level">Level {upgrade.level}</span>
                <span className="upgrade-effect">
                  +{formatMoney(upgrade.effect)} {key === 'clickUpgrade' ? 'per click' : 'per second'}
                </span>
              </div>
            </div>
            <button
              className={`upgrade-button ${money >= upgrade.cost ? 'affordable' : 'expensive'}`}
              onClick={() => onBuyUpgrade(key)}
              disabled={money < upgrade.cost}
            >
              {formatMoney(upgrade.cost)}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UpgradesPanel 