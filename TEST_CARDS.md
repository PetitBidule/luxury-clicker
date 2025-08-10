# Cartes de Test pour les Paiements

## 🧪 Cartes de Test Stripe

### Cartes qui réussissent
- **Visa**: `4242 4242 4242 4242`
- **Mastercard**: `5555 5555 5555 4444`
- **American Express**: `3782 822463 10005`

### Cartes qui échouent
- **Déclinée**: `4000 0000 0000 0002`
- **Fonds insuffisants**: `4000 0000 0000 9995`
- **Carte expirée**: `4000 0000 0000 0069`
- **CVV incorrect**: `4000 0000 0000 0127`

### Informations de test
- **Date d'expiration**: Utilisez une date future (ex: `12/25`)
- **CVV**: Utilisez n'importe quel code à 3 chiffres (ex: `123`)
- **Code postal**: Utilisez n'importe quel code postal valide (ex: `12345`)

## 🧪 Cartes de Test PayPal

### Cartes qui réussissent
- **Visa**: `4032030000000000`
- **Mastercard**: `5424000000000015`
- **American Express**: `371449635398431`

### Informations de test
- **Date d'expiration**: Utilisez une date future
- **CVV**: Utilisez n'importe quel code à 3 chiffres
- **Code postal**: Utilisez n'importe quel code postal valide

## 🧪 Comptes de Test PayPal

### Compte Acheteur
- **Email**: `sb-buyer@business.example.com`
- **Mot de passe**: `test123`

### Compte Vendeur
- **Email**: `sb-seller@business.example.com`
- **Mot de passe**: `test123`

## 🧪 Test des Webhooks

### Test avec cURL

#### Webhook de test
```bash
curl -X POST http://localhost:5000/api/webhooks/test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user_123",
    "amount": "25.00",
    "status": "completed"
  }'
```

#### Webhook Stripe simulé
```bash
curl -X POST http://localhost:5000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_123",
        "metadata": {
          "userId": "test_user_123",
          "gameAmount": "25.00"
        },
        "amount_total": 2500,
        "currency": "eur"
      }
    }
  }'
```

#### Webhook PayPal simulé
```bash
curl -X POST http://localhost:5000/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{
    "paymentId": "PAY-123456789",
    "PayerID": "BUYER123",
    "status": "completed",
    "amount": "25.00"
  }'
```

## 🧪 Test de l'API de Paiement

### Test d'initiation de paiement
```bash
curl -X POST http://localhost:5000/api/payment/initiate-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 25.00,
    "currency": "EUR"
  }'
```

### Test de l'historique des paiements
```bash
curl -X GET http://localhost:5000/api/payment/payment-history \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🧪 Test de l'Interface Utilisateur

### Étapes de test
1. **Lancez l'application**: `npm run dev:payment`
2. **Connectez-vous** avec un compte utilisateur
3. **Cliquez sur "Recharger avec carte bancaire"**
4. **Remplissez le formulaire** avec une carte de test
5. **Soumettez le paiement**
6. **Vérifiez la redirection** vers l'API de paiement
7. **Vérifiez les logs** du serveur pour les webhooks

### Points de vérification
- ✅ Le popup de carte bancaire s'affiche
- ✅ La validation des champs fonctionne
- ✅ L'API de paiement est appelée
- ✅ La redirection fonctionne
- ✅ Les webhooks sont reçus
- ✅ Le solde est mis à jour

## 🧪 Dépannage

### Problèmes courants

#### L'API ne répond pas
- Vérifiez que le serveur backend est lancé
- Vérifiez les logs du serveur
- Vérifiez la configuration CORS

#### Les webhooks ne sont pas reçus
- Vérifiez l'URL du webhook
- Vérifiez la signature (pour Stripe)
- Vérifiez les logs du serveur

#### Les paiements ne sont pas confirmés
- Vérifiez la configuration des clés d'API
- Vérifiez le mode (sandbox/live)
- Vérifiez les logs de l'API de paiement

### Logs utiles
```bash
# Logs du serveur backend
npm run server

# Logs du frontend
npm run dev

# Logs combinés
npm run dev:payment
```

## 🧪 Configuration de Production

### Variables d'environnement
```bash
# Stripe Production
STRIPE_ENABLED=true
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_live
STRIPE_SECRET_KEY=sk_live_votre_cle_live
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_live

# PayPal Production
PAYPAL_ENABLED=true
PAYPAL_CLIENT_ID=votre_client_id_live
PAYPAL_CLIENT_SECRET=votre_client_secret_live
PAYPAL_MODE=live
```

### URLs de production
```bash
# Webhooks
PAYMENT_WEBHOOK_URL=https://votre-domaine.com/api/webhooks

# Redirections
PAYMENT_SUCCESS_URL=https://votre-domaine.com/payment/success
PAYMENT_CANCEL_URL=https://votre-domaine.com/payment/cancel
```

## 🧪 Ressources de Test

- [Stripe Test Cards](https://stripe.com/docs/testing#cards)
- [PayPal Test Cards](https://developer.paypal.com/docs/classic/lifecycle/ug_sandbox/)
- [Stripe Webhook Testing](https://stripe.com/docs/webhooks/test)
- [PayPal Webhook Testing](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)
