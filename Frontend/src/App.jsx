import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './PortalClean.css'
import './PendingApprovalNav.css'
import './VoucherNumber.css'
import Login from './Login.jsx'
import AdminPage from './AdminPage.jsx'
import ApprovalPage from './ApprovalPage.jsx'
import ProfileMenu from './ProfileMenu.jsx'
import ProfileSettings from './ProfileSettings.jsx'
import WelcomeModal from './WelcomeModal.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const blankLine = () => ({ name: '', quantity: 1, amount: '' })
const initialForm = { payee: '', department: '', pvNO: '', amountInWords: '', particulars: [blankLine()] }

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value || 0)
}

async function readApiData(response) {
  const body = await response.json()
  return body.data ?? body
}

async function getNextPvNumber() {
  const response = await fetch(`${API_URL}/payment-vouchers/next-number`, { headers: apiHeaders() })
  if (!response.ok) throw new Error('Unable to generate payment voucher number')
  const data = await readApiData(response)
  return data.pvNO || data.number || data
}

function isAdmin(user) {
  const role = user.role || user.userType || user.accountType || user.accessLevel
  return String(role || '').toLowerCase() === 'admin'
}

function canApprove(user) {
  return ['HOD', 'ICU', 'CFO', 'MD'].includes(String(user.role || '').toUpperCase())
}

