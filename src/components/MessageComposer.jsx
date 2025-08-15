import React, { useState } from 'react';
import './MessageComposer.css';

const MessageComposer = ({ token, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Veuillez écrire un message');
      return;
    }

    if (message.length > 200) {
      setError('Le message ne peut pas dépasser 200 caractères');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/social/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message.trim(),
          amountSpent: 1000, // Montant minimum requis
          messageType: 'custom'
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage('');
        if (onMessageSent) {
          onMessageSent();
        }
      } else {
        setError(data.message || 'Erreur lors de l\'envoi du message');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setError('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="message-composer">
      <h4>💬 Écrire un message</h4>
      <form onSubmit={handleSubmit}>
        <div className="composer-input">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre message ici... (max 200 caractères)"
            maxLength={200}
            disabled={isSubmitting}
          />
          <div className="char-count">
            {message.length}/200
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="composer-info">
          <small>💡 Les messages sont visibles pendant 1 heure</small>
        </div>
        
        <button 
          type="submit" 
          className="send-button"
          disabled={isSubmitting || !message.trim()}
        >
          {isSubmitting ? 'Envoi...' : '📤 Envoyer'}
        </button>
      </form>
    </div>
  );
};

export default MessageComposer;
