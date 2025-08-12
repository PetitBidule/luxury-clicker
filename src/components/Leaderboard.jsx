import React, { useState, useEffect } from 'react'

const Leaderboard = ({ token }) => {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  const fetchLeaderboard = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5000/api/game/leaderboard')
      const data = await response.json()

      if (data.success) {
        setLeaderboard(data.leaderboard)
        setError(null)
      } else {
        setError('Erreur lors du chargement du classement')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du classement:', error)
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLeaderboard()
    
    // Actualiser le classement toutes les 30 secondes
    const interval = setInterval(fetchLeaderboard, 30000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="leaderboard">
        <h3>🏆 Classement</h3>
        <div className="loading">Chargement...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="leaderboard">
        <h3>🏆 Classement</h3>
        <div className="error">{error}</div>
        <button onClick={fetchLeaderboard} className="retry-button">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="leaderboard">
      <h3>🏆 Classement</h3>
      <div className="leaderboard-list">
        {leaderboard.length === 0 ? (
          <div className="no-data">Aucun joueur dans le classement</div>
        ) : (
          leaderboard.map((player, index) => (
            <div key={index} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
              <div className="rank">
                {index === 0 && '🥇'}
                {index === 1 && '🥈'}
                {index === 2 && '🥉'}
                {index > 2 && `#${index + 1}`}
              </div>
              <div className="player-info">
                <div className="username">{player.username}</div>
                <div className="stats">
                  <span className="money">{formatMoney(player.money)}</span>
                  <span className="clicks">{player.totalClicks} clics</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={fetchLeaderboard} className="refresh-button">
        🔄 Actualiser
      </button>
    </div>
  )
}

export default Leaderboard
