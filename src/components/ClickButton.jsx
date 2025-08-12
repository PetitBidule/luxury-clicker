import React, { useState } from 'react'
import { useAudio } from './AudioManager'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe('pk_live_51RusN4BJTCuuY1AKpMt6EvTEKoOLMeY72WhSRuHuWy7zEK00WtFJEXUPSKOykPfst6llCiZDWn5CdIOU3YCfthQn00EfZLZfrU') // ta clé publishable

const ClickButton = ({ onClick, moneyPerClick }) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [loadingPayment, setLoadingPayment] = useState(false)
  const { playClickSound } = useAudio()

  const handleClick = () => {
    setIsAnimating(true)
    onClick()
    
    // Jouer le son de clic
    playClickSound()
    
    setTimeout(() => {
      setIsAnimating(false)
    }, 150)
  }

  // Fonction pour lancer Stripe Checkout
  const handleBuyCredits = async () => {
    setLoadingPayment(true)
    try {
      const response = await fetch('/api/payment/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 5 }) // par ex: 5€ de crédits à acheter
      })
      const session = await response.json()

      if (session.success) {
        const stripe = await stripePromise
        await stripe.redirectToCheckout({ sessionId: session.sessionId })
      } else {
        alert('Erreur lors de la création du paiement')
      }
    } catch (error) {
      alert('Erreur de connexion au serveur de paiement')
      console.error(error)
    }
    setLoadingPayment(false)
  }

  const formatMoney = (amount) => {
    if (amount >= 1e12) return `$${(amount / 1e12).toFixed(1)}T`
    if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`
    if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`
    if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`
    return `$${Math.floor(amount)}`
  }

  return (
    <div className="click-button-container">
      <button 
        className={`click-button ${isAnimating ? 'clicking' : ''}`}
        onClick={handleClick}
      >
        <div className="button-content">
          <div className="money-icon">💰</div>
          <div className="click-text">Click to earn!</div>
          <div className="money-per-click">+{formatMoney(moneyPerClick)} per click</div>
        </div>
      </button>

    </div>
  )
}

export default ClickButton