function apiHeaders() {
  const token = localStorage.getItem('sabi_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function getReferenceId(value) {
  if (!value) return ''
  if (typeof value === 'object') return String(value._id || value.id || '')
  return String(value)
}

function wasCreatedBy(voucher, user) {
  const currentUserId = getReferenceId(user._id || user.id || user.email)
  const creatorId = getReferenceId(voucher.createdBy)
  return Boolean(currentUserId && creatorId && currentUserId === creatorId)
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sabi_user')) } catch { return null }
  })
  const [form, setForm] = useState(initialForm)
  const [isLoadingPvNumber, setIsLoadingPvNumber] = useState(true)
  const [departments, setDepartments] = useState([])
  const [recentVouchers, setRecentVouchers] = useState([])
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0)
  const [showWelcome, setShowWelcome] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [query, setQuery] = useState('')
  const totalAmount = useMemo(() => form.particulars.reduce((sum, item) => sum + (Number(item.amount) || 0) * (Number(item.quantity) || 0), 0), [form.particulars])

  useEffect(() => {
    if (!user) return
    const loadPortalData = async () => {
      try {
        const requests = [
          fetch(`${API_URL}/departments`, { headers: apiHeaders() }),
          fetch(`${API_URL}/payment-vouchers`, { headers: apiHeaders() }),
          fetch(`${API_URL}/payment-vouchers/next-number`, { headers: apiHeaders() }),
        ]
        if (canApprove(user)) requests.push(fetch(`${API_URL}/approvals/pending`, { headers: apiHeaders() }))
        const [departmentResponse, voucherResponse, pvNumberResponse, approvalResponse] = await Promise.all(requests)
        if (departmentResponse.ok) setDepartments(await readApiData(departmentResponse))
        if (voucherResponse.ok) setRecentVouchers(await readApiData(voucherResponse))
        if (pvNumberResponse.ok) {
          const nextNumber = await readApiData(pvNumberResponse)
          const pvNO = nextNumber.pvNO || nextNumber.number || nextNumber
          setForm((current) => ({ ...current, pvNO }))
        }
        if (approvalResponse?.ok) {
          const pendingApprovals = await readApiData(approvalResponse)
          setPendingApprovalCount(Array.isArray(pendingApprovals) ? pendingApprovals.length : 0)
        }
      } catch {
        setNotice({ type: 'info', text: 'Backend routes are not connected yet. You can still prepare a voucher.' })
      } finally {
        setIsLoading(false)
        setIsLoadingPvNumber(false)
      }
    }
    loadPortalData()
  }, [user])

  if (!user) return <Login apiUrl={API_URL} onLogin={(loggedInUser) => {
    setUser(loggedInUser)
    const role = loggedInUser.role || loggedInUser.userType || loggedInUser.accountType || loggedInUser.accessLevel
    const admin = String(role || '').toLowerCase() === 'admin'
    setShowWelcome(!admin)
    navigate(admin ? '/admin' : '/')
  }} />
  if (isAdmin(user)) {
    const handleLogout = () => {
      localStorage.removeItem('sabi_user')
      localStorage.removeItem('sabi_token')
      setUser(null)
    }
    return <Routes><Route path="/admin/*" element={<AdminPage apiUrl={API_URL} user={user} onLogout={handleLogout} />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes>
  }

  const handleLogout = () => {
    localStorage.removeItem('sabi_user')
    localStorage.removeItem('sabi_token')
    setUser(null)
  }
  const filteredVouchers = recentVouchers.filter((voucher) => wasCreatedBy(voucher, user) && `${voucher.pvNO || ''} ${voucher.payee || ''}`.toLowerCase().includes(query.toLowerCase()))
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const updateLine = (index, field, value) => setForm((current) => ({ ...current, particulars: current.particulars.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
  const addLine = () => setForm((current) => ({ ...current, particulars: [...current.particulars, blankLine()] }))
  const removeLine = (index) => { if (form.particulars.length > 1) setForm((current) => ({ ...current, particulars: current.particulars.filter((_, itemIndex) => itemIndex !== index) })) }
  const resetForm = () => { setForm(initialForm); setNotice(null) }

  if (location.pathname === '/approvals') {
    if (!canApprove(user)) return <Navigate to="/" replace />
    return <ApprovalPage apiUrl={API_URL} user={user} onLogout={handleLogout} />
  }
  if (location.pathname === '/profile') return <ProfileSettings apiUrl={API_URL} user={user} onLogout={handleLogout} />

  const submitVoucher = async (event) => {
    event.preventDefault(); setIsSaving(true); setNotice(null)
    const payload = { ...form, createdBy: user._id || user.id || user.email, totalAmount, particulars: form.particulars.map((item) => ({ name: item.name.trim(), quantity: Number(item.quantity), amount: Number(item.amount) })), status: 'Draft' }
    try {
      const response = await fetch(`${API_URL}/payment-vouchers`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...apiHeaders() }, body: JSON.stringify(payload) })
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}))
        throw new Error(responseBody.message || 'Unable to save voucher')
      }
      const savedVoucher = await readApiData(response)
      setRecentVouchers((current) => [savedVoucher, ...current])
      setNotice({ type: 'success', text: 'Payment voucher saved as a draft.' })
      let nextPvNO = ''
      try { nextPvNO = await getNextPvNumber() } catch {}
      setForm({ ...initialForm, pvNO: nextPvNO })
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Could not save voucher.' })
    } finally { setIsSaving(false) }
  }

  return (
    <div className="portal-shell">
      {showWelcome && <WelcomeModal user={user} onClose={() => setShowWelcome(false)} />}
      <header className="topbar"><div className="brand-lockup"><div className="brand-mark">S</div><div><strong>SABI</strong><span>MICROFINANCE BANK</span></div></div><div className="topbar-actions"><span className="live-dot" /><ProfileMenu user={user} onLogout={handleLogout} /></div></header>
      <div className="portal-body">
        <aside className="sidebar"><div className="sidebar-label">WORKSPACE</div><button className="nav-item active"><span>▣</span> Payment vouchers</button><button className="nav-item"><span>◫</span> Documents <em>soon</em></button>{canApprove(user) && <button className="nav-item" onClick={() => navigate('/approvals')}><span>◌</span> Approvals {pendingApprovalCount > 0 && <b className="nav-count" aria-label={`${pendingApprovalCount} pending approvals`}>{pendingApprovalCount}</b>}</button>}<div className="sidebar-footer"><span className="help-icon">?</span><div><strong>Need help?</strong><small>Contact operations support</small></div></div></aside>
        <main className="main-content"><div className="page-heading"><div><p className="eyebrow">FINANCE / PAYMENT VOUCHERS</p><h1>Create payment voucher</h1><p className="subheading">Prepare a payment request for review and approval.</p></div><div className="draft-pill"><span /> Draft mode</div></div>
          {notice && <div className={`notice ${notice.type}`} role="status"><span>{notice.type === 'success' ? '✓' : 'i'}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss message">×</button></div>}
          <div className="workspace-grid"><form className="voucher-card" onSubmit={submitVoucher}>
            <div className="form-card-heading"><div><span className="section-number">01</span><div><h2>Voucher details</h2><p>Fill in the basic information for this request.</p></div></div><span className="required-note">* Required</span></div>
            <div className="field-grid"><label>Payee *<input required value={form.payee} onChange={(event) => updateField('payee', event.target.value)} placeholder="Person or organisation" /></label><label>Payment voucher no. *<input required readOnly value={form.pvNO} placeholder={isLoadingPvNumber ? 'Generating voucher number...' : 'Voucher number unavailable'} />{isLoadingPvNumber && <small className="field-hint">Getting a unique number...</small>}</label><label>Department *<select required value={form.department} onChange={(event) => updateField('department', event.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select>{isLoading && <small className="field-hint">Loading departments...</small>}</label><label>Date<input type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label></div>
            <div className="form-card-heading particulars-heading"><div><span className="section-number">02</span><div><h2>Particulars</h2><p>List each item or service being paid for.</p></div></div><button type="button" className="text-button" onClick={addLine}>＋ Add line</button></div>
            <div className="line-items"><div className="line-header"><span>Particular / description</span><span>Qty</span><span>Amount (₦)</span><span /></div>{form.particulars.map((item, index) => <div className="line-row" key={index}><input required value={item.name} onChange={(event) => updateLine(index, 'name', event.target.value)} placeholder="Describe the expense" /><input required type="number" min="1" value={item.quantity} onChange={(event) => updateLine(index, 'quantity', event.target.value)} /><input required type="number" min="0" step="0.01" value={item.amount} onChange={(event) => updateLine(index, 'amount', event.target.value)} placeholder="0.00" /><button type="button" className="remove-line" onClick={() => removeLine(index)} aria-label={`Remove line ${index + 1}`}>×</button></div>)}<div className="total-row"><span>Total</span><strong>{formatMoney(totalAmount)}</strong></div></div>
            <div className="form-card-heading approval-heading"><div><span className="section-number">03</span><div><h2>Review notes</h2><p>Add the amount in words for the printed voucher.</p></div></div></div><label className="full-field">Amount in words<input required value={form.amountInWords} onChange={(event) => updateField('amountInWords', event.target.value)} placeholder="e.g. One hundred and twenty-five thousand naira only" /></label><div className="form-actions"><button type="button" className="secondary-button" onClick={resetForm}>Clear form</button><button type="submit" className="primary-button" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save as draft'} <span>→</span></button></div>
          </form>
          <section className="recent-panel"><div className="recent-heading"><div><p className="eyebrow">ACTIVITY</p><h2>Recent vouchers</h2></div><span className="count-badge">{recentVouchers.length}</span></div><div className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search vouchers" /></div>{filteredVouchers.length > 0 ? <div className="recent-list">{filteredVouchers.slice(0, 5).map((voucher) => <div className="recent-item" key={voucher._id || voucher.pvNO}><div className="voucher-icon">₦</div><div><strong>{voucher.pvNO}</strong><span>{voucher.payee}</span></div><b>{formatMoney(voucher.totalAmount)}</b></div>)}</div> : <div className="empty-state"><div className="empty-icon">✦</div><strong>No vouchers yet</strong><p>Saved drafts will appear here.</p></div>}<div className="approval-note"><span>↗</span><div><strong>Approval flow</strong><p>Drafts move to your HOD for first review.</p></div></div></section></div>
        </main>
      </div>
    </div>
  )
}

export default App
