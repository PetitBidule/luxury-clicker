import React from 'react'
import { useAudio } from './AudioManager'

const GameHeader = ({ onReset }) => {
  const { isAudioEnabled, toggleAudio } = useAudio()


  return (
    <header className="game-header">
      <div className="header-content">
        <h1 className="game-title">
          <span className="luxury">Luxury</span>
          <span className="clicker">Clicker</span>
        </h1>
        <p className="game-subtitle">Become a billionaire with one click!</p>
      </div>
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
      </div>
    </header>
  )
}

export default GameHeader 