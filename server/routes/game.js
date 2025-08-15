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

// Charger la sauvegarde du jeu
router.get('/save', authenticateToken, async (req, res) => {
  try {
    const [saves] = await pool.execute(
      'SELECT * FROM game_saves WHERE user_id = ? ORDER BY last_save DESC LIMIT 1',
      [req.user.userId]
    );

    if (saves.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Aucune sauvegarde trouvée' 
      });
    }

    const save = saves[0];
    
    res.json({
      success: true,
      save: {
        money: save.money,
        moneyPerClick: save.money_per_click,
        moneyPerSecond: save.money_per_second,
        upgrades: save.upgrades,
        stats: save.stats
      }
    });

  } catch (error) {
    console.error('Erreur lors du chargement de la sauvegarde:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Sauvegarder le jeu
router.post('/save', authenticateToken, async (req, res) => {
  try {
    const { money, moneyPerClick, moneyPerSecond, upgrades, stats } = req.body;

    // Vérifier si une sauvegarde existe déjà
    const [existingSaves] = await pool.execute(
      'SELECT id FROM game_saves WHERE user_id = ?',
      [req.user.userId]
    );

    if (existingSaves.length > 0) {
      // Mettre à jour la sauvegarde existante
      await pool.execute(
        `UPDATE game_saves 
         SET money = ?, money_per_click = ?, money_per_second = ?, 
             upgrades = ?, stats = ?, last_save = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [
          money,
          moneyPerClick,
          moneyPerSecond,
          JSON.stringify(upgrades),
          JSON.stringify(stats),
          req.user.userId
        ]
      );
    } else {
      // Créer une nouvelle sauvegarde
      await pool.execute(
        `INSERT INTO game_saves 
         (user_id, money, money_per_click, money_per_second, upgrades, stats)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.user.userId,
          money,
          moneyPerClick,
          moneyPerSecond,
          JSON.stringify(upgrades),
          JSON.stringify(stats)
        ]
      );
    }

    res.json({
      success: true,
      message: 'Jeu sauvegardé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

// Obtenir les statistiques globales
router.get('/leaderboard', async (req, res) => {
  try {
    const [leaderboard] = await pool.execute(`
      SELECT u.username, gs.money, gs.stats
      FROM game_saves gs
      JOIN users u ON gs.user_id = u.id
      ORDER BY gs.money DESC
      LIMIT 10
    `);

    const formattedLeaderboard = leaderboard.map(entry => ({
      username: entry.username,
      money: entry.money,
      totalClicks: entry.stats.totalClicks || 0
    }));

    res.json({
      success: true,
      leaderboard: formattedLeaderboard
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur interne du serveur' 
    });
  }
});

export default router; 