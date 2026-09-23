import { jsPDF } from '../Frontend/node_modules/jspdf/dist/jspdf.es.min.js'
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const outputPath = new URL('./SABI-Microfinance-Bank-Portal-User-Guide.pdf', import.meta.url)
const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
const pageWidth = pdf.internal.pageSize.getWidth()
const pageHeight = pdf.internal.pageSize.getHeight()
const margin = 18
const contentWidth = pageWidth - margin * 2
const colors = {
  ink: [24, 48, 39],
  muted: [83, 101, 92],
  green: [8, 116, 67],
  paleGreen: [231, 245, 236],
  orange: [213, 105, 42],
  paleOrange: [253, 241, 230],
  line: [214, 226, 219],
  white: [255, 255, 255],
}

let y = 18
let pageNumber = 1

function setColor(color) { pdf.setTextColor(...color) }
function setFill(color) { pdf.setFillColor(...color) }
function setDraw(color) { pdf.setDrawColor(...color) }

function footer() {
  setDraw(colors.line)
  pdf.setLineWidth(0.25)
  pdf.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14)
  pdf.setFont('helvetica', 'normal').setFontSize(8)
  setColor(colors.muted)
  pdf.text('SABI Microfinance Bank | Portal User Guide', margin, pageHeight - 8)
  pdf.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 8, { align: 'right' })
}

function newPage() {
  footer()
  pdf.addPage()
  pageNumber += 1
  y = 20
}

function ensureSpace(height) {
  if (y + height > pageHeight - 22) newPage()
}

function title(text, subtitle = '') {
  ensureSpace(24)
  pdf.setFont('helvetica', 'bold').setFontSize(22)
  setColor(colors.ink)
  pdf.text(text, margin, y)
  y += 8
  if (subtitle) {
    pdf.setFont('helvetica', 'normal').setFontSize(10.5)
    setColor(colors.muted)
    pdf.text(subtitle, margin, y)
    y += 9
  }
}

function section(text) {
  ensureSpace(17)
  y += 3
  pdf.setFont('helvetica', 'bold').setFontSize(14)
  setColor(colors.green)
  pdf.text(text, margin, y)
  y += 7
}

function paragraph(text, options = {}) {
  const size = options.size || 10
  const leading = options.leading || 5.2
  const lines = pdf.splitTextToSize(text, options.width || contentWidth)
  ensureSpace(lines.length * leading + 3)
  pdf.setFont('helvetica', options.bold ? 'bold' : 'normal').setFontSize(size)
  setColor(options.color || colors.muted)
  pdf.text(lines, options.x || margin, y)
  y += lines.length * leading + 3
}

function bullet(text, number = null) {
  const prefix = number === null ? '•' : `${number}.`
  const lines = pdf.splitTextToSize(text, contentWidth - 8)
  ensureSpace(lines.length * 5.1 + 2)
  pdf.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...colors.green)
  pdf.text(prefix, margin, y)
  pdf.setFont('helvetica', 'normal').setFontSize(10).setTextColor(...colors.muted)
  pdf.text(lines, margin + 7, y)
  y += lines.length * 5.1 + 2
}

function callout(label, text, color = colors.paleGreen, accent = colors.green) {
  const lines = pdf.splitTextToSize(text, contentWidth - 12)
  const height = lines.length * 5 + 14
  ensureSpace(height + 3)
  setFill(color)
  pdf.roundedRect(margin, y, contentWidth, height, 2, 2, 'F')
  setFill(accent)
  pdf.rect(margin, y, 3, height, 'F')
  pdf.setFont('helvetica', 'bold').setFontSize(9.5).setTextColor(...colors.ink)
  pdf.text(label.toUpperCase(), margin + 8, y + 8)
  pdf.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...colors.muted)
  pdf.text(lines, margin + 8, y + 14)
  y += height + 6
}

function table(headers, rows, widths) {
  if (!Array.isArray(rows[0]) && Array.isArray(widths?.[0])) [rows, widths] = [widths, rows]
  const rowHeight = 9
  ensureSpace(rowHeight * 2 + 8)
  let x = margin
  setFill(colors.green)
  pdf.rect(margin, y, contentWidth, rowHeight, 'F')
  pdf.setFont('helvetica', 'bold').setFontSize(8.5).setTextColor(...colors.white)
  headers.forEach((header, index) => {
    pdf.text(header, x + 3, y + 6)
    x += widths[index]
  })
  y += rowHeight
  rows.forEach((row, rowIndex) => {
    const wrapped = row.map((cell, index) => pdf.splitTextToSize(String(cell), widths[index] - 6))
    const height = Math.max(rowHeight, ...wrapped.map((lines) => lines.length * 4.2 + 5))
    ensureSpace(height + 2)
    if (rowIndex % 2 === 0) { setFill([247, 250, 248]); pdf.rect(margin, y, contentWidth, height, 'F') }
    setDraw(colors.line); pdf.setLineWidth(0.2); pdf.rect(margin, y, contentWidth, height)
    x = margin
    pdf.setFont('helvetica', 'normal').setFontSize(8.5).setTextColor(...colors.muted)
    wrapped.forEach((lines, index) => { pdf.text(lines, x + 3, y + 5.5); x += widths[index] })
    y += height
  })
  y += 5
}

