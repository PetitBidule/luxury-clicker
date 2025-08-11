import express from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { pool } from '../config/database.js'

dotenv.config()

const router = express.Router()

// Middleware d'auth
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token requis' })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    req.user = decoded
    next()
  } catch (error) {
    return res.status(403).json({ success: false, message: 'Token invalide' })
  }
}

// Stripe SDK
let stripe = null
if (process.env.STRIPE_SECRET_KEY) {
  // Chargement dynamique pour éviter erreur si clé absente en dev
  const Stripe = (await import('stripe')).default
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
}

// Récupérer le solde du portefeuille en centimes
router.get('/wallet', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT wallet_cents FROM users WHERE id = ?', [req.user.userId])
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' })
    }
    res.json({ success: true, walletCents: Number(rows[0].wallet_cents || 0) })
  } catch (e) {
    console.error('Erreur /wallet:', e)
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
  }
})

// Débiter 1 centime pour un clic
router.post('/wallet/debit-click', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      const [rows] = await connection.execute('SELECT wallet_cents FROM users WHERE id = ? FOR UPDATE', [req.user.userId])
      if (rows.length === 0) {
        await connection.rollback()
        connection.release()
        return res.status(404).json({ success: false, message: 'Utilisateur introuvable' })
      }
      const current = Number(rows[0].wallet_cents || 0)
      if (current < 1) {
        await connection.rollback()
        connection.release()
        return res.status(402).json({ success: false, message: 'Solde insuffisant' })
      }
      await connection.execute('UPDATE users SET wallet_cents = wallet_cents - 1 WHERE id = ?', [req.user.userId])
      await connection.commit()
      connection.release()
      res.json({ success: true })
    } catch (txErr) {
      await connection.rollback()
      connection.release()
      throw txErr
    }
  } catch (e) {
    console.error('Erreur /wallet/debit-click:', e)
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
  }
})

// Créer une session de recharge Stripe Checkout
router.post('/wallet/topup/session', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ success: false, message: 'Stripe non configuré' })
    }
    const { amountCents } = req.body
    const amount = Number(amountCents)
    if (!amount || amount < 50) { // min 0,50 € pour Stripe Checkout
      return res.status(400).json({ success: false, message: 'Montant minimum 50 centimes' })
    }

    // Créer un produit/price dynamique via mode payment
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: { name: 'Recharge portefeuille Luxury Clicker' },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?topup=success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/?topup=cancel`,
      metadata: {
        userId: String(req.user.userId),
        amountCents: String(amount),
      },
    })

    // Log en DB
    await pool.execute(
      'INSERT INTO payments (user_id, session_id, amount_cents, status) VALUES (?, ?, ?, ?)',
      [req.user.userId, session.id, amount, 'created']
    )

    res.json({ success: true, url: session.url })
  } catch (e) {
    console.error('Erreur topup/session:', e)
    res.status(500).json({ success: false, message: 'Erreur interne du serveur' })
  }
})

// Webhook Stripe pour créditer le portefeuille quand la session est payée
export async function stripeWebhookHandler(req, res) {
  try {
    if (!stripe) return res.sendStatus(200)
    const sig = req.headers['stripe-signature']
    let event
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message)
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const sessionId = session.id
      const amount = Number(session.metadata?.amountCents || 0)
      const userId = Number(session.metadata?.userId || 0)
      if (session.payment_status === 'paid' && amount > 0 && userId > 0) {
        const connection = await pool.getConnection()
        try {
          await connection.beginTransaction()
          const [rows] = await connection.execute('SELECT credited FROM payments WHERE session_id = ? FOR UPDATE', [sessionId])
          if (rows.length === 0) {
            await connection.rollback()
            connection.release()
          } else if (Number(rows[0].credited) === 0) {
            await connection.execute('UPDATE payments SET status = ?, credited = 1 WHERE session_id = ?', ['paid', sessionId])
            await connection.execute('UPDATE users SET wallet_cents = wallet_cents + ? WHERE id = ?', [amount, userId])
            await connection.commit()
            connection.release()
          } else {
            await connection.rollback()
            connection.release()
          }
        } catch (txErr) {
          await connection.rollback()
          connection.release()
          throw txErr
        }
      }
    }

    res.sendStatus(200)
  } catch (e) {
    console.error('Erreur webhook:', e)
    res.sendStatus(500)
  }
}

// Route dans le router (ne sera pas utilisée si on monte la route dédiée avant express.json)
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler)

export default router


