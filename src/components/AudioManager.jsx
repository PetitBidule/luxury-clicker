import React, { useState, useEffect, createContext, useContext } from 'react'

// Context to share audio state between components
export const AudioContext = createContext()

// Custom hook to use the audio context
export const useAudio = () => {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}

const AudioManager = ({ children }) => {
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [audioContext, setAudioContext] = useState(null)

  // Initialize audio context
  useEffect(() => {
    if (isAudioEnabled && !audioContext) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        setAudioContext(ctx)
      } catch (error) {
        console.log('Audio not supported or disabled:', error)
        setIsAudioEnabled(false)
      }
    }
  }, [isAudioEnabled, audioContext])

  // Function to play click sound
  const playClickSound = () => {
    if (!isAudioEnabled || !audioContext) return

    try {
      // Create oscillator for sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Configure click sound (high frequency, short duration)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime) // 800 Hz
      oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1) // Descending glissando
      
      // Configure sound envelope
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
      
      // Start and stop sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch (error) {
      console.log('Audio not supported or disabled:', error)
    }
  }

  // Function to play cash sound
  const playCashSound = () => {
    if (!isAudioEnabled || !audioContext) return

    try {
      // Create multiple oscillators for richer cash sound
      const oscillator1 = audioContext.createOscillator()
      const oscillator2 = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      // Connect nodes
      oscillator1.connect(gainNode)
      oscillator2.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // First oscillator - main sound (medium frequency)
      oscillator1.frequency.setValueAtTime(600, audioContext.currentTime)
      oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.15)
      
      // Second oscillator - harmonic (higher frequency)
      oscillator2.frequency.setValueAtTime(1200, audioContext.currentTime)
      oscillator2.frequency.exponentialRampToValueAtTime(1600, audioContext.currentTime + 0.15)
      
      // Configure sound envelope (longer than click)
      gainNode.gain.setValueAtTime(0.4, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
      
      // Start and stop sounds
      oscillator1.start(audioContext.currentTime)
      oscillator2.start(audioContext.currentTime)
      oscillator1.stop(audioContext.currentTime + 0.2)
      oscillator2.stop(audioContext.currentTime + 0.2)
    } catch (error) {
      console.log('Error playing audio:', error)
    }
  }

  // Function to enable/disable audio
  const toggleAudio = () => {
    if (isAudioEnabled && audioContext) {
      audioContext.close()
      setAudioContext(null)
    }
    setIsAudioEnabled(!isAudioEnabled)
  }

  // Clean up audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContext) {
        audioContext.close()
      }
    }
  }, [audioContext])

  const value = {
    isAudioEnabled,
    playClickSound,
    playCashSound,
    toggleAudio
  }

  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}

export default AudioManager
