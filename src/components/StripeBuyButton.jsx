import React, { useEffect } from 'react'

function StripeBuyButton() {
  // S'assure que le script Stripe est chargé (au cas où Vite ferait du HMR)
  useEffect(() => {
    // Rien à faire si le script global est déjà inclus dans index.html
  }, [])

  return (
    <div style={{ marginTop: 16 }}>
      <stripe-buy-button
        buy-button-id="buy_btn_1RusnfBJTCuuY1AKgywBDLuP"
        publishable-key="pk_live_51RusN4BJTCuuY1AKpMt6EvTEKoOLMeY72WhSRuHuWy7zEK00WtFJEXUPSKOykPfst6llCiZDWn5CdIOU3YCfthQn00EfZLZfrU"
      />
    </div>
  )
}

export default StripeBuyButton


