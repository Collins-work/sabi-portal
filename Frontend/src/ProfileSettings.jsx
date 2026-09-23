import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'

function getProfileName(user) {
  return user.username || user.name || user.email?.split('@')[0] || 'User'
}

function authHeaders() {
  const token = localStorage.getItem('sabi_token')
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function ProfileSettings({ apiUrl, user, backPath = '/', onLogout }) {
  const navigate = useNavigate()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const profileName = getProfileName(user)

  const updatePassword = async (event) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'New passwords do not match.' })
      return
    }
    setIsSaving(true)
    setNotice(null)
    try {
      const response = await fetch(`${apiUrl}/auth/password`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.message || 'Unable to update password')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNotice({ type: 'success', text: 'Password updated successfully.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  return <div className="profile-settings-shell">
    <header className="profile-settings-topbar"><button className="profile-back" onClick={() => navigate(backPath)}>← Back</button><strong>Profile settings</strong><button className="profile-settings-signout" onClick={onLogout}>Sign out</button></header>
    <main className="profile-settings-main"><div className="profile-settings-intro"><p className="profile-eyebrow">ACCOUNT</p><h1>{profileName}</h1><p>Manage your account access and security preferences.</p></div><div className="profile-settings-grid"><section className="profile-card"><div className="profile-card-icon">◉</div><p className="profile-eyebrow">YOUR DETAILS</p><h2>Account information</h2><div className="account-detail"><span>Username</span><strong>{user.username || 'Not provided'}</strong></div><div className="account-detail"><span>Email address</span><strong>{user.email || 'Not provided'}</strong></div><div className="account-detail"><span>Role</span><strong>{user.role || 'Staff'}</strong></div><div className="account-detail"><span>Department</span><strong>{user.department?.name || user.departmentName || 'Not provided'}</strong></div></section><section className="profile-card"><div className="profile-card-icon security">⌑</div><p className="profile-eyebrow">SECURITY</p><h2>Change password</h2><p className="profile-card-copy">Use a strong password you do not use on another account.</p>{notice && <div className={`profile-notice ${notice.type}`} role="status">{notice.text}</div>}<form className="password-form" onSubmit={updatePassword}><label>Current password<input required type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label><label>New password<input required minLength="8" type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label><label>Confirm new password<input required minLength="8" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></label><button className="profile-save" disabled={isSaving}>{isSaving ? 'Updating...' : 'Update password'}<span>→</span></button></form></section></div></main>
  </div>
}

export default ProfileSettings
