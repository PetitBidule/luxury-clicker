# API de Paiement - Luxury Clicker

## Vue d'ensemble

Ce projet intègre maintenant une vraie API de paiement pour permettre aux utilisateurs de recharger leur compte en jeu avec de vraies cartes bancaires. L'API redirige vers un prestataire de paiement externe (Stripe, PayPal, etc.) et traite les webhooks pour confirmer les paiements.

## Configuration

### 1. Variables d'environnement

Copiez le fichier `server/env.payment.example` vers `server/.env` et configurez vos clés d'API :

```bash
# Stripe (recommandé pour commencer)
STRIPE_PUBLISHABLE_KEY=pk_test_votre_cle_publique
STRIPE_SECRET_KEY=sk_test_votre_cle_secrete
STRIPE_WEBHOOK_SECRET=whsec_votre_secret_webhook
STRIPE_ENABLED=true

# PayPal (optionnel)
PAYPAL_CLIENT_ID=votre_client_id
PAYPAL_CLIENT_SECRET=votre_client_secret
PAYPAL_MODE=sandbox
PAYPAL_ENABLED=false
```

### 2. Installation des dépendances

```bash
cd luxury-clicker
npm install stripe paypal-rest-sdk
```

## Intégration avec Stripe

### 1. Créer un compte Stripe

- Allez sur [stripe.com](https://stripe.com)
- Créez un compte et obtenez vos clés d'API
- Configurez votre webhook dans le dashboard Stripe

### 2. Configuration du webhook

Dans votre dashboard Stripe, configurez un webhook pointant vers :
```
http://votre-domaine.com/api/payment/webhook
```

Événements à écouter :
- `checkout.session.completed`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

### 3. Exemple d'intégration Stripe complète

```javascript
// Dans server/routes/payment.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Route pour créer une session de paiement Stripe
router.post('/create-stripe-session', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'EUR' } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Recharge Luxury Clicker - ${amount}${currency}`,
            description: 'Crédit de jeu pour Luxury Clicker'
          },
          unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
      metadata: {
        userId: req.user.id,
        gameAmount: amount
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      redirectUrl: session.url
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## Intégration avec PayPal

### 1. Créer un compte PayPal Developer

- Allez sur [developer.paypal.com](https://developer.paypal.com)
- Créez un compte et obtenez vos clés d'API
- Configurez vos URLs de retour

### 2. Exemple d'intégration PayPal

```javascript
// Dans server/routes/payment.js
import paypal from 'paypal-rest-sdk';

paypal.configure({
  mode: process.env.PAYPAL_MODE, // 'sandbox' ou 'live'
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET
});

// Route pour créer un paiement PayPal
router.post('/create-paypal-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'EUR' } = req.body;
    
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal'
      },
      redirect_urls: {
        return_url: `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
      },
      transactions: [{
        item_list: {
          items: [{
            name: `Recharge Luxury Clicker - ${amount}${currency}`,
            sku: 'recharge',
            price: amount,
            currency: currency,
            quantity: 1
          }]
        },
        amount: {
          currency: currency,
          total: amount
        },
        description: 'Crédit de jeu pour Luxury Clicker'
      }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        res.status(500).json({
          success: false,
          message: error.message
        });
      } else {
        // Trouver le lien d'approbation
        const approvalUrl = payment.links.find(link => link.rel === 'approval_url');
        
        res.json({
          success: true,
          paymentId: payment.id,
          redirectUrl: approvalUrl.href
        });
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
```

## Gestion des webhooks

### 1. Webhook Stripe

```javascript
// Route webhook Stripe
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Mettre à jour le solde de l'utilisateur
    const userId = session.metadata.userId;
    const amount = parseFloat(session.metadata.gameAmount);
    const amountInCentimes = Math.floor(amount * 100);
    
    // Ici, mettez à jour votre base de données
    await updateUserBalance(userId, amountInCentimes);
  }

  res.json({ received: true });
});
```

### 2. Webhook PayPal

```javascript
// Route webhook PayPal
router.post('/webhook/paypal', async (req, res) => {
  try {
    const { paymentId, PayerID } = req.body;
    
    // Vérifier le paiement avec PayPal
    paypal.payment.execute(paymentId, { payer_id: PayerID }, async function (error, payment) {
      if (error) {
        console.error('Erreur PayPal:', error);
        return res.status(500).json({ success: false });
      }
      
      if (payment.state === 'approved') {
        // Mettre à jour le solde de l'utilisateur
        const amount = parseFloat(payment.transactions[0].amount.total);
        const amountInCentimes = Math.floor(amount * 100);
        
        // Ici, mettez à jour votre base de données
        // await updateUserBalance(userId, amountInCentimes);
      }
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
});
```

## Sécurité

### 1. Validation des montants

```javascript
// Toujours valider les montants côté serveur
const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return numAmount >= 1.00 && numAmount <= 1000.00;
};
```

### 2. Authentification

```javascript
// Vérifier le token JWT pour chaque requête de paiement
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Token requis' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};
```

### 3. Protection CSRF

```javascript
// Ajouter une protection CSRF
import csrf from 'csurf';
app.use(csrf({ cookie: true }));

// Inclure le token CSRF dans vos formulaires
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Test

### 1. Mode sandbox

- Utilisez les cartes de test Stripe (ex: 4242 4242 4242 4242)
- Utilisez le mode sandbox PayPal
- Testez tous les scénarios (succès, échec, annulation)

### 2. Logs

```javascript
// Ajouter des logs détaillés
console.log('Paiement initié:', {
  userId: req.user.id,
  amount: req.body.amount,
  timestamp: new Date().toISOString()
});
```

## Déploiement

### 1. Variables de production

```bash
# En production, utilisez des clés live
STRIPE_ENABLED=true
STRIPE_PUBLISHABLE_KEY=pk_live_votre_cle_live
STRIPE_SECRET_KEY=sk_live_votre_cle_live
PAYPAL_MODE=live
```

### 2. HTTPS obligatoire

- Les webhooks et paiements nécessitent HTTPS en production
- Configurez votre certificat SSL
- Mettez à jour les URLs de redirection

### 3. Monitoring

- Surveillez les logs de paiement
- Configurez des alertes pour les échecs
- Testez régulièrement les webhooks

## Support

Pour toute question ou problème :
1. Vérifiez les logs du serveur
2. Testez avec les cartes de test
3. Vérifiez la configuration des webhooks
4. Consultez la documentation de votre prestataire de paiement

## Ressources utiles

- [Documentation Stripe](https://stripe.com/docs)
- [Documentation PayPal](https://developer.paypal.com/docs)
- [Guide des webhooks](https://stripe.com/docs/webhooks)
- [Bonnes pratiques de sécurité](https://stripe.com/docs/security)
