import { useState } from 'react'
import './Login.css'

function Login({ apiUrl, onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const submitLogin = async (event) => {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      const responseBody = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(responseBody.message || 'Unable to sign in')
      }

      const data = responseBody.data ?? responseBody
      const user = data.user ?? data
      const token = data.token ?? responseBody.token
      localStorage.setItem('sabi_user', JSON.stringify(user))
      if (token) localStorage.setItem('sabi_token', token)
      onLogin(user)
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Check your details and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-brand-panel">
        <div className="login-brand-lockup"><div className="brand-mark">S</div><div><strong>SABI</strong><span>MICROFINANCE BANK</span></div></div>
        <div className="login-panel-copy"><p className="eyebrow">OPERATIONS PORTAL</p><h1>Keep every payment request moving.</h1><p>Prepare vouchers, route approvals, and keep your finance activity in one place.</p></div>
        <div className="login-panel-footer"><span className="live-dot" /> Secure workspace access</div>
      </section>
      <section className="login-form-panel">
        <div className="login-form-wrap">
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to SABI</h2>
          <p className="login-subheading">Use the account created for you by your administrator.</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <form onSubmit={submitLogin}>
            <label>Email address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></label>
            <label>Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /><button type="button" onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
            <button className="login-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Sign in'}<span>→</span></button>
          </form>
          <p className="login-help">Need access? Contact your administrator.</p>
        </div>
      </section>
    </main>
  )
}

export default Login