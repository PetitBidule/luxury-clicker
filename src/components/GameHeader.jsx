import React from 'react'
import { useAudio } from './AudioManager'

const GameHeader = ({ onReset, onLogout, username, currentView, onViewChange }) => {
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
      
      {/* Navigation pour les fonctionnalités */}
      <nav className="header-navigation">
        <button 
          className={`nav-btn ${currentView === 'game' ? 'active' : ''}`}
          onClick={() => onViewChange('game')}
        >
          🎮 Jeu
        </button>
        <button 
          className={`nav-btn ${currentView === 'leaderboard' ? 'active' : ''}`}
          onClick={() => onViewChange('leaderboard')}
        >
          🏆 Classement
        </button>
        <button 
          className={`nav-btn ${currentView === 'shop' ? 'active' : ''}`}
          onClick={() => onViewChange('shop')}
        >
          🏪 Boutique
        </button>
        <button 
          className={`nav-btn ${currentView === 'profile' ? 'active' : ''}`}
          onClick={() => onViewChange('profile')}
        >
          👑 Profil
        </button>
      </nav>
      
      <div className="header-controls">
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