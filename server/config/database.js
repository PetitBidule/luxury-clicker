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
        wallet_cents BIGINT NOT NULL DEFAULT 0,
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

    // Créer la table des paiements (top-ups) Stripe
    await dbConnection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_id VARCHAR(191) NOT NULL,
        amount_cents BIGINT NOT NULL,
        status ENUM('created','paid','expired','canceled') DEFAULT 'created',
        credited TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_payments_session_id (session_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Sécurité: tenter d'ajouter la colonne wallet_cents si base déjà existante
    try {
      await dbConnection.query('ALTER TABLE users ADD COLUMN wallet_cents BIGINT NOT NULL DEFAULT 0');
    } catch (e) {
      // ignore si déjà existante
    }
    
    console.log('✅ Base de données initialisée avec succès');
    await dbConnection.end();
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

export { pool, initDatabase }; 