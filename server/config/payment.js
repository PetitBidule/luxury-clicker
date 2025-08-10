// Configuration pour l'API de paiement
// Remplacez ces valeurs par vos vraies clés d'API

export const paymentConfig = {
  // Configuration Stripe (exemple)
  stripe: {
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_your_stripe_key_here',
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_stripe_secret_here',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here',
    enabled: process.env.STRIPE_ENABLED === 'true' || false
  },

  // Configuration PayPal (exemple)
  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID || 'your_paypal_client_id',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || 'your_paypal_client_secret',
    mode: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' ou 'live'
    enabled: process.env.PAYPAL_ENABLED === 'true' || false
  },

  // Configuration générale
  general: {
    currency: 'EUR',
    supportedCurrencies: ['EUR', 'USD'],
    minAmount: 1.00, // Montant minimum en euros
    maxAmount: 1000.00, // Montant maximum en euros
    conversionRate: 100 // 1 euro = 100 centimes de jeu
  },

  // URLs de redirection
  redirectUrls: {
    success: process.env.PAYMENT_SUCCESS_URL || 'http://localhost:5173/payment/success',
    cancel: process.env.PAYMENT_CANCEL_URL || 'http://localhost:5173/payment/cancel',
    webhook: process.env.PAYMENT_WEBHOOK_URL || 'http://localhost:5000/api/payment/webhook'
  }
};

// Fonction pour obtenir la configuration active
export const getActivePaymentProvider = () => {
  if (paymentConfig.stripe.enabled) {
    return 'stripe';
  } else if (paymentConfig.paypal.enabled) {
    return 'paypal';
  }
  return 'none';
};

// Fonction pour valider un montant
export const validateAmount = (amount) => {
  const numAmount = parseFloat(amount);
  return numAmount >= paymentConfig.general.minAmount && 
         numAmount <= paymentConfig.general.maxAmount;
};

// Fonction pour convertir les euros en centimes de jeu
export const convertToGameCurrency = (euros) => {
  return Math.floor(euros * paymentConfig.general.conversionRate);
};

// Fonction pour convertir les centimes de jeu en euros
export const convertFromGameCurrency = (centimes) => {
  return centimes / paymentConfig.general.conversionRate;
};
