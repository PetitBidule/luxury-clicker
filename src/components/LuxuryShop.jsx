import { useState, useEffect } from 'react';
import './LuxuryShop.css';

function LuxuryShop({ token, userCredits, onPurchase }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [purchasing, setPurchasing] = useState(null);

  const categories = [
    { id: 'all', name: 'Tout', icon: '🏪' },
    { id: 'cursor', name: 'Curseurs', icon: '👆' },
    { id: 'effect', name: 'Effets', icon: '✨' },
    { id: 'vehicle', name: 'Véhicules', icon: '🚗' },
    { id: 'property', name: 'Propriétés', icon: '🏰' },
    { id: 'nft', name: 'NFTs', icon: '🎨' }
  ];

  const rarityColors = {
    common: '#9CA3AF',
    rare: '#3B82F6',
    epic: '#8B5CF6',
    legendary: '#F59E0B',
    mythic: '#EF4444'
  };

  const formatPrice = (price) => {
    if (price >= 1e6) return `${(price / 1e6).toFixed(1)}M€`;
    if (price >= 1e3) return `${(price / 1e3).toFixed(1)}K€`;
    return `${price}€`;
  };

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/social/shop');
      const data = await response.json();

      if (data.success) {
        setItems(data.items);
        setError(null);
      } else {
        setError('Erreur lors du chargement de la boutique');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la boutique:', error);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (itemId, itemName, price) => {
    if (userCredits < price) {
      alert('Crédits insuffisants pour cet achat !');
      return;
    }

    if (!confirm(`Acheter "${itemName}" pour ${formatPrice(price)} ?`)) {
      return;
    }

    try {
      setPurchasing(itemId);
      const response = await fetch(`http://localhost:5000/api/social/shop/purchase/${itemId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        alert(`🎉 ${itemName} acheté avec succès !`);
        onPurchase && onPurchase(price);
        fetchItems(); // Refresh to update stock
      } else {
        alert(`Erreur: ${data.message}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      alert('Erreur lors de l\'achat');
    } finally {
      setPurchasing(null);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => item.type === selectedCategory);

  if (loading) {
    return (
      <div className="luxury-shop">
        <h3>🏪 Boutique de Luxe</h3>
        <div className="loading">Chargement des articles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="luxury-shop">
        <h3>🏪 Boutique de Luxe</h3>
        <div className="error">{error}</div>
        <button onClick={fetchItems} className="retry-button">
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="luxury-shop">
      <div className="shop-header">
        <h3>🏪 Boutique de Luxe</h3>
        <div className="user-credits">
          💰 {formatPrice(userCredits || 0)}
        </div>
      </div>

      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category.id}
            className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.icon} {category.name}
          </button>
        ))}
      </div>

      <div className="items-grid">
        {filteredItems.length === 0 ? (
          <div className="no-items">Aucun article dans cette catégorie</div>
        ) : (
          filteredItems.map(item => (
            <div 
              key={item.id} 
              className={`item-card ${item.rarity}`}
              style={{ borderColor: rarityColors[item.rarity] }}
            >
              <div className="item-header">
                <div className="item-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="placeholder-image">
                      {item.type === 'cursor' && '👆'}
                      {item.type === 'effect' && '✨'}
                      {item.type === 'vehicle' && '🚗'}
                      {item.type === 'property' && '🏰'}
                      {item.type === 'nft' && '🎨'}
                      {item.type === 'collectible' && '💎'}
                    </div>
                  )}
                </div>
                <div className="rarity-badge" style={{ backgroundColor: rarityColors[item.rarity] }}>
                  {item.rarity.toUpperCase()}
                </div>
              </div>

              <div className="item-info">
                <h4 className="item-name">{item.name}</h4>
                <p className="item-description">{item.description}</p>
                
                {item.specialEffects && Object.keys(item.specialEffects).length > 0 && (
                  <div className="special-effects">
                    <strong>Effets spéciaux:</strong>
                    <ul>
                      {Object.entries(item.specialEffects).map(([key, value]) => (
                        <li key={key}>
                          {key === 'bonusMultiplier' && `Bonus x${value}`}
                          {key === 'clickEffect' && `Effet: ${value}`}
                          {key === 'prestigeBonus' && `Prestige +${value}`}
                          {key === 'uniqueId' && value && '🌟 Unique'}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.isLimitedEdition && (
                  <div className="limited-edition">
                    ⚡ Édition Limitée
                    {item.remainingSupply !== null && (
                      <span className="stock">({item.remainingSupply} restant{item.remainingSupply > 1 ? 's' : ''})</span>
                    )}
                  </div>
                )}
              </div>

              <div className="item-footer">
                <div className="price">{formatPrice(item.basePrice)}</div>
                <button
                  className={`purchase-btn ${userCredits < item.basePrice ? 'disabled' : ''}`}
                  onClick={() => handlePurchase(item.id, item.name, item.basePrice)}
                  disabled={purchasing === item.id || userCredits < item.basePrice || (item.remainingSupply === 0)}
                >
                  {purchasing === item.id ? (
                    '⏳ Achat...'
                  ) : item.remainingSupply === 0 ? (
                    '❌ Épuisé'
                  ) : userCredits < item.basePrice ? (
                    '💸 Insuffisant'
                  ) : (
                    '🛒 Acheter'
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button onClick={fetchItems} className="refresh-button">
        🔄 Actualiser la boutique
      </button>
    </div>
  );
}

export default LuxuryShop;
