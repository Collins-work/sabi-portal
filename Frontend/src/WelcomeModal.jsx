import './Welcome.css'

function getProfileName(user) {
  return user.username || user.name || user.email?.split('@')[0] || 'there'
}

function WelcomeModal({ user, onClose }) {
  const profileName = getProfileName(user)

  return <div className="welcome-backdrop" role="presentation">
    <section className="welcome-modal" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <button className="welcome-close" type="button" onClick={onClose} aria-label="Close welcome message">×</button>
      <div className="welcome-mark">S</div>
      <p className="welcome-eyebrow">SABI MICROFINANCE BANK</p>
      <h1 id="welcome-title">Welcome back, {profileName}.</h1>
      <p className="welcome-copy">The bank wey sabi keep work moving. Your operations workspace is ready for you.</p>
      <div className="welcome-highlights"><div><span>✦</span><strong>Work with clarity</strong><small>Prepare and track your payment vouchers.</small></div><div><span>↗</span><strong>Keep things moving</strong><small>Send requests through the right approval flow.</small></div></div>
      <button className="welcome-continue" type="button" onClick={onClose}>Enter workspace <span>→</span></button>
    </section>
  </div>
}

export default WelcomeModal
