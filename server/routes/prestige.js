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

// Mettre à jour le titre d'un utilisateur basé sur son total dépensé
async function updateUserTitle(userId, totalSpent) {
  try {
    const [titles] = await pool.execute(`
      SELECT title_name FROM honorific_titles 
      WHERE required_amount <= ? 
      ORDER BY required_amount DESC 
      LIMIT 1
    `, [totalSpent]);

    if (titles.length > 0) {
      await pool.execute(`
        INSERT INTO user_profiles (user_id, current_title)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        current_title = VALUES(current_title)
      `, [userId, titles[0].title_name]);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour du titre:', error);
  }
}

// Vérifier et attribuer les badges automatiquement
async function checkAndAwardBadges(userId, stats) {
  try {
    const { totalSpent, totalClicks } = stats;

    // Obtenir les badges que l'utilisateur n'a pas encore
    const [availableBadges] = await pool.execute(`
      SELECT b.* FROM badges b
      WHERE b.id NOT IN (
        SELECT ub.badge_id FROM user_badges ub WHERE ub.user_id = ?
      )
    `, [userId]);

    for (const badge of availableBadges) {
      let shouldAward = false;

      switch (badge.requirement_type) {
        case 'amount_spent':
          shouldAward = totalSpent >= parseFloat(badge.requirement_value);
          break;
        case 'clicks_count':
          shouldAward = totalClicks >= parseFloat(badge.requirement_value);
          break;
      }

      if (shouldAward) {
        // Vérifier les limites pour les badges en édition limitée
        if (badge.is_limited_edition && badge.max_recipients) {
          const [currentRecipients] = await pool.execute(`
            SELECT COUNT(*) as count FROM user_badges WHERE badge_id = ?
          `, [badge.id]);

          if (currentRecipients[0].count >= badge.max_recipients) {
            continue;
          }
        }

        // Attribuer le badge
        await pool.execute(`
          INSERT IGNORE INTO user_badges (user_id, badge_id)
          VALUES (?, ?)
        `, [userId, badge.id]);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des badges:', error);
  }
}

// Enregistrer un gros clic et mettre à jour les statistiques de prestige
router.post('/big-click', authenticateToken, async (req, res) => {
  try {
    const { amount, message } = req.body;
    
    if (!amount || amount < 1000) {
      return res.status(400).json({
        success: false,
        message: 'Montant insuffisant pour un gros clic (minimum 1000€)'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Mettre à jour le total dépensé
      await connection.execute(`
        INSERT INTO user_profiles (user_id, total_spent)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        total_spent = total_spent + VALUES(total_spent)
      `, [req.user.userId, amount]);

      // Obtenir le nouveau total
      const [profile] = await connection.execute(`
        SELECT total_spent FROM user_profiles WHERE user_id = ?
      `, [req.user.userId]);

      const newTotal = parseFloat(profile[0]?.total_spent || 0);

      // Mettre à jour le titre
      await updateUserTitle(req.user.userId, newTotal);

      // Publier un message social si fourni
      if (message && amount >= 5000) {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
        await connection.execute(`
          INSERT INTO social_messages (user_id, message, amount_spent, message_type, expires_at)
          VALUES (?, ?, ?, 'big_click', ?)
        `, [req.user.userId, message, amount, expiresAt]);
      }

      // Vérifier les badges
      const [gameStats] = await connection.execute(`
        SELECT stats FROM game_saves WHERE user_id = ?
      `, [req.user.userId]);

      if (gameStats.length > 0) {
        const stats = JSON.parse(gameStats[0].stats);
        await checkAndAwardBadges(req.user.userId, {
          totalSpent: newTotal,
          totalClicks: stats.totalClicks || 0
        });
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Gros clic enregistré avec succès',
        newTotal,
        messagePublished: message && amount >= 5000
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du gros clic:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Voler du prestige à un autre utilisateur
router.post('/steal-prestige/:targetUserId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.targetUserId;
    const { cost = 10000 } = req.body; // Coût par défaut : 10 000€
    
    if (targetUserId == req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas vous voler votre propre prestige'
      });
    }

    // Vérifier les crédits de l'utilisateur
    const [user] = await pool.execute(`
      SELECT credits FROM users WHERE id = ?
    `, [req.user.userId]);

    if (user.length === 0 || parseFloat(user[0].credits) < cost) {
      return res.status(400).json({
        success: false,
        message: 'Crédits insuffisants pour cette action'
      });
    }

    // Vérifier que la cible existe
    const [target] = await pool.execute(`
      SELECT u.username, up.prestige_level 
      FROM users u 
      LEFT JOIN user_profiles up ON u.id = up.user_id 
      WHERE u.id = ?
    `, [targetUserId]);

    if (target.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur cible non trouvé'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Débiter les crédits
      await connection.execute(`
        UPDATE users SET credits = credits - ? WHERE id = ?
      `, [cost, req.user.userId]);

      // Réduire temporairement le prestige de la cible
      await connection.execute(`
        INSERT INTO user_profiles (user_id, prestige_level)
        VALUES (?, -1)
        ON DUPLICATE KEY UPDATE
        prestige_level = GREATEST(prestige_level - 1, 0)
      `, [targetUserId]);

      // Enregistrer l'action de prestige
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      await connection.execute(`
        INSERT INTO prestige_actions (from_user_id, to_user_id, action_type, cost, duration_minutes, expires_at, action_data)
        VALUES (?, ?, 'prestige_theft', ?, 30, ?, ?)
      `, [req.user.userId, targetUserId, cost, expiresAt, JSON.stringify({ targetUsername: target[0].username })]);

      await connection.commit();

      res.json({
        success: true,
        message: `Prestige volé à ${target[0].username} pour 30 minutes`,
        cost,
        expiresAt
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erreur lors du vol de prestige:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Acheter un boost temporaire
router.post('/boost', authenticateToken, async (req, res) => {
  try {
    const { boostType, duration = 60, cost = 5000 } = req.body;
    
    const validBoosts = ['click_visibility', 'golden_effect', 'double_prestige'];
    if (!validBoosts.includes(boostType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de boost invalide'
      });
    }

    // Vérifier les crédits
    const [user] = await pool.execute(`
      SELECT credits FROM users WHERE id = ?
    `, [req.user.userId]);

    if (user.length === 0 || parseFloat(user[0].credits) < cost) {
      return res.status(400).json({
        success: false,
        message: 'Crédits insuffisants'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Débiter les crédits
      await connection.execute(`
        UPDATE users SET credits = credits - ? WHERE id = ?
      `, [cost, req.user.userId]);

      // Enregistrer le boost
      const expiresAt = new Date(Date.now() + duration * 60 * 1000);
      await connection.execute(`
        INSERT INTO prestige_actions (from_user_id, action_type, cost, duration_minutes, expires_at, action_data)
        VALUES (?, 'boost_purchase', ?, ?, ?, ?)
      `, [req.user.userId, cost, duration, expiresAt, JSON.stringify({ boostType })]);

      await connection.commit();

      res.json({
        success: true,
        message: `Boost ${boostType} activé pour ${duration} minutes`,
        boostType,
        duration,
        cost,
        expiresAt
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Erreur lors de l\'achat du boost:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir les actions de prestige actives
router.get('/active-actions', authenticateToken, async (req, res) => {
  try {
    const [actions] = await pool.execute(`
      SELECT 
        pa.*,
        u1.username as from_username,
        u2.username as to_username
      FROM prestige_actions pa
      JOIN users u1 ON pa.from_user_id = u1.id
      LEFT JOIN users u2 ON pa.to_user_id = u2.id
      WHERE (pa.from_user_id = ? OR pa.to_user_id = ?)
      AND (pa.expires_at IS NULL OR pa.expires_at > NOW())
      ORDER BY pa.created_at DESC
    `, [req.user.userId, req.user.userId]);

    const formattedActions = actions.map(action => ({
      id: action.id,
      actionType: action.action_type,
      fromUsername: action.from_username,
      toUsername: action.to_username,
      cost: parseFloat(action.cost),
      durationMinutes: action.duration_minutes,
      expiresAt: action.expires_at,
      actionData: JSON.parse(action.action_data || '{}'),
      createdAt: action.created_at
    }));

    res.json({
      success: true,
      actions: formattedActions
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des actions:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir les statistiques de prestige globales
router.get('/stats', async (req, res) => {
  try {
    // Total dépensé aujourd'hui
    const [todayStats] = await pool.execute(`
      SELECT 
        SUM(amount_spent) as total_today,
        COUNT(DISTINCT user_id) as active_users_today
      FROM social_messages 
      WHERE DATE(created_at) = CURDATE()
    `);

    // Plus gros clic de la semaine
    const [weeklyBiggest] = await pool.execute(`
      SELECT 
        sm.amount_spent,
        u.username,
        up.current_title
      FROM social_messages sm
      JOIN users u ON sm.user_id = u.id
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE sm.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY sm.amount_spent DESC
      LIMIT 1
    `);

    // Nombre total d'objets de luxe possédés
    const [luxuryItems] = await pool.execute(`
      SELECT COUNT(*) as total_luxury_items
      FROM user_items ui
      JOIN virtual_items vi ON ui.item_id = vi.id
      WHERE vi.rarity IN ('epic', 'legendary', 'mythic')
    `);

    res.json({
      success: true,
      stats: {
        totalSpentToday: parseFloat(todayStats[0]?.total_today || 0),
        activeUsersToday: todayStats[0]?.active_users_today || 0,
        biggestClickThisWeek: {
          amount: parseFloat(weeklyBiggest[0]?.amount_spent || 0),
          username: weeklyBiggest[0]?.username || null,
          title: weeklyBiggest[0]?.current_title || null
        },
        totalLuxuryItems: luxuryItems[0]?.total_luxury_items || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

export default router;
