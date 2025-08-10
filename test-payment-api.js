// Script de test pour l'API de paiement
// Exécutez ce script pour tester vos endpoints de paiement

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Fonction pour se connecter et obtenir un token
async function login() {
  try {
    console.log('🔐 Connexion...');
    
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: 'testuser',
        password: 'testpass123'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      authToken = data.token;
      console.log('✅ Connexion réussie');
      return true;
    } else {
      console.log('❌ Échec de la connexion:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return false;
  }
}

// Fonction pour tester l'endpoint de santé
async function testHealth() {
  try {
    console.log('\n🏥 Test de santé de l\'API...');
    
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API en bonne santé');
      return true;
    } else {
      console.log('❌ API en mauvaise santé');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de santé:', error.message);
    return false;
  }
}

// Fonction pour tester l'initiation d'un paiement
async function testPaymentInitiation() {
  try {
    console.log('\n💳 Test d\'initiation de paiement...');
    
    if (!authToken) {
      console.log('❌ Token d\'authentification manquant');
      return false;
    }

    const response = await fetch(`${BASE_URL}/payment/initiate-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        amount: 25.00,
        currency: 'EUR'
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paiement initié avec succès');
      console.log('   Session ID:', data.paymentSession.id);
      console.log('   URL de redirection:', data.paymentSession.redirectUrl);
      return true;
    } else {
      console.log('❌ Échec de l\'initiation:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur d\'initiation:', error.message);
    return false;
  }
}

// Fonction pour tester l'historique des paiements
async function testPaymentHistory() {
  try {
    console.log('\n📋 Test de l\'historique des paiements...');
    
    if (!authToken) {
      console.log('❌ Token d\'authentification manquant');
      return false;
    }

    const response = await fetch(`${BASE_URL}/payment/payment-history`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Historique récupéré avec succès');
      console.log('   Nombre de paiements:', data.payments.length);
      data.payments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.amount}${payment.currency} - ${payment.status} (${payment.date})`);
      });
      return true;
    } else {
      console.log('❌ Échec de la récupération:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur d\'historique:', error.message);
    return false;
  }
}

// Fonction pour tester la confirmation d'un paiement
async function testPaymentConfirmation() {
  try {
    console.log('\n✅ Test de confirmation de paiement...');
    
    if (!authToken) {
      console.log('❌ Token d\'authentification manquant');
      return false;
    }

    const response = await fetch(`${BASE_URL}/payment/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        paymentSessionId: 'test_session_123',
        transactionId: 'test_transaction_456',
        status: 'completed',
        amount: 25.00
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Paiement confirmé avec succès');
      console.log('   Montant ajouté:', data.amountAdded, 'centimes');
      return true;
    } else {
      console.log('❌ Échec de la confirmation:', data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de confirmation:', error.message);
    return false;
  }
}

// Fonction principale de test
async function runTests() {
  console.log('🚀 Démarrage des tests de l\'API de paiement...\n');
  
  let testsPassed = 0;
  let totalTests = 5;

  // Test 1: Santé de l'API
  if (await testHealth()) testsPassed++;
  
  // Test 2: Connexion
  if (await login()) testsPassed++;
  
  // Test 3: Initiation de paiement
  if (await testPaymentInitiation()) testsPassed++;
  
  // Test 4: Historique des paiements
  if (await testPaymentHistory()) testsPassed++;
  
  // Test 5: Confirmation de paiement
  if (await testPaymentConfirmation()) testsPassed++;

  // Résumé des tests
  console.log('\n📊 Résumé des tests:');
  console.log(`   Tests réussis: ${testsPassed}/${totalTests}`);
  
  if (testsPassed === totalTests) {
    console.log('🎉 Tous les tests sont passés avec succès !');
    console.log('   Votre API de paiement est prête à être utilisée.');
  } else {
    console.log('⚠️  Certains tests ont échoué.');
    console.log('   Vérifiez la configuration et les logs du serveur.');
  }

  console.log('\n💡 Prochaines étapes:');
  console.log('   1. Configurez vos vraies clés d\'API dans .env');
  console.log('   2. Testez avec de vraies cartes de test');
  console.log('   3. Configurez vos webhooks');
  console.log('   4. Déployez en production');
}

// Exécuter les tests si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
