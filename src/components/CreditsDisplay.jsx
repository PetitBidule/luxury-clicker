import { useState, useEffect } from 'react';
import './CreditsDisplay.css';

function CreditsDisplay({ token, onCreditsUpdate }) {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  // Récupérer les crédits de l'utilisateur
  const fetchCredits = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:5000/api/payment/credits', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setCredits(data.credits);
        if (onCreditsUpdate) {
          onCreditsUpdate(data.credits);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des crédits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
    // Actualiser les crédits toutes les 30 secondes
    const interval = setInterval(fetchCredits, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const formatCredits = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="credits-display loading">
        <div className="credits-icon">💳</div>
        <div className="credits-info">
          <span className="credits-label">Crédits</span>
          <span className="credits-amount">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="credits-display">
      <div className="credits-icon">💳</div>
      <div className="credits-info">
        <span className="credits-label">Crédits disponibles</span>
        <span className="credits-amount">{formatCredits(credits)}</span>
        <span className="credits-note">1 clic = 0,01€</span>
      </div>
    </div>
  );
}

export default CreditsDisplay;
