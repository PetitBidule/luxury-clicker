# 🚀 Démarrage Rapide - Luxury Clicker avec API de Paiement

## ⚡ Démarrage en 3 Étapes

### 1. **Installation des Dépendances**
```bash
cd luxury-clicker
node install-payment-deps.js
```

### 2. **Configuration des Clés d'API**
```bash
# Copiez le fichier d'exemple
cp server/env.payment.example server/.env

# Éditez server/.env avec vos vraies clés
# STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle
# STRIPE_SECRET_KEY=sk_test_votre_cle
```

### 3. **Lancement de l'Application**
```bash
# Développement complet (frontend + backend + paiements)
npm run dev:payment

# OU séparément :
npm run server    # Backend
npm run dev       # Frontend
```

## 🌐 Accès à l'Application

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/api

## 🧪 Test Rapide

### **Test de l'API de Paiement**
```bash
npm run test:payment
```

### **Test des Webhooks**
```bash
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "amount": "25.00", "status": "completed"}'
```

## 💳 Test avec Carte de Test

- **Numéro**: `4242 4242 4242 4242`
- **Date**: `12/25` (ou toute date future)
- **CVV**: `123`
- **Code postal**: `12345`

## 📚 Documentation Complète

- `IMPLEMENTATION_SUMMARY.md` - Vue d'ensemble
- `PAYMENT_API_README.md` - Guide détaillé
- `TEST_CARDS.md` - Cartes et comptes de test

## 🆘 Dépannage Rapide

### **L'application ne se lance pas**
```bash
# Vérifiez que vous êtes dans le bon répertoire
pwd  # Doit afficher .../luxury-clicker

# Réinstallez les dépendances
npm install
```

### **L'API de paiement ne répond pas**
```bash
# Vérifiez que le serveur backend est lancé
npm run server

# Vérifiez les logs pour les erreurs
```

### **Les webhooks ne fonctionnent pas**
```bash
# Testez avec le webhook de test
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

## 🎯 Fonctionnalités Disponibles

- ✅ **Jeu de clic** avec 10 améliorations
- ✅ **Système de paiement** avec Stripe/PayPal
- ✅ **Redirection automatique** vers les APIs
- ✅ **Webhooks** pour confirmer les paiements
- ✅ **Interface moderne** et responsive
- ✅ **Authentification** sécurisée

## 🚀 Prêt pour la Production

Une fois testé et validé :

1. **Configurez vos clés live** dans `server/.env`
2. **Déployez avec HTTPS** (obligatoire pour les webhooks)
3. **Configurez vos webhooks** dans les dashboards
4. **Testez en production** avec de petites sommes

---

**🎉 Votre application est maintenant prête pour de vrais paiements !**
