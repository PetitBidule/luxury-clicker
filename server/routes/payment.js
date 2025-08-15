import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { getUserById, updateUserCredits, getUserCredits } from '../config/database.js';

const router = express.Router();

// Charger les variables d'environnement AVANT d'utiliser process.env
dotenv.config();

// Vérifier la présence de la clé Stripe pour éviter l'initialisation sans authentificateur
const stripeSecretKey = "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";
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY manquante. Ajoutez-la dans votre fichier .env');
}

const stripe = new Stripe(stripeSecretKey);

// Endpoint pour récupérer les crédits de l'utilisateur
router.get('/credits', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await getUserCredits(userId);
    
    res.json({
      success: true,
      credits: credits || 0
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des crédits:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des crédits'
    });
  }
});

// Endpoint pour dépenser des crédits (1 centime par clic)
router.post('/spend-credit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentCredits = await getUserCredits(userId);
    
    // Vérifier si l'utilisateur a assez de crédits (1 centime = 0.01 euro)
    if (currentCredits < 0.01) {
      return res.status(400).json({
        success: false,
        message: 'Crédits insuffisants'
      });
    }
    
    // Déduire 1 centime
    const newCredits = currentCredits - 0.01;
    await updateUserCredits(userId, newCredits);
    
    res.json({
      success: true,
      remainingCredits: newCredits,
      message: 'Crédit dépensé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la dépense de crédit:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la dépense de crédit'
    });
  }
});

// Webhook Stripe pour traiter les paiements réussis
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Erreur de signature webhook:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Traiter l'événement
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Récupérer les métadonnées du client (userId devrait être passé lors de la création de la session)
      const userId = session.metadata?.userId;
      
      if (userId) {
        // Montant payé en centimes, convertir en euros
        const amountPaid = session.amount_total / 100;
        
        // Ajouter les crédits à l'utilisateur
        const currentCredits = await getUserCredits(userId);
        const newCredits = (currentCredits || 0) + amountPaid;
        
        await updateUserCredits(userId, newCredits);
        
        console.log(`Crédits ajoutés: ${amountPaid}€ pour l'utilisateur ${userId}`);
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paiement:', error);
    }
  }

  res.json({ received: true });
});

// Endpoint pour créer une session de paiement personnalisée (optionnel)
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body; // Montant en euros
    const userId = req.user.id;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Crédits Luxury Clicker',
              description: `${amount}€ de crédits pour le jeu`,
            },
            unit_amount: amount * 100, // Stripe utilise les centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: userId.toString()
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Erreur lors de la création de la session:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la session de paiement'
    });
  }
});

export default router;
