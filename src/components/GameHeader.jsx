import React from 'react'

const GameHeader = ({ onReset, onLogout, username }) => {
  return (
    <header className="game-header">
      <div className="header-content">
        <h1 className="game-title">
          <span className="luxury">Luxury</span>
          <span className="clicker">Clicker</span>
        </h1>
        <p className="game-subtitle">Devenez milliardaire en un clic !</p>
        {username && (
          <p className="user-welcome">Bienvenue, {username} !</p>
        )}
      </div>
      <div className="header-actions">
        <button className="reset-button" onClick={onReset}>
          🔄 Recommencer
        </button>
        <button className="logout-button" onClick={onLogout}>
          🚪 Déconnexion
        </button>
      </div>
    </header>
  )
}

export default GameHeader 