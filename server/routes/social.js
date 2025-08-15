import express from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';

const router = express.Router();

// Middleware pour vérifier l'authentification
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token d\'authentification requis' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Token invalide' 
    });
  }
};

// Obtenir le leaderboard en temps réel avec titres et phrases personnalisées
router.get('/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await pool.execute(`
      SELECT u.username, gs.money, gs.stats
      FROM game_saves gs
      JOIN users u ON gs.user_id = u.id
      GROUP BY u.username
      ORDER BY gs.money DESC
      LIMIT 10
    `);

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.username,
      customPhrase: entry.custom_phrase || '',
      title: {
        name: entry.current_title || 'Novice',
        color: entry.title_color || '#8B4513',
        icon: entry.title_icon || '👶'
      },
      totalSpent: parseFloat(entry.total_spent) || 0,
      currentMoney: parseInt(entry.money) || 0,
      totalClicks: parseInt(entry.total_clicks) || 0,
      prestigeLevel: entry.prestige_level || 0,
      badgeCount: entry.badge_count || 0
    }));

    res.json({
      success: true,
      leaderboard: formattedLeaderboard,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du leaderboard:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir le profil utilisateur complet
router.get('/profile/:userId?', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId || req.user.userId;
    
    const [profile] = await pool.execute(`
      SELECT 
        u.username,
        u.email,
        up.*,
        ht.title_color,
        ht.title_icon,
        ht.description as title_description
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN honorific_titles ht ON up.current_title = ht.title_name
      WHERE u.id = ?
    `, [targetUserId]);

    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Obtenir les badges de l'utilisateur
    const [badges] = await pool.execute(`
      SELECT b.*, ub.earned_at
      FROM user_badges ub
      JOIN badges b ON ub.badge_id = b.id
      WHERE ub.user_id = ?
      ORDER BY ub.earned_at DESC
    `, [targetUserId]);

    // Obtenir les objets virtuels de l'utilisateur
    const [items] = await pool.execute(`
      SELECT vi.*, ui.purchased_at, ui.purchase_price, ui.is_equipped
      FROM user_items ui
      JOIN virtual_items vi ON ui.item_id = vi.id
      WHERE ui.user_id = ?
      ORDER BY ui.purchased_at DESC
    `, [targetUserId]);

    const userProfile = profile[0];
    
    res.json({
      success: true,
      profile: {
        username: userProfile.username,
        customPhrase: userProfile.custom_phrase || '',
        profilePicture: userProfile.profile_picture || '',
        totalSpent: parseFloat(userProfile.total_spent) || 0,
        title: {
          name: userProfile.current_title || 'Novice',
          color: userProfile.title_color || '#8B4513',
          icon: userProfile.title_icon || '👶',
          description: userProfile.title_description || 'Premier pas dans le monde du luxe'
        },
        prestigeLevel: userProfile.prestige_level || 0,
        badges: badges.map(badge => ({
          id: badge.id,
          name: badge.badge_name,
          description: badge.badge_description,
          icon: badge.badge_icon,
          color: badge.badge_color,
          earnedAt: badge.earned_at,
          isLimitedEdition: badge.is_limited_edition
        })),
        virtualItems: items.map(item => ({
          id: item.id,
          name: item.item_name,
          type: item.item_type,
          description: item.item_description,
          image: item.item_image,
          rarity: item.rarity,
          isEquipped: item.is_equipped,
          purchasedAt: item.purchased_at,
          purchasePrice: parseFloat(item.purchase_price),
          specialEffects: item.special_effects || '{}'
        })),
        createdAt: userProfile.created_at,
        updatedAt: userProfile.updated_at
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Mettre à jour le profil utilisateur
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { customPhrase, profilePicture } = req.body;
    
    // Créer ou mettre à jour le profil
    await pool.execute(`
      INSERT INTO user_profiles (user_id, custom_phrase, profile_picture)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
      custom_phrase = VALUES(custom_phrase),
      profile_picture = VALUES(profile_picture),
      updated_at = CURRENT_TIMESTAMP
    `, [req.user.userId, customPhrase || '', profilePicture || '']);

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir les messages sociaux récents
router.get('/messages', async (req, res) => {
  try {
    const [messages] = await pool.execute(`
      SELECT 
        sm.*,
        u.username,
        up.current_title,
        ht.title_color,
        ht.title_icon
      FROM social_messages sm
      JOIN users u ON sm.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN honorific_titles ht ON up.current_title = ht.title_name
      WHERE sm.is_visible = TRUE 
      AND (sm.expires_at IS NULL OR sm.expires_at > NOW())
      ORDER BY sm.created_at DESC
      LIMIT 20
    `);

    const formattedMessages = messages.map(msg => ({
      id: msg.id,
      username: msg.username,
      title: {
        name: msg.current_title || 'Novice',
        color: msg.title_color || '#8B4513',
        icon: msg.title_icon || '👶'
      },
      message: msg.message,
      amountSpent: parseFloat(msg.amount_spent),
      messageType: msg.message_type,
      createdAt: msg.created_at
    }));

    res.json({
      success: true,
      messages: formattedMessages
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des messages:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Poster un message social (pour les gros clics)
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { message, amountSpent, messageType = 'big_click' } = req.body;
    
    // Vérifier que le montant est suffisant pour un message public
    if (amountSpent < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Montant insuffisant pour un message public (minimum 1000€)'
      });
    }

    // Calculer l'expiration (messages visibles 1 heure)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(`
      INSERT INTO social_messages (user_id, message, amount_spent, message_type, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `, [req.user.userId, message, amountSpent, messageType, expiresAt]);

    res.json({
      success: true,
      message: 'Message publié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la publication du message:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir les défis publics actifs
router.get('/challenges', async (req, res) => {
  try {
    const [challenges] = await pool.execute(`
      SELECT 
        pc.*,
        (SELECT COUNT(*) FROM challenge_participations cp WHERE cp.challenge_id = pc.id) as participants_count,
        (SELECT COUNT(*) FROM challenge_participations cp WHERE cp.challenge_id = pc.id AND cp.is_winner = TRUE) as winners_count
      FROM public_challenges pc
      WHERE pc.is_active = TRUE 
      AND (pc.end_date IS NULL OR pc.end_date > NOW())
      ORDER BY pc.created_at DESC
    `);

    const formattedChallenges = challenges.map(challenge => ({
      id: challenge.id,
      name: challenge.challenge_name,
      description: challenge.challenge_description,
      type: challenge.challenge_type,
      targetValue: parseFloat(challenge.target_value),
      rewardType: challenge.reward_type,
      rewardValue: challenge.reward_value,
      startDate: challenge.start_date,
      endDate: challenge.end_date,
      maxWinners: challenge.max_winners,
      participantsCount: challenge.participants_count,
      winnersCount: challenge.winners_count,
      isActive: challenge.is_active
    }));

    res.json({
      success: true,
      challenges: formattedChallenges
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des défis:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Participer à un défi
router.post('/challenges/:challengeId/participate', authenticateToken, async (req, res) => {
  try {
    const challengeId = req.params.challengeId;
    
    // Vérifier que le défi existe et est actif
    const [challenge] = await pool.execute(`
      SELECT * FROM public_challenges 
      WHERE id = ? AND is_active = TRUE 
      AND (end_date IS NULL OR end_date > NOW())
    `, [challengeId]);

    if (challenge.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Défi non trouvé ou inactif'
      });
    }

    // Ajouter la participation
    await pool.execute(`
      INSERT IGNORE INTO challenge_participations (challenge_id, user_id)
      VALUES (?, ?)
    `, [challengeId, req.user.userId]);

    res.json({
      success: true,
      message: 'Participation enregistrée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la participation au défi:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir la boutique d'objets virtuels
router.get('/shop', async (req, res) => {
  try {
    const [items] = await pool.execute(`
      SELECT *,
      (CASE 
        WHEN is_limited_edition = TRUE AND max_supply IS NOT NULL 
        THEN max_supply - current_supply 
        ELSE NULL 
      END) as remaining_supply
      FROM virtual_items
      WHERE (is_limited_edition = FALSE OR current_supply < max_supply OR max_supply IS NULL)
      ORDER BY rarity DESC, base_price ASC
    `);

    const formattedItems = items.map(item => ({
      id: item.id,
      name: item.item_name,
      type: item.item_type,
      description: item.item_description,
      image: item.item_image,
      basePrice: parseFloat(item.base_price),
      rarity: item.rarity,
      isLimitedEdition: item.is_limited_edition,
      maxSupply: item.max_supply,
      currentSupply: item.current_supply,
      remainingSupply: item.remaining_supply,
      specialEffects: item.special_effects || '{}'
    }));

    res.json({
      success: true,
      items: formattedItems
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la boutique:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Acheter un objet virtuel
router.post('/shop/purchase/:itemId', authenticateToken, async (req, res) => {
  try {
    const itemId = req.params.itemId;
    
    // Obtenir l'objet et vérifier la disponibilité
    const [item] = await pool.execute(`
      SELECT * FROM virtual_items WHERE id = ?
    `, [itemId]);

    if (item.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Objet non trouvé'
      });
    }

    const virtualItem = item[0];

    // Vérifier le stock pour les éditions limitées
    if (virtualItem.is_limited_edition && virtualItem.max_supply && 
        virtualItem.current_supply >= virtualItem.max_supply) {
      return res.status(400).json({
        success: false,
        message: 'Objet en rupture de stock'
      });
    }

    // Vérifier les crédits de l'utilisateur
    const [user] = await pool.execute(`
      SELECT credits FROM users WHERE id = ?
    `, [req.user.userId]);

    if (user.length === 0 || parseFloat(user[0].credits) < parseFloat(virtualItem.base_price)) {
      return res.status(400).json({
        success: false,
        message: 'Crédits insuffisants'
      });
    }

    // Effectuer l'achat dans une transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Débiter les crédits
      await connection.execute(`
        UPDATE users SET credits = credits - ? WHERE id = ?
      `, [virtualItem.base_price, req.user.userId]);

      // Ajouter l'objet à l'inventaire
      await connection.execute(`
        INSERT INTO user_items (user_id, item_id, purchase_price)
        VALUES (?, ?, ?)
      `, [req.user.userId, itemId, virtualItem.base_price]);

      // Mettre à jour le stock si édition limitée
      if (virtualItem.is_limited_edition) {
        await connection.execute(`
          UPDATE virtual_items SET current_supply = current_supply + 1 WHERE id = ?
        `, [itemId]);
      }

      // Mettre à jour le total dépensé
      await connection.execute(`
        INSERT INTO user_profiles (user_id, total_spent)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        total_spent = total_spent + VALUES(total_spent)
      `, [req.user.userId, virtualItem.base_price]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Achat effectué avec succès',
        item: {
          name: virtualItem.item_name,
          price: parseFloat(virtualItem.base_price)
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erreur lors de l\'achat:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

export default router;
