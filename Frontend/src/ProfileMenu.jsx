import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Profile.css'
import './ProfileIndicator.css'

function getProfileName(user) {
  return user.username || user.name || user.email?.split('@')[0] || 'User'
}

function ProfileMenu({ user, basePath = '/profile', onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()
  const profileName = getProfileName(user)

  useEffect(() => {
    const closeMenu = (event) => {
      if (!menuRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', closeMenu)
    return () => document.removeEventListener('mousedown', closeMenu)
  }, [])

  return <div className="profile-menu" ref={menuRef}>
    <button className="profile-trigger" type="button" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-haspopup="menu">
      <span className="profile-trigger-name">{profileName}</span>
      <span className="profile-avatar">{profileName.charAt(0).toUpperCase()}</span>
      <span className="profile-chevron" aria-hidden="true" />
    </button>
    {isOpen && <div className="profile-dropdown" role="menu">
      <div className="profile-dropdown-heading"><strong>{profileName}</strong><small>{user.email || 'Signed-in account'}</small></div>
      <button type="button" role="menuitem" onClick={() => { setIsOpen(false); navigate(basePath) }}><span>⚙</span> Profile settings</button>
      <button type="button" role="menuitem" onClick={onLogout}><span>↪</span> Sign out</button>
    </div>}
  </div>
}

export default ProfileMenu
