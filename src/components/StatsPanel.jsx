import React from 'react'

const StatsPanel = ({ stats }) => {
  const formatNumber = (num) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
    return num.toString()
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <div className="stats-panel">
      <h3>Statistiques</h3>
      <div className="stats-list">
        <div className="stat-item">
          <span className="stat-icon">👆</span>
          <span className="stat-label">Clics totaux :</span>
          <span className="stat-value">{formatNumber(stats.totalClicks)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">💰</span>
          <span className="stat-label">Argent total gagné :</span>
          <span className="stat-value">${formatNumber(stats.totalMoney)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">⏱️</span>
          <span className="stat-label">Temps de jeu :</span>
          <span className="stat-value">{formatTime(stats.playTime)}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-icon">📊</span>
          <span className="stat-label">Clics par seconde :</span>
          <span className="stat-value">
            {stats.playTime > 0 ? (stats.totalClicks / stats.playTime).toFixed(1) : '0'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default StatsPanel 