function numberedSteps(steps) {
  steps.forEach((step, index) => {
    ensureSpace(18)
    setFill(colors.paleGreen)
    pdf.circle(margin + 4, y + 2, 4, 'F')
    pdf.setFont('helvetica', 'bold').setFontSize(9).setTextColor(...colors.green)
    pdf.text(String(index + 1), margin + 4, y + 5, { align: 'center' })
    pdf.setFont('helvetica', 'bold').setFontSize(10).setTextColor(...colors.ink)
    pdf.text(step[0], margin + 12, y + 4)
    y += 8
    paragraph(step[1], { x: margin + 12, width: contentWidth - 12, size: 9.5 })
  })
}

function cover() {
  setFill(colors.ink)
  pdf.rect(0, 0, pageWidth, pageHeight, 'F')
  setFill(colors.green)
  pdf.rect(0, 0, pageWidth, 10, 'F')
  setFill(colors.orange)
  pdf.rect(0, pageHeight - 8, pageWidth, 8, 'F')
  pdf.setFont('helvetica', 'bold').setFontSize(40).setTextColor(...colors.white)
  pdf.text('SABI', margin, 48)
  pdf.setFontSize(14).setTextColor(190, 224, 202)
  pdf.text('MICROFINANCE BANK', margin, 58)
  pdf.setFontSize(25).setTextColor(...colors.white)
  pdf.text('Bank Portal', margin, 103)
  pdf.text('User Guide', margin, 114)
  pdf.setFont('helvetica', 'normal').setFontSize(11).setTextColor(216, 231, 222)
  pdf.text('A practical guide to creating, reviewing,', margin, 132)
  pdf.text('approving, and managing payment vouchers.', margin, 139)
  setFill(colors.paleGreen)
  pdf.roundedRect(margin, 171, contentWidth, 44, 3, 3, 'F')
  pdf.setFont('helvetica', 'bold').setFontSize(12).setTextColor(...colors.ink)
  pdf.text('PRIMARY MODULE', margin + 10, 185)
  pdf.setFontSize(20).setTextColor(...colors.green)
  pdf.text('Payment Voucher', margin + 10, 199)
  pdf.setFont('helvetica', 'normal').setFontSize(9.5).setTextColor(...colors.muted)
  pdf.text('Version 1.0 | September 2026', margin + 10, 208)
  pdf.setFontSize(9).setTextColor(190, 224, 202)
  pdf.text('For staff, reviewers, administrators, and operations support', margin, pageHeight - 22)
  footer()
  pdf.addPage()
  pageNumber += 1
  y = 20
}

cover()
title('How to use this guide', 'This guide describes the current SABI Microfinance Bank portal experience.')
paragraph('The SABI portal is an internal workspace for preparing payment requests, routing them through controlled approval stages, managing staff and departments, and keeping a searchable record of payment vouchers. Access is based on the signed-in user\'s role.')
section('What the portal helps you do')
bullet('Create a payment voucher with a payee, department, expense lines, quantity, amount, total, and amount in words.')
bullet('Send the voucher through the configured approval route: HOD, ICU, CFO, and MD.')
bullet('Review assigned vouchers and approve or reject them with a comment when needed.')
bullet('Let administrators manage staff accounts, departments, voucher records, and approval-flow information.')
bullet('Manage account details, change a password, and sign out securely.')
callout('Important', 'The Documents navigation item is visible in the workspace but is currently marked “soon”. The active document export feature is available to administrators from All vouchers, where a voucher can be downloaded as PDF or DOCX.', colors.paleOrange, colors.orange)
section('Who uses which area')
table(['User type', 'Main access', 'Typical responsibility'], [
  ['Staff / initiator', 'Payment vouchers, profile', 'Prepare and submit payment requests.'],
  ['HOD, ICU, CFO, MD', 'Payment vouchers, approvals, profile', 'Review vouchers at the assigned stage.'],
  ['Administrator', 'Admin control center, profile', 'Manage people, departments, vouchers, and flow reference.'],
], [34, 57, 87])

