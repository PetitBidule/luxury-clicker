import React from 'react'
import { useAudio } from './AudioManager'

const GameHeader = ({ onReset, onLogout, username, walletCents, onTopup }) => {
  const { isAudioEnabled, toggleAudio } = useAudio()

  return (
    <header className="game-header">
      <div className="header-content">
        <h1 className="game-title">
          <span className="luxury">Luxury</span>
          <span className="clicker">Clicker</span>
        </h1>
        <p className="game-subtitle">Become a billionaire with one click!</p>
        {username && (
          <p className="username-display">Welcome, {username}!</p>
        )}
      </div>
      <div className="header-controls">
        <div className="wallet-display" title="Solde du portefeuille">
          💳 {(walletCents ?? 0) / 100} €
        </div>
        <button className="topup-button" onClick={onTopup}>
          ➕ Recharger le compte
        </button>
        <button 
          className={`audio-button ${isAudioEnabled ? 'enabled' : 'disabled'}`} 
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Disable sound' : 'Enable sound'}
        >
          {isAudioEnabled ? '🔊' : '🔇'}
        </button>
        <button className="reset-button" onClick={onReset}>
          🔄 Reset Game
        </button>
        <button className="logout-button" onClick={onLogout}>
          🚪 Logout
        </button>
      </div>
    </header>
  )
}

export default GameHeader 