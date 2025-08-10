import React, { useState } from 'react'

const CreditCardPopup = ({ isOpen, onClose, onRecharge, token }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    amount: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
      setError('Veuillez entrer un montant valide en euros')
      return
    }

    if (!formData.cardNumber || !formData.expiryDate || !formData.cvv) {
      setError('Veuillez remplir tous les champs requis')
      return
    }

    setIsLoading(true)
    
    try {
      // Appeler l'API de paiement
      const response = await fetch('http://localhost:5000/api/payment/initiate-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(formData.amount),
          currency: 'EUR'
        })
      })

      const data = await response.json()

      if (data.success) {
        // Rediriger vers l'API de paiement
        window.location.href = data.redirectUrl
        
        // Note: Le montant sera ajouté via webhook ou callback
        // Pour l'instant, on simule l'ajout
        const amountInEuros = parseFloat(formData.amount)
        const amountInCentimes = Math.floor(amountInEuros * 100)
        
        onRecharge(amountInCentimes)
        onClose()
        
        // Reset form
        setFormData({
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          amount: ''
        })
      } else {
        setError(data.message || 'Erreur lors de l\'initiation du paiement')
      }
    } catch (error) {
      console.error('Erreur API:', error)
      setError('Erreur de connexion. Veuillez réessayer.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="credit-card-popup-overlay">
      <div className="credit-card-popup">
        <div className="popup-header">
          <h3>💳 Recharger le compte</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="credit-card-form">
          <div className="form-group">
            <label htmlFor="cardNumber">Numéro de carte</label>
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="expiryDate">Date d'expiration</label>
              <input
                type="text"
                id="expiryDate"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleChange}
                placeholder="MM/AA"
                maxLength="5"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="cvv">CVV</label>
              <input
                type="text"
                id="cvv"
                name="cvv"
                value={formData.cvv}
                onChange={handleChange}
                placeholder="123"
                maxLength="4"
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="amount">Montant en euros</label>
            <div className="amount-input">
              <span className="currency-symbol">€</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="50.00"
                step="0.01"
                min="0.01"
                required
              />
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="confirm-button" disabled={isLoading}>
              {isLoading ? 'Traitement...' : 'Confirmer'}
            </button>
          </div>
        </form>
        
        <div className="popup-footer">
          <p>💡 1 euro = 100 centimes de jeu</p>
          <p>Chaque clic coûte 1 centime</p>
        </div>
      </div>
    </div>
  )
}

export default CreditCardPopup
