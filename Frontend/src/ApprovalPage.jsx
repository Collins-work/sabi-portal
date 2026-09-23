import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import './Approval.css'
import './ApprovalDetails.css'
import './ApprovalShellOverrides.css'
import ProfileMenu from './ProfileMenu.jsx'

const APPROVAL_ROLES = ['HOD', 'ICU', 'CFO', 'MD']
const STAGES = [
  { key: 'HOD', label: 'Head of department', status: 'PENDING_HOD' },
  { key: 'ICU', label: 'Internal control unit', status: 'PENDING_ICU' },
  { key: 'CFO', label: 'Chief financial officer', status: 'PENDING_CFO' },
  { key: 'MD', label: 'Managing director', status: 'PENDING_MD' },
]

function getApiData(response) {
  return response.json().then((body) => body.data ?? body)
}

function headers(withJson = false) {
  const token = localStorage.getItem('sabi_token')
  return { ...(withJson ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function formatMoney(value) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2 }).format(value || 0)
}

function getVoucher(approval) {
  return approval?.voucher || approval || {}
}

function ApprovalPage({ apiUrl, user, onLogout }) {
  const navigate = useNavigate()
  const role = String(user.role || '').toUpperCase()
  const [approvals, setApprovals] = useState([])
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [decision, setDecision] = useState('APPROVED')
  const [reason, setReason] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (!APPROVAL_ROLES.includes(role)) return
    const loadApprovals = async () => {
      try {
        const response = await fetch(`${apiUrl}/approvals/pending`, { headers: headers() })
        if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to load approvals')
        setApprovals(await getApiData(response))
      } catch (error) {
        setNotice({ type: 'error', text: error.message })
      } finally {
        setIsLoading(false)
      }
    }
    loadApprovals()
  }, [apiUrl, role])

  const currentStage = STAGES.find((stage) => stage.key === role)
  const selectedVoucher = getVoucher(selectedApproval)
  const submitDecision = async (event) => {
    event.preventDefault()
    if (!selectedApproval) return
    if (decision === 'REJECTED' && !reason.trim()) {
      setNotice({ type: 'error', text: 'A reason is required when rejecting a voucher.' })
      return
    }
    setIsSubmitting(true)
    setNotice(null)
    try {
      const response = await fetch(`${apiUrl}/approvals/${selectedApproval._id}/decision`, { method: 'POST', headers: headers(true), body: JSON.stringify({ decision, reason: reason.trim() }) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to submit approval decision')
      setApprovals((current) => current.filter((approval) => approval._id !== selectedApproval._id))
      setSelectedApproval(null)
      setReason('')
      setNotice({ type: 'success', text: decision === 'APPROVED' ? 'Voucher approved and sent to the next stage.' : 'Voucher rejected and returned to the initiator.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!APPROVAL_ROLES.includes(role)) return <Navigate to="/" replace />
  const stageIndex = STAGES.findIndex((stage) => stage.key === role)

  return <div className="approval-shell">
    <header className="approval-topbar"><div className="brand-lockup"><div className="brand-mark">S</div><div><strong>SABI</strong><span>MICROFINANCE BANK</span></div></div><div className="approval-top-actions"><span className="approval-live-dot" /><ProfileMenu user={user} onLogout={onLogout} /></div></header>
    <div className="approval-layout"><aside className="approval-sidebar"><div className="approval-kicker">WORKSPACE</div><button className="approval-nav" onClick={() => navigate('/')}><span>▣</span> Payment vouchers</button><button className="approval-nav"><span>◫</span> Documents <em>soon</em></button><button className="approval-nav active"><span>◌</span> Approvals <b>{approvals.length}</b></button><div className="approval-sidebar-footer"><strong>{role} reviewer</strong><small>Your decisions are audited</small></div></aside>
      <main className="approval-main"><div className="approval-heading"><div><p className="approval-eyebrow">WORKFLOW / {role}</p><h1>Approvals</h1><p>Review vouchers assigned to your stage before they move forward.</p></div><div className="approval-heading-actions"><div className="stage-pill"><span /> Your stage: {currentStage.label}</div>{approvals.length > 0 && <div className="pending-notification" role="status"><span>●</span>{approvals.length} pending {approvals.length === 1 ? 'voucher' : 'vouchers'} to review</div>}</div></div>
        {notice && <div className={`approval-notice ${notice.type}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss message">x</button></div>}
        <section className="stage-progress"><div className="progress-label"><span>Strict approval flow</span><small>Step {stageIndex + 1} of {STAGES.length}</small></div><div className="stage-track">{STAGES.map((stage, index) => <div className={`stage-step ${index < stageIndex ? 'complete' : ''} ${index === stageIndex ? 'current' : ''}`} key={stage.key}><span>{index < stageIndex ? '✓' : index + 1}</span><strong>{stage.key}</strong><small>{stage.label}</small></div>)}</div></section>
        <div className="approval-content"><section className="approval-list-panel"><div className="approval-panel-heading"><div><p className="approval-eyebrow">REVIEW QUEUE</p><h2>Waiting for your decision</h2></div><span className="approval-count">{approvals.length}</span></div>{isLoading ? <div className="approval-empty">Loading your approval queue...</div> : approvals.length === 0 ? <div className="approval-empty"><span>✓</span><strong>Nothing waiting for you</strong><p>New vouchers will appear here when they reach the {role} stage.</p></div> : <div className="approval-list">{approvals.map((approval) => { const voucher = approval.voucher || approval; return <button className={`approval-item ${selectedApproval?._id === approval._id ? 'selected' : ''}`} key={approval._id} onClick={() => setSelectedApproval(approval)}><div className="approval-doc-icon">₦</div><div><strong>{voucher.pvNO || voucher.voucherNumber || 'Payment voucher'}</strong><span>{voucher.payee || 'Unknown payee'}</span></div><b>{formatMoney(voucher.totalAmount)}</b><small>Review →</small></button> })}</div>}</section>
          <section className="decision-panel">{selectedApproval ? <><div className="decision-heading"><p className="approval-eyebrow">VOUCHER REVIEW</p><h2>{selectedVoucher.pvNO || selectedVoucher.voucherNumber || 'Payment voucher'}</h2><p>Confirm your decision for this approval stage.</p></div><div className="decision-summary"><div><span>Payee</span><strong>{selectedVoucher.payee || 'Not provided'}</strong></div><div><span>Total amount</span><strong>{formatMoney(selectedVoucher.totalAmount)}</strong></div><div><span>Current stage</span><strong>{currentStage.label}</strong></div></div><div className="particulars-review"><div className="particulars-review-heading"><strong>Particulars</strong><span>{selectedVoucher.particulars?.length || 0} items</span></div>{selectedVoucher.particulars?.length ? <div className="particulars-review-table"><div><span>Description</span><span>Qty</span><span>Amount</span></div>{selectedVoucher.particulars.map((item, index) => <div key={`${item.name}-${index}`}><span>{item.name}</span><span>{item.quantity}</span><span>{formatMoney(item.amount)}</span></div>)}</div> : <p className="particulars-empty">No particulars were provided.</p>}</div><label className="decision-label">Decision<select value={decision} onChange={(event) => setDecision(event.target.value)}><option value="APPROVED">Approve voucher</option><option value="REJECTED">Reject voucher</option></select></label><label className="decision-label">Comment {decision === 'REJECTED' ? '*' : '(optional)'}<textarea required={decision === 'REJECTED'} value={reason} onChange={(event) => setReason(event.target.value)} placeholder={decision === 'REJECTED' ? 'Explain why this voucher is being rejected' : 'Add a review comment'} /></label><button className="decision-submit" disabled={isSubmitting} onClick={submitDecision}>{isSubmitting ? 'Submitting...' : decision === 'APPROVED' ? 'Approve and continue' : 'Reject voucher'}<span>→</span></button></> : <div className="decision-empty"><div>←</div><strong>Select a voucher to review</strong><p>Choose an item from your queue to see its details and submit a decision.</p></div>}</section></div>
      </main>
    </div>
  </div>
}

export default ApprovalPage