newPage()
title('Getting started', 'Sign in, understand the workspace, and keep your account secure.')
section('Sign in')
numberedSteps([
  ['Open the portal', 'Use the portal address provided by your operations or technology team.'],
  ['Enter your credentials', 'Use your registered email address and password.'],
  ['Confirm your workspace', 'Staff land in Payment vouchers. Administrators land in the admin control center. Reviewers can open Approvals when vouchers are waiting for their role.'],
])
section('Main navigation')
table(['Area', 'What it contains'], [46, 132], [
  ['Payment vouchers', 'The staff workspace for creating a voucher and searching your recent voucher records.'],
  ['Documents', 'Reserved for a future document workspace and currently labelled “soon”.'],
  ['Approvals', 'Visible to HOD, ICU, CFO, and MD users. Shows vouchers waiting at that reviewer\'s stage.'],
  ['Profile settings', 'Account information, role and department details, password change, and sign out.'],
  ['Admin control center', 'Administrator-only overview, staff accounts, departments, all vouchers, and approval-flow reference.'],
])
section('Account security')
bullet('Use Profile settings to view your username, email, role, and department.')
bullet('To change your password, enter the current password, a new password of at least eight characters, and the matching confirmation.')
bullet('Sign out when leaving a shared or unattended workstation.')

newPage()
title('Payment Voucher', 'The first module and the starting point for a controlled payment request.')
paragraph('A Payment Voucher (PV) records who should be paid, which department owns the request, what is being purchased or reimbursed, and how much it costs. After it is created, the voucher becomes part of the approval workflow and can be tracked by its unique PV number.')
section('Voucher form at a glance')
table(['Field', 'What to enter', 'Why it matters'], [42, 69, 67], [
  ['Payee', 'The person or organisation receiving payment.', 'Identifies the recipient.'],
  ['Payment voucher no.', 'The generated PV number. It is read-only.', 'Provides a unique reference for searching and review.'],
  ['Department', 'The department responsible for the request.', 'Determines the department context and the HOD review route.'],
  ['Date', 'The date shown while preparing the request.', 'Helps the user identify the request in context.'],
  ['Particulars', 'One or more expense descriptions.', 'Explains exactly what the payment covers.'],
  ['Quantity', 'The number of units for a line.', 'Used with amount to calculate the line total.'],
  ['Amount', 'The unit amount in naira for a line.', 'Used with quantity to calculate the line total.'],
  ['Amount in words', 'The total written in words, for example “One hundred thousand naira only”.', 'Makes the printed voucher easier to verify.'],
])
callout('Before you save', 'Check the payee spelling, select the correct department, describe each expense clearly, and confirm that the calculated total agrees with your supporting request or invoice.', colors.paleOrange, colors.orange)

newPage()
title('Creating a Payment Voucher', 'Follow these steps from the Payment vouchers workspace.')
numberedSteps([
  ['Start a new request', 'Open Payment vouchers. The page opens in Draft mode with a new payment voucher number being generated.'],
  ['Enter the payee', 'Type the full name of the person or organisation to be paid.'],
  ['Confirm the PV number', 'The system supplies the payment voucher number. Do not overwrite it; use it as the reference for follow-up.'],
  ['Select a department', 'Choose the department responsible for the expense. This is required because the department HOD is the first reviewer.'],
  ['Review the date', 'Use the date shown for the request. The saved record also receives its creation timestamp.'],
  ['Add particulars', 'Enter a short, specific description such as “Office printer toner”. Select Add line for each additional item or service.'],
  ['Enter quantity and amount', 'Quantity must be at least 1. Amount must be zero or greater. The total updates automatically as quantity × amount for every line.'],
  ['Write the amount in words', 'Enter the total in words and compare it with the numeric total.'],
  ['Save the voucher', 'Select Save as draft. A confirmation appears and the voucher is added to Recent vouchers. The backend then starts the HOD approval route when an active HOD is configured.'],
])
callout('Good particulars', 'Use descriptions that another reviewer can understand without asking for clarification. Include the item or service and, where useful, a period, project, or purpose.', colors.paleGreen, colors.green)

newPage()
title('Payment Voucher workflow', 'What happens after a voucher is saved.')
section('Approval route')
table(['Stage', 'Reviewer', 'What happens'], [38, 47, 93], [
  ['1', 'HOD', 'The department Head of Department checks the request first.'],
  ['2', 'ICU', 'Internal Control Unit performs the next control review.'],
  ['3', 'CFO', 'The Chief Financial Officer reviews the financial request.'],
  ['4', 'MD', 'The Managing Director provides the final approval decision.'],
  ['5', 'Approved', 'The voucher has completed the configured approval route.'],
])
section('Voucher statuses')
table(['Status', 'Meaning'], [62, 116], [
  ['Draft', 'The voucher is being prepared or has been saved from the entry screen.'],
  ['PENDING_HOD', 'Waiting for the department HOD.'],
  ['PENDING_ICU', 'Waiting for Internal Control Unit.'],
  ['PENDING_CFO', 'Waiting for the Chief Financial Officer.'],
  ['PENDING_MD', 'Waiting for the Managing Director.'],
  ['APPROVED', 'The final approval stage has accepted the voucher.'],
  ['REJECTED', 'A reviewer rejected the voucher. The rejection reason should explain what needs attention.'],
])
callout('Routing requirement', 'An active HOD must be configured for the selected department. Active reviewers must also exist for the next approval stage before a reviewer can approve and move the voucher forward.', colors.paleOrange, colors.orange)

