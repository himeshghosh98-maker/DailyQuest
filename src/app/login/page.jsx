'use client'

import LoginScreen from '../../components/LoginScreen'
import useAuth from '../../hooks/useAuth'

export default function LoginPage() {
  const { login, guestLogin } = useAuth()

  return <LoginScreen onLogin={login} onGuest={guestLogin} />
}
