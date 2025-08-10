#!/usr/bin/env node

// Script d'installation des dépendances de paiement
// Exécutez ce script pour installer automatiquement les packages nécessaires

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Installation des dépendances de paiement pour Luxury Clicker...\n');

// Liste des dépendances à installer
const paymentDependencies = [
  'stripe',
  'paypal-rest-sdk',
  'node-fetch'
];

const devDependencies = [
  'nodemon'
];

try {
  // Vérifier si package.json existe
  const packagePath = join(__dirname, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  
  console.log('📦 Vérification des dépendances existantes...');
  
  // Vérifier les dépendances manquantes
  const missingDeps = paymentDependencies.filter(dep => !packageJson.dependencies[dep]);
  const missingDevDeps = devDependencies.filter(dep => !packageJson.devDependencies[dep]);
  
  if (missingDeps.length === 0 && missingDevDeps.length === 0) {
    console.log('✅ Toutes les dépendances de paiement sont déjà installées !');
    return;
  }
  
  // Installer les dépendances manquantes
  if (missingDeps.length > 0) {
    console.log(`📥 Installation des dépendances: ${missingDeps.join(', ')}`);
    execSync(`npm install ${missingDeps.join(' ')}`, { stdio: 'inherit' });
  }
  
  if (missingDevDeps.length > 0) {
    console.log(`📥 Installation des dépendances de développement: ${missingDevDeps.join(', ')}`);
    execSync(`npm install --save-dev ${missingDevDeps.join(' ')}`, { stdio: 'inherit' });
  }
  
  console.log('\n✅ Installation terminée avec succès !');
  
  // Mettre à jour package.json avec les scripts de paiement
  console.log('\n🔧 Mise à jour des scripts...');
  
  if (!packageJson.scripts['dev:payment']) {
    packageJson.scripts['dev:payment'] = 'concurrently "npm run server" "npm run dev"';
  }
  
  if (!packageJson.scripts['test:payment']) {
    packageJson.scripts['test:payment'] = 'node test-payment-api.js';
  }
  
  writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Scripts mis à jour !');
  
  // Créer le fichier .env s'il n'existe pas
  const envPath = join(__dirname, 'server', '.env');
  const envExamplePath = join(__dirname, 'server', 'env.payment.example');
  
  try {
    readFileSync(envPath, 'utf8');
    console.log('✅ Fichier .env existe déjà');
  } catch (error) {
    console.log('📝 Création du fichier .env...');
    
    try {
      const envExample = readFileSync(envExamplePath, 'utf8');
      writeFileSync(envPath, envExample);
      console.log('✅ Fichier .env créé à partir de env.payment.example');
      console.log('⚠️  N\'oubliez pas de configurer vos vraies clés d\'API !');
    } catch (error) {
      console.log('⚠️  Impossible de créer .env automatiquement');
      console.log('   Copiez manuellement server/env.payment.example vers server/.env');
    }
  }
  
  console.log('\n🎉 Configuration terminée !');
  console.log('\n📋 Prochaines étapes:');
  console.log('   1. Configurez vos clés d\'API dans server/.env');
  console.log('   2. Lancez le serveur: npm run dev:payment');
  console.log('   3. Testez l\'API: npm run test:payment');
  console.log('   4. Intégrez avec votre prestataire de paiement');
  
} catch (error) {
  console.error('❌ Erreur lors de l\'installation:', error.message);
  process.exit(1);
}
