import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './Admin.css'
import './AdminDelete.css'
import './AdminOverrides.css'
import './AdminVouchers.css'
import ProfileMenu from './ProfileMenu.jsx'
import ProfileSettings from './ProfileSettings.jsx'
import { downloadVoucherDocx, downloadVoucherPdf } from './voucherDocuments.js'

const blankStaff = { firstName: '', lastName: '', email: '', employeeId: '', department: '', role: 'STAFF', temporaryPassword: '' }

function getName(user) {
  return user.username || user.name || user.email?.split('@')[0] || 'Admin'
}

function getApiData(response) {
  return response.json().then((body) => body.data ?? body)
}

function headers(withJson = false) {
  const token = localStorage.getItem('sabi_token')
  return { ...(withJson ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

function AdminPage({ apiUrl, user, onLogout }) {
  const location = useLocation()
  const navigate = useNavigate()
  const activeTab = location.pathname === '/admin/staff' ? 'staff' : location.pathname === '/admin/departments' ? 'departments' : location.pathname === '/admin/approvals' ? 'approvals' : location.pathname === '/admin/vouchers' ? 'vouchers' : 'overview'
  const [staff, setStaff] = useState([])
  const [departments, setDepartments] = useState([])
  const [vouchers, setVouchers] = useState([])
  const [staffForm, setStaffForm] = useState(blankStaff)
  const [departmentName, setDepartmentName] = useState('')
  const [departmentCode, setDepartmentCode] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const loadAdminData = async () => {
      try {
        const requests = [
          fetch(`${apiUrl}/admin/staff`, { headers: headers() }),
          fetch(`${apiUrl}/departments`, { headers: headers() }),
        ]
        if (activeTab === 'vouchers') requests.push(fetch(`${apiUrl}/admin/payment-vouchers`, { headers: headers() }))
        const [staffResponse, departmentResponse, voucherResponse] = await Promise.all(requests)
        if (staffResponse.ok) setStaff(await getApiData(staffResponse))
        if (departmentResponse.ok) setDepartments(await getApiData(departmentResponse))
        if (voucherResponse?.ok) setVouchers(await getApiData(voucherResponse))
      } catch {
        setNotice({ type: 'info', text: 'Admin API routes are not connected yet. The workspace is ready for your backend.' })
      } finally {
        setIsLoading(false)
      }
    }
    loadAdminData()
  }, [apiUrl, activeTab])

  const visibleStaff = useMemo(() => staff.filter((member) => `${member.firstName || ''} ${member.lastName || ''} ${member.name || ''} ${member.email || ''}`.toLowerCase().includes(search.toLowerCase())), [staff, search])
  const visibleVouchers = useMemo(() => vouchers.filter((voucher) => `${voucher.pvNO || ''} ${voucher.payee || ''} ${voucher.status || ''}`.toLowerCase().includes(search.toLowerCase())), [vouchers, search])
  const activeStaff = staff.filter((member) => member.isActive !== false).length
  const pendingInvites = staff.filter((member) => member.status === 'Pending' || member.status === 'INVITED').length
  const updateStaff = (field, value) => setStaffForm((current) => ({ ...current, [field]: value }))

  const createStaff = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setNotice(null)
    try {
      const response = await fetch(`${apiUrl}/admin/staff`, { method: 'POST', headers: headers(true), body: JSON.stringify({ ...staffForm, employeeId: staffForm.employeeId || String(staff.length + 1).padStart(5, '0'), role: staffForm.role.toUpperCase() }) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to create staff account')
      const created = await getApiData(response)
      setStaff((current) => [created, ...current])
      setStaffForm(blankStaff)
      setNotice({ type: 'success', text: 'Staff account created successfully.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleStaff = async (member) => {
    try {
      const response = await fetch(`${apiUrl}/admin/staff/${member._id || member.id}/status`, { method: 'PATCH', headers: headers(true), body: JSON.stringify({ isActive: member.isActive === false }) })
      if (!response.ok) throw new Error('Unable to update staff status')
      const updated = await getApiData(response)
      setStaff((current) => current.map((item) => (item._id === member._id ? updated : item)))
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  const createDepartment = async (event) => {
    event.preventDefault()
    if (!departmentName.trim()) return
    try {
      const response = await fetch(`${apiUrl}/departments`, { method: 'POST', headers: headers(true), body: JSON.stringify({ name: departmentName.trim(), code: departmentCode.trim().toUpperCase() }) })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to create department')
      const created = await getApiData(response)
      setDepartments((current) => [...current, created])
      setDepartmentName('')
      setDepartmentCode('')
      setNotice({ type: 'success', text: 'Department added.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  const deleteDepartment = async (department) => {
    if (!window.confirm(`Delete ${department.name}? Staff and vouchers using it may be affected.`)) return
    try {
      const response = await fetch(`${apiUrl}/departments/${department._id}`, { method: 'DELETE', headers: headers() })
      if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'Unable to delete department')
      setDepartments((current) => current.filter((item) => item._id !== department._id))
      setNotice({ type: 'success', text: 'Department deleted.' })
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  const downloadVoucher = async (voucher, format) => {
    try {
      const response = await fetch(`${apiUrl}/admin/payment-vouchers/${voucher._id}`, { headers: headers() })
      if (!response.ok) throw new Error('Unable to download voucher')
      const fullVoucher = await getApiData(response)
      if (format === 'pdf') downloadVoucherPdf(fullVoucher)
      else await downloadVoucherDocx(fullVoucher)
    } catch (error) {
      setNotice({ type: 'error', text: error.message })
    }
  }

  const profileName = getName(user)
  const tabClass = (tab) => `admin-nav-item ${activeTab === tab ? 'active' : ''}`

  if (location.pathname === '/admin/profile') return <ProfileSettings apiUrl={apiUrl} user={user} backPath="/admin" onLogout={onLogout} />

  return (
    <div className="admin-shell">
      <header className="admin-topbar"><div className="brand-lockup"><div className="brand-mark">S</div><div><strong>SABI</strong><span>MICROFINANCE BANK</span></div></div><div className="admin-top-actions"><span className="admin-role">Administrator</span><ProfileMenu user={user} basePath="/admin/profile" onLogout={onLogout} /></div></header>
      <div className="admin-layout">
        <aside className="admin-sidebar"><div className="admin-sidebar-kicker">ADMINISTRATION</div><button className={tabClass('overview')} onClick={() => navigate('/admin')}><span>□</span> Overview</button><button className={tabClass('staff')} onClick={() => navigate('/admin/staff')}><span>♙</span> Staff accounts</button><button className={tabClass('departments')} onClick={() => navigate('/admin/departments')}><span>⌂</span> Departments</button><button className={tabClass('vouchers')} onClick={() => navigate('/admin/vouchers')}><span>▤</span> All vouchers</button><button className={tabClass('approvals')} onClick={() => navigate('/admin/approvals')}><span>◌</span> Approval flow</button><div className="admin-sidebar-bottom"><strong>{profileName}</strong><small>{user.email || 'Administrator account'}</small></div></aside>
        <main className="admin-main">
          <div className="admin-heading"><div><p className="admin-eyebrow">CONTROL CENTER</p><h1>{activeTab === 'staff' ? 'Staff accounts' : activeTab === 'departments' ? 'Departments' : activeTab === 'vouchers' ? 'All vouchers' : activeTab === 'approvals' ? 'Approval flow' : 'Good morning, ' + profileName}</h1><p>{activeTab === 'overview' ? 'Keep people, access, and workflow settings in order.' : activeTab === 'vouchers' ? 'View, search, and download every payment voucher.' : 'Manage the configuration behind your operations portal.'}</p></div><div className="admin-status"><span /> System active</div></div>
          {notice && <div className={`admin-notice ${notice.type}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss message">x</button></div>}
          {activeTab === 'overview' && <><div className="admin-stats"><div><span className="stat-icon green">♙</span><small>Total staff</small><strong>{staff.length}</strong><em>Accounts in directory</em></div><div><span className="stat-icon orange">◷</span><small>Active accounts</small><strong>{activeStaff}</strong><em>Can access the portal</em></div><div><span className="stat-icon blue">⌂</span><small>Departments</small><strong>{departments.length}</strong><em>Available for vouchers</em></div><div><span className="stat-icon purple">↗</span><small>Pending invites</small><strong>{pendingInvites}</strong><em>Awaiting first sign-in</em></div></div><div className="admin-columns"><section className="admin-panel quick-panel"><div className="panel-heading"><div><p className="admin-eyebrow">QUICK ACTIONS</p><h2>Keep the portal ready</h2></div></div><button onClick={() => navigate('/admin/staff')} className="quick-action"><span className="quick-action-icon">＋</span><div><strong>Create a staff account</strong><small>Give a new team member access</small></div><b>→</b></button><button onClick={() => navigate('/admin/departments')} className="quick-action"><span className="quick-action-icon">⌂</span><div><strong>Add a department</strong><small>Make a team available for vouchers</small></div><b>→</b></button></section><section className="admin-panel flow-panel"><div className="panel-heading"><div><p className="admin-eyebrow">CURRENT ROUTE</p><h2>Voucher approvals</h2></div><span className="configured-pill">Configured</span></div><div className="flow-list"><div><b>01</b><span>Initiator</span><em>Creates draft</em></div><div><b>02</b><span>HOD</span><em>Department review</em></div><div><b>03</b><span>ICU / CFO</span><em>Finance review</em></div><div><b>04</b><span>MD</span><em>Final approval</em></div></div></section></div></>}
          {activeTab === 'staff' && <div className="admin-columns staff-columns"><section className="admin-panel"><div className="panel-heading"><div><p className="admin-eyebrow">DIRECTORY</p><h2>Staff accounts</h2></div><span className="result-count">{staff.length} total</span></div><div className="admin-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search staff" /></div><div className="staff-table"><div className="staff-table-head"><span>Name</span><span>Department</span><span>Role</span><span>Status</span><span /></div>{isLoading ? <p className="table-empty">Loading staff...</p> : visibleStaff.length === 0 ? <p className="table-empty">No staff accounts found.</p> : visibleStaff.map((member) => <div className="staff-row" key={member._id || member.id || member.email}><div><strong>{member.name || `${member.firstName || ''} ${member.lastName || ''}`.trim() || member.email}</strong><small>{member.email}</small></div><span>{member.department?.name || member.departmentName || 'Unassigned'}</span><span className="role-text">{member.role || 'staff'}</span><span className={member.isActive === false ? 'status-off' : 'status-on'}>{member.isActive === false ? 'Inactive' : 'Active'}</span><button className="row-action" onClick={() => toggleStaff(member)}>{member.isActive === false ? 'Activate' : 'Disable'}</button></div>)}</div></section><section className="admin-panel create-panel"><div className="panel-heading"><div><p className="admin-eyebrow">NEW ACCOUNT</p><h2>Create staff account</h2></div></div><form onSubmit={createStaff}><div className="two-fields"><label>First name<input required value={staffForm.firstName} onChange={(event) => updateStaff('firstName', event.target.value)} /></label><label>Last name<input required value={staffForm.lastName} onChange={(event) => updateStaff('lastName', event.target.value)} /></label></div><label>Work email<input required type="email" value={staffForm.email} onChange={(event) => updateStaff('email', event.target.value)} placeholder="staff@sabimfb.com" /></label><label>Department<select value={staffForm.department} onChange={(event) => updateStaff('department', event.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}</select></label><label>Access level<select value={staffForm.role} onChange={(event) => updateStaff('role', event.target.value)}><option value="staff">Staff</option><option value="hod">Head of department</option><option value="icu">ICU reviewer</option><option value="cfo">CFO</option><option value="md">Managing director</option><option value="admin">Administrator</option></select></label><label>Temporary password<input required minLength="8" type="password" value={staffForm.temporaryPassword} onChange={(event) => updateStaff('temporaryPassword', event.target.value)} placeholder="Minimum 8 characters" /></label><button className="admin-primary" disabled={isSaving}>{isSaving ? 'Creating...' : 'Create account'}<span>→</span></button></form></section></div>}
            {activeTab === 'vouchers' && <section className="admin-panel voucher-directory-panel"><div className="panel-heading"><div><p className="admin-eyebrow">DOCUMENT DIRECTORY</p><h2>All payment vouchers</h2></div><span className="result-count">{vouchers.length} total</span></div><div className="admin-search voucher-search"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by PV number, payee, or status" /></div>{isLoading ? <p className="table-empty">Loading vouchers...</p> : visibleVouchers.length === 0 ? <p className="table-empty">No vouchers found.</p> : <div className="voucher-table"><div className="voucher-table-head"><span>PV number</span><span>Payee</span><span>Department</span><span>Amount</span><span>Status</span><span>Downloads</span></div>{visibleVouchers.map((voucher) => <div className="voucher-row" key={voucher._id}><strong>{voucher.pvNO}</strong><span>{voucher.payee}</span><span>{voucher.department?.name || voucher.departmentName || 'Unassigned'}</span><b>{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(voucher.totalAmount || 0)}</b><span className={`voucher-status status-${String(voucher.status || '').toLowerCase()}`}>{voucher.status || 'Draft'}</span><div className="voucher-downloads"><button type="button" onClick={() => downloadVoucher(voucher, 'pdf')}>PDF</button><button type="button" onClick={() => downloadVoucher(voucher, 'docx')}>DOCX</button></div></div>)}</div>}</section>}
            {activeTab === 'departments' && <div className="admin-columns"><section className="admin-panel create-panel"><div className="panel-heading"><div><p className="admin-eyebrow">ORGANISATION</p><h2>Add a department</h2></div></div><form onSubmit={createDepartment}><label>Department name<input required value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} placeholder="e.g. Risk and Compliance" /></label><label>Department code<input maxLength="8" value={departmentCode} onChange={(event) => setDepartmentCode(event.target.value)} placeholder="e.g. RISK" /></label><button className="admin-primary">Add department <span>→</span></button></form></section><section className="admin-panel"><div className="panel-heading"><div><p className="admin-eyebrow">DIRECTORY</p><h2>Available departments</h2></div><span className="result-count">{departments.length} total</span></div><div className="department-list">{departments.length === 0 ? <p className="table-empty">No departments found.</p> : departments.map((department) => <div className="department-row" key={department._id}><span className="department-mark">{department.code?.slice(0, 2) || 'DP'}</span><div><strong>{department.name}</strong><small>{department.code || 'No code assigned'}</small></div><span className="status-on">Active</span><button type="button" className="delete-department" onClick={() => deleteDepartment(department)}>Delete</button></div>)}</div></section></div>}
          {activeTab === 'approvals' && <section className="admin-panel approval-admin-panel"><div className="panel-heading"><div><p className="admin-eyebrow">WORKFLOW SETTINGS</p><h2>Payment voucher approval flow</h2><p>These stages match the approval statuses in your PaymentVoucher model.</p></div></div><div className="approval-stage-grid">{[['01', 'PENDING_HOD', 'Head of department'], ['02', 'PENDING_ICU', 'Internal control unit'], ['03', 'PENDING_CFO', 'Chief financial officer'], ['04', 'PENDING_MD', 'Managing director'], ['05', 'APPROVED', 'Payment approved']].map(([number, status, title]) => <div className="approval-stage" key={status}><b>{number}</b><span>{status}</span><strong>{title}</strong><small>Required stage</small></div>)}</div><div className="admin-callout"><span>i</span><p>Keep approval transitions on the backend. The admin page should configure who belongs to each role, while your API enforces whether a user can approve a voucher.</p></div></section>}
        </main>
      </div>
    </div>
  )
}

export default AdminPage
