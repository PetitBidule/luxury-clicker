import React from 'react'

const GameHeader = ({ onReset }) => {
  return (
    <header className="game-header">
      <div className="header-content">
        <h1 className="game-title">
          <span className="luxury">Luxury</span>
          <span className="clicker">Clicker</span>
        </h1>
        <p className="game-subtitle">Devenez milliardaire en un clic !</p>
      </div>
      <button className="reset-button" onClick={onReset}>
        🔄 Recommencer
      </button>
    </header>
  )
}

export default GameHeader 