newPage()
title('Reviewing and deciding approvals', 'For HOD, ICU, CFO, and MD reviewers.')
section('Open your review queue')
numberedSteps([
  ['Open Approvals', 'Select Approvals from the workspace navigation. The queue shows vouchers assigned to your role and current stage.'],
  ['Check the progress indicator', 'The stage tracker shows which step you own and how the request moves through the strict approval flow.'],
  ['Select a voucher', 'Review the PV number, payee, total amount, current stage, and every particular line.'],
  ['Choose a decision', 'Select Approve voucher or Reject voucher.'],
  ['Add a comment', 'A comment is optional for approval. A rejection reason is required and should be specific enough for the initiator to correct the request.'],
  ['Submit', 'Select Approve and continue to send the voucher to the next stage, or Reject voucher to end the current route with a rejection status.'],
])
section('What reviewers should verify')
bullet('The payee matches the supporting document or request.')
bullet('The department and HOD route are correct.')
bullet('Each particular is clear, necessary, and supported.')
bullet('Quantities, unit amounts, numeric total, and amount in words agree.')
bullet('The request is not a duplicate and is currently at your stage.')
callout('Concurrent reviewers', 'More than one active reviewer may be assigned to a stage. Once an authorised reviewer decides, the voucher advances or is rejected and other pending assignments for that stage are cancelled.', colors.paleGreen, colors.green)

newPage()
title('Administration and records', 'Administrator features for keeping the portal ready.')
section('Admin control center')
table(['Admin area', 'Available actions'], [52, 126], [
  ['Overview', 'See staff, active-account, department, and pending-invite counts; use quick actions; view the configured route.'],
  ['Staff accounts', 'Search staff, create a staff account, assign department and role, and activate or disable access.'],
  ['Departments', 'Add a department with a name and optional code, view available departments, and delete a department after confirmation.'],
  ['All vouchers', 'Search every voucher by PV number, payee, or status; view department and amount; download a voucher as PDF or DOCX.'],
  ['Approval flow', 'View the configured reference stages from PENDING_HOD through APPROVED.'],
])
section('Voucher downloads')
paragraph('From All vouchers, an administrator can download a selected voucher as PDF or DOCX. The generated record includes the PV number, payee, department, date, status, particulars, total, amount in words, and approval history when available.')
section('Recent vouchers')
paragraph('The staff workspace shows a Recent vouchers panel with a search box. It is intended to help the signed-in user find vouchers they created by PV number or payee. The list displays the PV number, payee, and total amount.')
callout('Operational note', 'The portal is the record-entry and approval workspace. Keep invoices, receipts, and other supporting evidence according to the bank\'s document-retention process, especially while the Documents workspace is still marked “soon”.', colors.paleOrange, colors.orange)

newPage()
title('Troubleshooting and good practice', 'Common messages and the quickest response.')
table(['Message or symptom', 'What to check'], [72, 106], [
  ['Unable to generate payment voucher number', 'Confirm the backend is reachable and try again. Do not invent a replacement PV number.'],
  ['Departments are still loading', 'Wait for the department list to load. If it remains empty, contact operations support.'],
  ['No active HOD approver is configured', 'Ask an administrator to configure an active HOD for the selected department.'],
  ['No active next-stage approver', 'The current reviewer cannot advance the voucher until the next role has an active approver.'],
  ['Rejection reason required', 'Select Reject voucher and provide a clear reason before submitting.'],
  ['Voucher is not at your stage', 'Refresh the queue. Another reviewer may have already decided it, or the voucher may have moved forward.'],
  ['Access denied or session expired', 'Sign in again. If the account is inactive or the role is incorrect, contact an administrator.'],
  ['No vouchers yet', 'Use the Payment vouchers form to create one, or broaden the search text.'],
])
section('Quality checklist')
bullet('Use one line per distinct item or service.')
bullet('Avoid vague descriptions such as “expenses” or “miscellaneous”.')
bullet('Check naira amounts and quantities before saving.')
bullet('Keep the PV number in any related communication.')
bullet('Review the status and approval stage before following up with a reviewer.')
callout('Support', 'For access, routing, or system errors, contact operations support and include the PV number, your role, the action you were taking, and the exact message shown.', colors.paleGreen, colors.green)

footer()
writeFileSync(fileURLToPath(outputPath), Buffer.from(pdf.output('arraybuffer')))
console.log(`Created ${fileURLToPath(outputPath)}`)