import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import dotenv from 'dotenv';
import { authenticateToken } from '../middleware/auth.js';
import { getUserCredits, updateUserCredits } from '../config/database.js';

dotenv.config({ path: "./server/.env"});


console.log("Clé Stripe :", process.env.STRIPE_SECRET_KEY);




if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY manquant dans .env");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20', // toujours préciser la version
});

const router = express.Router();

// Charger les variables d'environnement AVANT d'utiliser process.env
dotenv.config();

// Vérifier la présence de la clé Stripe pour éviter l'initialisation sans authentificateur
const stripeSecretKey = "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";
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY manquante. Ajoutez-la dans votre fichier .env');
}

const stripe = new Stripe(stripeSecretKey);

/* ============================
   Récupération des crédits
   ============================ */
router.get('/credits', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const credits = await getUserCredits(userId);

    res.json({ success: true, credits: credits || 0 });
  } catch (error) {
    console.error('❌ Erreur récupération crédits:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/* ============================
   Dépense de crédits
   ============================ */
router.post('/spend-credit', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentCredits = await getUserCredits(userId);

    if (currentCredits < 0.01) {
      return res.status(400).json({ success: false, message: 'Crédits insuffisants' });
    }

    const newCredits = currentCredits - 0.01;
    await updateUserCredits(userId, newCredits);

    res.json({ success: true, remainingCredits: newCredits });
  } catch (error) {
    console.error('❌ Erreur dépense crédit:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/* ============================
   Création d'une session de paiement Stripe
   ============================ */
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    let { amount } = req.body;

    // Validation basique
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Montant invalide' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Crédits Luxury Clicker',
              description: `${amount}€ de crédits`,
            },
            unit_amount: Math.round(amount * 100), // en centimes
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.user.id.toString(),
      },
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('❌ Erreur création session Stripe:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

/* ============================
   Webhook Stripe
   ============================ */
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Erreur signature webhook:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        const userId = session.metadata?.userId;
        const amountPaid = session.amount_total / 100;

        if (userId && amountPaid > 0) {
          const currentCredits = await getUserCredits(userId);
          const newCredits = (currentCredits || 0) + amountPaid;
          await updateUserCredits(userId, newCredits);

          console.log(`✅ ${amountPaid}€ ajoutés au joueur ${userId}`);
        }
      } catch (error) {
        console.error('❌ Erreur traitement paiement:', error);
      }
    }

    res.json({ received: true });
  }
);

export default router;
