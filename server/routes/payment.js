import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware pour vérifier l'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token d\'authentification requis' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Token invalide ou expiré' 
      });
    }
    req.user = user;
    next();
  });
};

// Route pour initier un paiement
router.post('/initiate-payment', authenticateToken, async (req, res) => {
  try {
    const { amount, currency = 'EUR' } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Montant invalide'
      });
    }

    // Ici, vous intégreriez votre vraie API de paiement (Stripe, PayPal, etc.)
    // Pour l'exemple, nous simulons la création d'une session de paiement
    
    const paymentSession = {
      id: `pay_${Date.now()}_${userId}`,
      amount: amount,
      currency: currency,
      status: 'pending',
      userId: userId,
      createdAt: new Date().toISOString(),
      redirectUrl: `https://api.payment-provider.com/checkout?session=${Date.now()}&amount=${amount}&currency=${currency}`
    };

    // Enregistrer la session de paiement (vous devriez l'enregistrer en base de données)
    console.log('Session de paiement créée:', paymentSession);

    res.json({
      success: true,
      paymentSession: paymentSession,
      redirectUrl: paymentSession.redirectUrl
    });

  } catch (error) {
    console.error('Erreur lors de l\'initiation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initiation du paiement'
    });
  }
});

// Route pour confirmer un paiement (webhook ou callback)
router.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    const { paymentSessionId, transactionId, status } = req.body;
    const userId = req.user.id;

    if (!paymentSessionId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Informations de paiement manquantes'
      });
    }

    if (status === 'completed') {
      // Ici, vous devriez vérifier le paiement avec votre API de paiement
      // et mettre à jour le solde de l'utilisateur
      
      // Simuler la mise à jour du solde
      const amountInCentimes = Math.floor(parseFloat(req.body.amount) * 100);
      
      // Vous devriez mettre à jour la base de données ici
      console.log(`Paiement confirmé: ${amountInCentimes} centimes pour l'utilisateur ${userId}`);

      res.json({
        success: true,
        message: 'Paiement confirmé avec succès',
        amountAdded: amountInCentimes,
        newBalance: 0 // À remplacer par le vrai solde depuis la base de données
      });
    } else {
      res.json({
        success: false,
        message: 'Paiement échoué ou annulé'
      });
    }

  } catch (error) {
    console.error('Erreur lors de la confirmation du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la confirmation du paiement'
    });
  }
});

// Route pour obtenir l'historique des paiements
router.get('/payment-history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Ici, vous récupéreriez l'historique depuis votre base de données
    // Pour l'exemple, nous retournons des données simulées
    
    const paymentHistory = [
      {
        id: 'pay_1',
        amount: 50.00,
        currency: 'EUR',
        status: 'completed',
        date: new Date(Date.now() - 86400000).toISOString() // Hier
      },
      {
        id: 'pay_2',
        amount: 25.00,
        currency: 'EUR',
        status: 'completed',
        date: new Date(Date.now() - 172800000).toISOString() // Avant-hier
      }
    ];

    res.json({
      success: true,
      payments: paymentHistory
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

export default router;
