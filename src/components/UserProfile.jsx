import { useState, useEffect } from 'react';
import './UserProfile.css';

function UserProfile({ token, userId, isOwnProfile = true, gameStats = null }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customPhrase: '',
    profilePicture: ''
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `http://localhost:5000/api/social/profile/${userId}`
        : 'http://localhost:5000/api/social/profile';
        
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setEditForm({
          customPhrase: data.profile.customPhrase || '',
          profilePicture: data.profile.profilePicture || ''
        });
        setError(null);
      } else {
        setError('Erreur lors du chargement du profil');
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/social/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (data.success) {
        setProfile(prev => ({
          ...prev,
          customPhrase: editForm.customPhrase,
          profilePicture: editForm.profilePicture
        }));
        setEditing(false);
        // Utiliser une modale au lieu d'alert
        showModal('Profil mis à jour avec succès !', 'success');
      } else {
        showModal(`Erreur: ${data.message}`, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      showModal('Erreur lors de la mise à jour', 'error');
    }
  };

  const formatMoney = (amount) => {
    if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)}B€`;
    if (amount >= 1e6) return `${(amount / 1e6).toFixed(1)}M€`;
    if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)}K€`;
    return `${amount}€`;
  };

  const formatNumber = (num) => {
    if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: '#9CA3AF',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#EF4444'
    };
    return colors[rarity] || '#9CA3AF';
  };

  const showModal = (message, type = 'info') => {
    // Créer une modale simple pour remplacer les alerts
    const modal = document.createElement('div');
    modal.className = `custom-modal ${type}`;
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-message">${message}</div>
        <button class="modal-close">OK</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.modal-close').onclick = () => {
      document.body.removeChild(modal);
    };
    
    // Auto-fermeture après 3 secondes
    setTimeout(() => {
      if (document.body.contains(modal)) {
        document.body.removeChild(modal);
      }
    }, 3000);
  };

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="user-profile">
        <div className="loading">Chargement du profil...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile">
        <div className="error">{error}</div>
        <button onClick={fetchProfile} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="user-profile">
        <div className="error">Profil non trouvé</div>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profilePicture ? (
            <img src={profile.profilePicture} alt="Avatar" />
          ) : (
            <div className="default-avatar">
              {profile.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="prestige-ring" style={{ borderColor: profile.title.color }}>
            {profile.prestigeLevel > 0 && (
              <div className="prestige-level">⭐{profile.prestigeLevel}</div>
            )}
          </div>
        </div>

        <div className="profile-info">
          <div className="title-section">
            <span 
              className="user-title" 
              style={{ color: profile.title.color }}
            >
              {profile.title.icon} {profile.title.name}
            </span>
            <h2 className="username">{profile.username}</h2>
          </div>

          {editing && isOwnProfile ? (
            <div className="edit-phrase">
              <input
                type="text"
                placeholder="Votre phrase personnalisée..."
                value={editForm.customPhrase}
                onChange={(e) => setEditForm(prev => ({
                  ...prev,
                  customPhrase: e.target.value
                }))}
                maxLength={200}
              />
              <div className="edit-actions">
                <button onClick={handleSaveProfile} className="save-btn">
                  💾 Sauvegarder
                </button>
                <button onClick={() => setEditing(false)} className="cancel-btn">
                  ❌ Annuler
                </button>
              </div>
            </div>
          ) : (
            <div className="custom-phrase">
              {profile.customPhrase ? (
                <p>"{profile.customPhrase}"</p>
              ) : (
                <p className="no-phrase">Aucune phrase personnalisée</p>
              )}
              {isOwnProfile && (
                <button onClick={() => setEditing(true)} className="edit-btn">
                  ✏️ Modifier
                </button>
              )}
            </div>
          )}

          <div className="title-description">
            <small>{profile.title.description}</small>
          </div>
        </div>
      </div>

      {/* Statistiques du jeu intégrées */}
      {gameStats && (
        <div className="game-stats-section">
          <h3>🎮 Statistiques de Jeu</h3>
          <div className="game-stats-grid">
            <div className="game-stat-card">
              <div className="stat-icon">🖱️</div>
              <div className="stat-info">
                <div className="stat-value">{formatNumber(gameStats.totalClicks)}</div>
                <div className="stat-label">Total Clics</div>
              </div>
            </div>
            
            <div className="game-stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-info">
                <div className="stat-value">{formatMoney(gameStats.totalMoney)}</div>
                <div className="stat-label">Argent Total Gagné</div>
              </div>
            </div>
            
            <div className="game-stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <div className="stat-value">{formatTime(gameStats.playTime)}</div>
                <div className="stat-label">Temps de Jeu</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="profile-stats">
        <div className="stat-card main-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">{formatMoney(profile.totalSpent)}</div>
            <div className="stat-label">Total Dépensé</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-info">
            <div className="stat-value">{profile.badges.length}</div>
            <div className="stat-label">Badges</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-info">
            <div className="stat-value">{profile.virtualItems.length}</div>
            <div className="stat-label">Objets</div>
          </div>
        </div>
      </div>

      <div className="profile-sections">
        <div className="badges-section">
          <h3>🏆 Collection de Badges</h3>
          <div className="badges-grid">
            {profile.badges.length === 0 ? (
              <div className="no-items">Aucun badge obtenu</div>
            ) : (
              profile.badges.map(badge => (
                <div 
                  key={badge.id} 
                  className={`badge-item ${badge.isLimitedEdition ? 'limited' : ''}`}
                  title={badge.description}
                >
                  <div className="badge-icon" style={{ color: badge.color }}>
                    {badge.icon}
                  </div>
                  <div className="badge-name">{badge.name}</div>
                  {badge.isLimitedEdition && (
                    <div className="limited-badge">⚡ Limité</div>
                  )}
                  <div className="earned-date">
                    {new Date(badge.earnedAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="items-section">
          <h3>💎 Collection Virtuelle</h3>
          <div className="items-grid">
            {profile.virtualItems.length === 0 ? (
              <div className="no-items">Aucun objet possédé</div>
            ) : (
              profile.virtualItems.map(item => (
                <div 
                  key={item.id} 
                  className={`virtual-item ${item.rarity} ${item.isEquipped ? 'equipped' : ''}`}
                  style={{ borderColor: getRarityColor(item.rarity) }}
                >
                  <div className="item-header">
                    <div className="item-image">
                      {item.image ? (
                        <img src={item.image} alt={item.name} />
                      ) : (
                        <div className="placeholder">
                          {item.type === 'cursor' && '👆'}
                          {item.type === 'effect' && '✨'}
                          {item.type === 'vehicle' && '🚗'}
                          {item.type === 'property' && '🏰'}
                          {item.type === 'nft' && '🎨'}
                        </div>
                      )}
                    </div>
                    {item.isEquipped && (
                      <div className="equipped-badge">✅ Équipé</div>
                    )}
                  </div>
                  
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-rarity" style={{ color: getRarityColor(item.rarity) }}>
                      {item.rarity.toUpperCase()}
                    </div>
                    <div className="purchase-info">
                      <div className="purchase-price">
                        {formatMoney(item.purchasePrice)}
                      </div>
                      <div className="purchase-date">
                        {new Date(item.purchasedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
