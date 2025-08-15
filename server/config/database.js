import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'luxury_clicker',
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Créer le pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour initialiser la base de données
async function initDatabase() {
  try {
    // Créer une connexion sans spécifier de base de données
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    // Créer la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    
    // Fermer cette connexion
    await connection.end();
    
    // Créer une nouvelle connexion avec la base de données spécifiée
    const dbConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    // Créer la table des utilisateurs
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        credits DECIMAL(10, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Créer la table des sauvegardes de jeu
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS game_saves (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        money BIGINT DEFAULT 0,
        money_per_click INT DEFAULT 1,
        money_per_second INT DEFAULT 0,
        upgrades JSON,
        stats JSON,
        last_save TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Créer la table des profils utilisateur étendus
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        custom_phrase VARCHAR(200) DEFAULT '',
        profile_picture VARCHAR(500) DEFAULT '',
        total_spent DECIMAL(15, 2) DEFAULT 0.00,
        current_title VARCHAR(50) DEFAULT 'Novice',
        prestige_level INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_profile (user_id)
      )
    `);

    // Créer la table des titres honorifiques
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS honorific_titles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title_name VARCHAR(50) NOT NULL,
        required_amount DECIMAL(15, 2) NOT NULL,
        title_color VARCHAR(7) DEFAULT '#FFD700',
        title_icon VARCHAR(50) DEFAULT '👑',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table des badges
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_name VARCHAR(100) NOT NULL,
        badge_description TEXT,
        badge_icon VARCHAR(50) DEFAULT '🏆',
        badge_color VARCHAR(7) DEFAULT '#FFD700',
        requirement_type ENUM('amount_spent', 'clicks_count', 'rank_achievement', 'special_event') NOT NULL,
        requirement_value DECIMAL(15, 2),
        is_limited_edition BOOLEAN DEFAULT FALSE,
        max_recipients INT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table des badges utilisateur
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        badge_id INT NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_badge (user_id, badge_id)
      )
    `);

    // Créer la table des objets virtuels
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS virtual_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_name VARCHAR(100) NOT NULL,
        item_type ENUM('cursor', 'effect', 'collectible', 'nft', 'vehicle', 'property') NOT NULL,
        item_description TEXT,
        item_image VARCHAR(500),
        base_price DECIMAL(15, 2) NOT NULL,
        rarity ENUM('common', 'rare', 'epic', 'legendary', 'mythic') DEFAULT 'common',
        is_limited_edition BOOLEAN DEFAULT FALSE,
        max_supply INT DEFAULT NULL,
        current_supply INT DEFAULT 0,
        special_effects JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table des objets utilisateur
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS user_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        item_id INT NOT NULL,
        purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        purchase_price DECIMAL(15, 2),
        is_equipped BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES virtual_items(id) ON DELETE CASCADE
      )
    `);

    // Créer la table des messages sociaux
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS social_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        amount_spent DECIMAL(15, 2) NOT NULL,
        message_type ENUM('big_click', 'achievement', 'challenge') DEFAULT 'big_click',
        is_visible BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Créer la table des défis publics
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS public_challenges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        challenge_name VARCHAR(200) NOT NULL,
        challenge_description TEXT,
        challenge_type ENUM('clicks_count', 'amount_spent', 'time_limited') NOT NULL,
        target_value DECIMAL(15, 2) NOT NULL,
        reward_type ENUM('badge', 'title', 'item', 'credits') NOT NULL,
        reward_value VARCHAR(100),
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        max_winners INT DEFAULT 1,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Créer la table des participations aux défis
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS challenge_participations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        challenge_id INT NOT NULL,
        user_id INT NOT NULL,
        current_progress DECIMAL(15, 2) DEFAULT 0,
        is_winner BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (challenge_id) REFERENCES public_challenges(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_challenge (challenge_id, user_id)
      )
    `);

    // Créer la table des actions de prestige (vol, boost, etc.)
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS prestige_actions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        from_user_id INT NOT NULL,
        to_user_id INT,
        action_type ENUM('prestige_theft', 'boost_purchase', 'challenge_creation') NOT NULL,
        action_data JSON,
        cost DECIMAL(15, 2) NOT NULL,
        duration_minutes INT DEFAULT NULL,
        expires_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    
    // Insérer les titres honorifiques par défaut
    await dbConnection.query(`
      INSERT IGNORE INTO honorific_titles (title_name, required_amount, title_color, title_icon, description) VALUES
      ('Novice', 0, '#8B4513', '👶', 'Premier pas dans le monde du luxe'),
      ('Bourgeois', 1000, '#CD853F', '🎩', 'Commence à comprendre le raffinement'),
      ('Baron', 10000, '#DAA520', '👑', 'Noblesse d\\'argent reconnue'),
      ('Comte', 50000, '#FFD700', '💎', 'Aristocratie du clic confirmée'),
      ('Duc', 200000, '#FF6347', '🏰', 'Grande noblesse du luxe'),
      ('Magnat', 1000000, '#8A2BE2', '💰', 'Empire financier établi'),
      ('Sultan', 5000000, '#FF1493', '👸', 'Richesse orientale légendaire'),
      ('Empereur', 20000000, '#FF0000', '🔱', 'Domination absolue du luxe')
    `);

    // Insérer les badges par défaut
    await dbConnection.query(`
      INSERT IGNORE INTO badges (badge_name, badge_description, badge_icon, badge_color, requirement_type, requirement_value, is_limited_edition, max_recipients) VALUES
      ('Premier Clic', 'Votre premier pas vers la richesse', '🥇', '#FFD700', 'clicks_count', 1, FALSE, NULL),
      ('Millionnaire', 'Atteindre le premier million', '💰', '#00FF00', 'amount_spent', 1000000, FALSE, NULL),
      ('Clic à 1000€', 'Effectuer un clic valant 1000€', '💸', '#FF6347', 'amount_spent', 1000, FALSE, NULL),
      ('Premier du Mois', 'Être #1 du classement mensuel', '🏆', '#FFD700', 'rank_achievement', 1, TRUE, 1),
      ('Millionnaire du Jour', 'Dépenser 1M€ en une journée', '⚡', '#FF1493', 'special_event', 1000000, TRUE, NULL),
      ('Collectionneur', 'Posséder 10 objets virtuels', '🎨', '#8A2BE2', 'special_event', 10, FALSE, NULL),
      ('Légende Vivante', 'Atteindre 100M€ dépensés', '🌟', '#FF0000', 'amount_spent', 100000000, TRUE, 10)
    `);

    // Insérer les objets virtuels par défaut
    await dbConnection.query(`
    INSERT IGNORE INTO virtual_items 
(item_name, item_type, item_description, item_image, base_price, rarity, is_limited_edition, max_supply, special_effects) 
VALUES
('Curseur Or', 'cursor', 'Un curseur en or massif 24 carats', '/images/cursors/gold-cursor.png', 5000, 'rare', FALSE, NULL, '{"clickEffect": "goldSparkle", "soundEffect": "goldClink"}'),
('Montre Rolex', 'cursor', 'Montre de luxe suisse pour cliquer avec style', '/images/cursors/rolex-cursor.png', 25000, 'epic', FALSE, NULL, '{"clickEffect": "timeWarp", "bonusMultiplier": 1.1}'),
('Stylo Montblanc', 'cursor', 'Stylo de prestige pour signer vos clics', '/images/cursors/montblanc-cursor.png', 15000, 'epic', FALSE, NULL, '{"clickEffect": "inkSplash", "eleganceBonus": true}'),
('Diamant Curseur', 'cursor', 'Le summum du luxe pour vos clics', '/images/cursors/diamond-cursor.png', 100000, 'legendary', TRUE, 50, '{"clickEffect": "diamondBurst", "bonusMultiplier": 1.5}'),
('Effet Pluie d Or', 'effect', 'Pluie de pièces d or à chaque clic', '/images/effects/gold-rain.gif', 10000, 'rare', FALSE, NULL, '{"effectType": "goldRain", "duration": 300}'),
('Explosion Diamant', 'effect', 'Explosion de diamants spectaculaire', '/images/effects/diamond-explosion.gif', 50000, 'legendary', TRUE, 100, '{"effectType": "diamondExplosion", "intensity": "high"}'),
('Yacht de Luxe', 'vehicle', 'Yacht privé pour naviguer en style', '/images/vehicles/luxury-yacht.jpg', 500000, 'legendary', FALSE, NULL, '{"prestigeBonus": 50, "displayLocation": "marina"}'),
('Ferrari LaFerrari', 'vehicle', 'Supercar italienne exclusive', '/images/vehicles/laferrari.jpg', 300000, 'epic', TRUE, 200, '{"prestigeBonus": 30, "displayLocation": "garage"}'),
('Villa Monaco', 'property', 'Villa avec vue sur la Méditerranée', '/images/properties/monaco-villa.jpg', 2000000, 'mythic', TRUE, 10, '{"prestigeBonus": 200, "displayLocation": "properties"}'),
('NFT Clic d Or', 'nft', 'Œuvre d art numérique unique du 15 août', '/images/nfts/golden-click.png', 75000, 'legendary', TRUE, 10, '{"uniqueId": true, "artistSignature": "LuxuryMaster", "dateCreated": "2024-08-15"}');

      `);

    console.log('✅ Base de données initialisée avec succès');
    await dbConnection.end();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

// Fonctions pour gérer les crédits utilisateur
async function getUserCredits(userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT credits FROM users WHERE id = ?',
      [userId]
    );
    return rows.length > 0 ? parseFloat(rows[0].credits) : 0;
  } catch (error) {
    console.error('Erreur lors de la récupération des crédits:', error);
    throw error;
  }
}

async function updateUserCredits(userId, newCredits) {
  try {
    await pool.execute(
      'UPDATE users SET credits = ? WHERE id = ?',
      [newCredits, userId]
    );
  } catch (error) {
    console.error('Erreur lors de la mise à jour des crédits:', error);
    throw error;
  }
}

async function getUserById(userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    throw error;
  }
}

export { pool, initDatabase, getUserCredits, updateUserCredits, getUserById }; 