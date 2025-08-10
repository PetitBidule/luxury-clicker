# 🎮 Luxury Clicker

Un jeu de clic addictif et élégant où vous devenez milliardaire en un clic ! Remplacez les cookies par de l'argent et construisez votre empire financier avec un système d'authentification complet.

## ✨ Fonctionnalités

- **Interface moderne et épurée** : Design responsive avec des animations fluides
- **Système d'authentification complet** : Inscription, connexion et gestion des sessions
- **Sauvegarde en base de données** : Progression sauvegardée automatiquement en MySQL
- **Système d'améliorations** : 5 niveaux d'améliorations pour augmenter vos gains
- **Gains automatiques** : Certaines améliorations génèrent de l'argent par seconde
- **Statistiques détaillées** : Suivez vos performances et votre temps de jeu
- **Design responsive** : Jouez sur ordinateur, tablette ou mobile

## 🚀 Installation et lancement

### Prérequis
- **Node.js** (version 18 ou supérieure)
- **MySQL** (version 5.7 ou supérieure)
- **npm** ou **yarn**

### 1. Configuration de la base de données
1. **Installer MySQL** sur votre machine
2. **Créer un utilisateur MySQL** ou utiliser l'utilisateur root
3. **Créer le fichier `.env`** dans le dossier `server/` :
   ```bash
   cd server
   cp env.example .env
   ```
4. **Modifier le fichier `.env`** avec vos informations de base de données :
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=luxury_clicker
   DB_PORT=3306
   JWT_SECRET=votre_cle_secrete_jwt
   ```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Lancement de l'application

#### Option 1 : Lancer le serveur et le client séparément
```bash
# Terminal 1 - Démarrer le serveur backend
npm run server

# Terminal 2 - Démarrer le client React
npm run dev
```

#### Option 2 : Lancer tout en une seule commande
```bash
npm run dev:full
```

### 4. Accéder à l'application
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:5000
- **Test de santé** : http://localhost:5000/api/health

## 🎯 Comment jouer

1. **Créez un compte** ou **connectez-vous** à votre compte existant
2. **Cliquez sur le bouton principal** pour gagner de l'argent
3. **Achetez des améliorations** pour augmenter vos gains par clic
4. **Investissez dans des sources de revenus passifs** pour gagner de l'argent automatiquement
5. **Surveillez vos statistiques** pour optimiser votre stratégie
6. **Votre progression est automatiquement sauvegardée** en base de données
7. **Devenez milliardaire** ! 💰

## 🛠️ Technologies utilisées

### Frontend
- **React 18** - Framework frontend moderne
- **Vite** - Outil de build rapide
- **CSS3** - Animations et design responsive

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MySQL** - Base de données relationnelle
- **JWT** - Authentification sécurisée
- **bcryptjs** - Hashage des mots de passe
- **CORS** - Gestion des requêtes cross-origin

## 📊 Structure de la base de données

### Table `users`
- `id` : Identifiant unique
- `username` : Nom d'utilisateur (unique)
- `email` : Adresse email (unique)
- `password` : Mot de passe hashé
- `created_at` : Date de création
- `updated_at` : Date de mise à jour

### Table `game_saves`
- `id` : Identifiant unique
- `user_id` : Référence vers l'utilisateur
- `money` : Argent actuel
- `money_per_click` : Argent gagné par clic
- `money_per_second` : Argent gagné par seconde
- `upgrades` : Niveaux des améliorations (JSON)
- `stats` : Statistiques de jeu (JSON)
- `last_save` : Dernière sauvegarde

## 🔐 Sécurité

- **Mots de passe hashés** avec bcrypt (12 rounds de sel)
- **JWT** pour l'authentification des sessions
- **Validation des données** côté serveur
- **Protection CORS** configurée
- **Requêtes SQL préparées** pour éviter les injections

## 📱 Compatibilité

- ✅ Ordinateurs (Windows, macOS, Linux)
- ✅ Tablettes
- ✅ Mobiles (iOS, Android)
- ✅ Tous les navigateurs modernes

## 🎨 Personnalisation

Le jeu est entièrement personnalisable via les fichiers CSS. Modifiez les couleurs, animations et styles selon vos préférences !

## 🚨 Dépannage

### Erreur de connexion à la base de données
- Vérifiez que MySQL est démarré
- Vérifiez les informations de connexion dans `.env`
- Assurez-vous que l'utilisateur MySQL a les droits suffisants

### Erreur CORS
- Vérifiez que l'URL du frontend dans `.env` correspond à votre configuration
- Redémarrez le serveur après modification

### Port déjà utilisé
- Modifiez le port dans le fichier `.env`
- Ou arrêtez le processus utilisant le port

## 📄 Licence

MIT License - Libre d'utilisation et de modification

---

**Amusez-vous bien et devenez le prochain milliardaire ! 🚀💰**
