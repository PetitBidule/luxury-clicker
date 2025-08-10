import React, { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

const AuthContainer = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)

  const handleLogin = (user, token) => {
    onAuthSuccess(user, token)
  }

  const handleRegister = (user, token) => {
    onAuthSuccess(user, token)
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <h1 className="auth-title">
            <span className="luxury">Luxury</span>
            <span className="clicker">Clicker</span>
          </h1>
          <p className="auth-subtitle">Connectez-vous pour sauvegarder votre progression</p>
        </div>

        <div className="auth-forms">
          {isLogin ? (
            <LoginForm 
              onLogin={handleLogin}
              onSwitchToRegister={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm 
              onRegister={handleRegister}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthContainer 