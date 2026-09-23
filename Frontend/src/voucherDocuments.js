import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx'

const money = (amount) => `NGN ${Number(amount || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
const dateValue = (value) => value ? new Date(value).toLocaleDateString('en-NG') : 'N/A'
const approverName = (approval) => approval.approver?.username || approval.approver?.name || approval.approver?.email || 'Unknown reviewer'
const approverEmail = (approval) => approval.approver?.email || 'Email unavailable'
const approvalDate = (approval) => dateValue(approval.decidedAt || approval.updatedAt || approval.createdAt)
const approvalLabel = (approval) => approval.decision || 'PENDING'

function voucherTitle(voucher) {
  return voucher.pvNO || 'payment-voucher'
}

export function downloadVoucherPdf(voucher) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  let y = 22
  pdf.setDrawColor(8, 116, 67)
  pdf.setLineWidth(1)
  pdf.line(18, 13, pageWidth - 18, 13)
  pdf.setFont('helvetica', 'bold').setFontSize(17).setTextColor(20, 55, 43)
  pdf.text('SABI MICROFINANCE BANK', pageWidth / 2, y, { align: 'center' })
  y += 8
  pdf.setFontSize(11).setTextColor(220, 117, 52)
  pdf.text('CASH PAYMENT VOUCHER', pageWidth / 2, y, { align: 'center' })
  y += 16
  pdf.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60, 78, 69)
  const details = [['PV number', voucher.pvNO], ['Payee', voucher.payee], ['Department', voucher.department?.name || voucher.departmentName || 'N/A'], ['Date', dateValue(voucher.createdAt)], ['Status', voucher.status || 'Draft']]
  details.forEach(([label, value], index) => {
    const x = index % 2 === 0 ? 20 : 112
    const rowY = y + Math.floor(index / 2) * 10
    pdf.setFont('helvetica', 'bold').text(`${label}:`, x, rowY)
    pdf.setFont('helvetica', 'normal').text(String(value || 'N/A'), x + 25, rowY)
  })
  y += 35
  pdf.setFillColor(231, 245, 236).setTextColor(24, 67, 50).setFont('helvetica', 'bold')
  pdf.rect(20, y - 6, pageWidth - 40, 9, 'F')
  pdf.text('PARTICULAR / DESCRIPTION', 24, y)
  pdf.text('QTY', 132, y)
  pdf.text('AMOUNT', 160, y)
  y += 9
  pdf.setFont('helvetica', 'normal').setTextColor(60, 78, 69)
  ;(voucher.particulars || []).forEach((item) => {
    const lines = pdf.splitTextToSize(String(item.name || 'N/A'), 100)
    const rowHeight = Math.max(8, lines.length * 5)
    pdf.text(lines, 24, y)
    pdf.text(String(item.quantity || 0), 134, y)
    pdf.text(money(item.amount), 160, y)
    pdf.setDrawColor(220, 229, 225).line(20, y + rowHeight - 3, pageWidth - 20, y + rowHeight - 3)
    y += rowHeight
  })
  y += 6
  pdf.setFont('helvetica', 'bold').setFontSize(12).setTextColor(8, 116, 67)
  pdf.text(`TOTAL: ${money(voucher.totalAmount)}`, pageWidth - 20, y, { align: 'right' })
  y += 12
  pdf.setFont('helvetica', 'normal').setFontSize(10).setTextColor(60, 78, 69)
  pdf.text(`Amount in words: ${voucher.amountInWords || 'N/A'}`, 20, y)
  y += 15
  pdf.setFont('helvetica', 'bold').setFontSize(11).setTextColor(20, 55, 43).text('APPROVAL HISTORY', 20, y)
  y += 7
  pdf.setFont('helvetica', 'normal').setFontSize(8).setTextColor(60, 78, 69)
  ;(voucher.approvals || []).forEach((approval) => {
    const line = `${approval.stage || 'Stage'} | ${approverName(approval)} | ${approverEmail(approval)} | ${approvalLabel(approval)} | ${approvalDate(approval)}`
    const lines = pdf.splitTextToSize(line, pageWidth - 40)
    pdf.text(lines, 20, y)
    y += Math.max(6, lines.length * 4)
  })
  y += 8
  pdf.setDrawColor(180, 198, 188)
  pdf.line(22, y, 88, y)
  pdf.line(120, y, 188, y)
  pdf.setFontSize(8).text('Prepared by', 22, y + 5)
  pdf.text('Document record', 120, y + 5)
  pdf.save(`${voucherTitle(voucher)}.pdf`)
}

export async function downloadVoucherDocx(voucher) {
  const rows = [
    new TableRow({ children: ['Description', 'Quantity', 'Amount'].map((value) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: value, bold: true })] })] })) }),
    ...(voucher.particulars || []).map((item) => new TableRow({ children: [item.name || 'N/A', String(item.quantity || 0), money(item.amount)].map((value) => new TableCell({ children: [new Paragraph(String(value))] })) }))
  ]
  const docxDocument = new Document({ sections: [{ children: [
    new Paragraph({ alignment: 'center', children: [new TextRun({ text: 'SABI MICROFINANCE BANK', bold: true, size: 28 })] }),
    new Paragraph({ alignment: 'center', children: [new TextRun({ text: 'CASH PAYMENT VOUCHER', bold: true, size: 22 })] }),
    new Paragraph(`PV number: ${voucher.pvNO || 'N/A'}`),
    new Paragraph(`Payee: ${voucher.payee || 'N/A'}`),
    new Paragraph(`Department: ${voucher.department?.name || voucher.departmentName || 'N/A'}`),
    new Paragraph(`Date: ${dateValue(voucher.createdAt)}`),
    new Paragraph(`Status: ${voucher.status || 'Draft'}`),
    new Paragraph(''),
    new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }),
    new Paragraph(''),
    new Paragraph({ children: [new TextRun({ text: `TOTAL: ${money(voucher.totalAmount)}`, bold: true })] }),
    new Paragraph(`Amount in words: ${voucher.amountInWords || 'N/A'}`),
    new Paragraph(''),
    new Paragraph({ children: [new TextRun({ text: 'APPROVAL HISTORY', bold: true })] }),
    ...(voucher.approvals || []).map((approval) => new Paragraph(`${approval.stage || 'Stage'} | ${approverName(approval)} | ${approverEmail(approval)} | ${approvalLabel(approval)} | ${approvalDate(approval)}`)),
    new Paragraph(''),
    new Paragraph('Prepared by: ____________________    Document record: ____________________')
  ] }] })
  const blob = await Packer.toBlob(docxDocument)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${voucherTitle(voucher)}.docx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
