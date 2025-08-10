import express from 'express';
import { paymentConfig } from '../config/payment.js';

const router = express.Router();

// Middleware pour parser le body brut pour Stripe
const rawBodyMiddleware = express.raw({ type: 'application/json' });

// Webhook Stripe
router.post('/stripe', rawBodyMiddleware, async (req, res) => {
  try {
    console.log('📥 Webhook Stripe reçu');
    
    // Ici, vous devriez vérifier la signature Stripe
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    // Pour l'exemple, on simule un événement
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_' + Date.now(),
          metadata: {
            userId: 'test_user',
            gameAmount: '25.00'
          },
          amount_total: 2500, // en centimes
          currency: 'eur'
        }
      }
    };
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata.userId;
      const amount = parseFloat(session.metadata.gameAmount);
      const amountInCentimes = Math.floor(amount * 100);
      
      console.log(`💰 Paiement Stripe confirmé: ${amountInCentimes} centimes pour l'utilisateur ${userId}`);
      
      // Ici, vous devriez mettre à jour la base de données
      // await updateUserBalance(userId, amountInCentimes);
      
      // Envoyer une notification à l'utilisateur si nécessaire
      // await notifyUser(userId, 'Paiement confirmé', `Votre compte a été rechargé de ${amount}€`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erreur webhook Stripe:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

// Webhook PayPal
router.post('/paypal', async (req, res) => {
  try {
    console.log('📥 Webhook PayPal reçu');
    
    const { paymentId, PayerID, status } = req.body;
    
    if (status === 'completed') {
      console.log(`💰 Paiement PayPal confirmé: ${paymentId} par ${PayerID}`);
      
      // Ici, vous devriez vérifier le paiement avec PayPal
      // et mettre à jour la base de données
      
      // Exemple de mise à jour
      // const amount = parseFloat(req.body.amount);
      // const amountInCentimes = Math.floor(amount * 100);
      // await updateUserBalance(userId, amountInCentimes);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Erreur webhook PayPal:', error);
    res.status(500).json({ success: false });
  }
});

// Webhook générique pour les tests
router.post('/test', async (req, res) => {
  try {
    console.log('🧪 Webhook de test reçu:', req.body);
    
    const { userId, amount, status } = req.body;
    
    if (status === 'completed' && userId && amount) {
      const amountInCentimes = Math.floor(parseFloat(amount) * 100);
      console.log(`💰 Paiement de test confirmé: ${amountInCentimes} centimes pour l'utilisateur ${userId}`);
      
      // Simuler la mise à jour du solde
      // await updateUserBalance(userId, amountInCentimes);
    }
    
    res.json({ 
      received: true, 
      message: 'Webhook de test traité avec succès',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur webhook de test:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Route pour tester les webhooks
router.get('/test', (req, res) => {
  res.json({
    message: 'Endpoint de test des webhooks',
    availableWebhooks: [
      'POST /webhooks/stripe - Webhook Stripe',
      'POST /webhooks/paypal - Webhook PayPal',
      'POST /webhooks/test - Webhook de test'
    ],
    instructions: [
      '1. Configurez vos webhooks dans votre dashboard de paiement',
      '2. Pointez vers: http://votre-domaine.com/api/webhooks/[provider]',
      '3. Testez avec: curl -X POST http://localhost:5000/api/webhooks/test',
      '4. Vérifiez les logs du serveur pour le débogage'
    ]
  });
});

export default router;
