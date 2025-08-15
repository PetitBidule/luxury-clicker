import { useState, useEffect } from 'react';
import './SocialMessages.css';

function SocialMessages({ token }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMessages = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/social/messages');
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setError(null);
      } else {
        setError('Erreur lors du chargement des messages');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (amount) => {
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M€`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K€`;
    return `${amount}€`;
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const messageTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  useEffect(() => {
    fetchMessages();
    
    // Actualiser les messages toutes les 15 secondes
    const interval = setInterval(fetchMessages, 15000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="social-messages">
        <h3>💬 Messages en Direct</h3>
        <div className="loading">Chargement des messages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="social-messages">
        <h3>💬 Messages en Direct</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="social-messages">
      <div className="messages-header">
        <h3>💬 Messages en Direct</h3>
        <div className="live-indicator">
          <div className="pulse-dot"></div>
          LIVE
        </div>
      </div>

      <div className="messages-list">
        {messages.length === 0 ? (
          <div className="no-messages">
            <div className="empty-icon">💸</div>
            <p>Aucun message récent</p>
            <small>Les gros clics (≥1000€) apparaîtront ici</small>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`message-item ${message.messageType}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="message-header">
                <div className="user-info">
                  <span 
                    className="user-title" 
                    style={{ color: message.title?.color || '#8B4513' }}
                  >
                    {message.title?.icon} {message.title?.name}
                  </span>
                  <span className="username">{message.username}</span>
                </div>
                <div className="message-meta">
                  <span className="amount">{formatMoney(message.amountSpent)}</span>
                  <span className="time">{formatTimeAgo(message.createdAt)}</span>
                </div>
              </div>
              
              <div className="message-content">
                "{message.message}"
              </div>

              {message.messageType === 'big_click' && (
                <div className="message-effects">
                  {message.amountSpent >= 100000 && <span className="effect-badge legendary">💎 LÉGENDAIRE</span>}
                  {message.amountSpent >= 50000 && message.amountSpent < 100000 && <span className="effect-badge epic">⚡ ÉPIQUE</span>}
                  {message.amountSpent >= 10000 && message.amountSpent < 50000 && <span className="effect-badge rare">✨ RARE</span>}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {messages.length > 0 && (
        <div className="messages-footer">
          <small>Messages automatiquement actualisés • Visibles 1h</small>
        </div>
      )}
    </div>
  );
}

export default SocialMessages;
