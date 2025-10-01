import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export interface ExportData {
  area: string
  actual: number
  annualTarget: number
  budgetPerMonth: number
  achievement: number
  variance: number
}

export interface ExportTotals {
  area: string
  actual: number
  annualTarget: number
  budgetPerMonth: number
  achievement: number
  variance: number
}

export interface ExportSummary {
  areaSummaries: ExportData[]
  totals: ExportTotals
  monthsInRange: number
  filters: {
    startDate?: string
    endDate?: string
    area?: string
    region?: string
    salesRepId?: number
    salesType?: string
  }
}

// Format numbers for display
const formatNumber = (value: number, isPremium: boolean = true): string => {
  if (isPremium) {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  } else {
    return new Intl.NumberFormat("en-PH").format(value)
  }
}

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// Generate filename with current date and filters
const generateFilename = (type: 'pdf' | 'xlsx', filters: ExportSummary['filters']): string => {
  const now = new Date()
  const dateStr = now.toISOString().split('T')[0]
  
  let filterStr = ''
  if (filters.startDate && filters.endDate) {
    filterStr += `_${filters.startDate}_to_${filters.endDate}`
  }
  if (filters.area) {
    filterStr += `_${filters.area.replace(/\s+/g, '_')}`
  }
  if (filters.region) {
    filterStr += `_${filters.region.replace(/\s+/g, '_')}`
  }
  
  return `CCLPI_Summary_By_Area${filterStr}_${dateStr}.${type}`
}

// Export to PDF
export const exportToPDF = (data: ExportSummary, selectedMetric: string = 'premium') => {
  const doc = new jsPDF('l', 'mm', 'a4') // landscape orientation
  
  // Add title
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('CCLPI Plans Dashboard - Summary by Area', 14, 20)
  
  // Add subtitle with date range
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let subtitle = 'Sales Performance Summary'
  if (data.filters.startDate && data.filters.endDate) {
    subtitle += ` (${data.filters.startDate} to ${data.filters.endDate})`
  }
  doc.text(subtitle, 14, 30)
  
  // Add filters info
  let filterInfo = []
  if (data.filters.area) filterInfo.push(`Area: ${data.filters.area}`)
  if (data.filters.region) filterInfo.push(`Region: ${data.filters.region}`)
  if (data.filters.salesType) filterInfo.push(`Sales Type: ${data.filters.salesType}`)
  
  if (filterInfo.length > 0) {
    doc.setFontSize(8)
    doc.text(`Filters: ${filterInfo.join(' | ')}`, 14, 40)
  }
  
  // Prepare table data
  const isPremium = selectedMetric === 'premium'
  const tableData = data.areaSummaries.map(item => [
    item.area,
    formatNumber(item.actual, isPremium),
    formatNumber(item.annualTarget, isPremium),
    formatNumber(item.budgetPerMonth, isPremium),
    formatPercentage(item.achievement),
    formatNumber(item.variance, isPremium)
  ])
  
  // Add totals row
  tableData.push([
    data.totals.area,
    formatNumber(data.totals.actual, isPremium),
    formatNumber(data.totals.annualTarget, isPremium),
    formatNumber(data.totals.budgetPerMonth, isPremium),
    formatPercentage(data.totals.achievement),
    formatNumber(data.totals.variance, isPremium)
  ])
  
  // Create table
  autoTable(doc, {
    startY: 50,
    head: [['Area', 'Actual', 'Annual Target', 'Budget/Month', 'Achievement %', 'Variance']],
    body: tableData,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [1, 63, 153], // Primary brand color #013f99
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    columnStyles: {
      0: { cellWidth: 30 }, // Area
      1: { cellWidth: 25, halign: 'right' }, // Actual
      2: { cellWidth: 25, halign: 'right' }, // Annual Target
      3: { cellWidth: 25, halign: 'right' }, // Budget/Month
      4: { cellWidth: 20, halign: 'right' }, // Achievement
      5: { cellWidth: 25, halign: 'right' }, // Variance
    },
    didDrawPage: (data) => {
      // Add footer
      doc.setFontSize(8)
      doc.setFont('helvetica', 'italic')
      doc.text(
        `Generated on ${new Date().toLocaleString()} | CCLPI Plans Dashboard`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      )
    }
  })
  
  // Save the PDF
  const filename = generateFilename('pdf', data.filters)
  doc.save(filename)
}

// Export to Excel
export const exportToExcel = (data: ExportSummary, selectedMetric: string = 'premium') => {
  const isPremium = selectedMetric === 'premium'
  
  // Prepare worksheet data
  const worksheetData = [
    // Header row
    ['CCLPI Plans Dashboard - Summary by Area'],
    ['Sales Performance Summary'],
    []
  ]
  
  // Add filters info
  if (data.filters.startDate && data.filters.endDate) {
    worksheetData.push([`Date Range: ${data.filters.startDate} to ${data.filters.endDate}`])
  }
  if (data.filters.area) {
    worksheetData.push([`Area: ${data.filters.area}`])
  }
  if (data.filters.region) {
    worksheetData.push([`Region: ${data.filters.region}`])
  }
  if (data.filters.salesType) {
    worksheetData.push([`Sales Type: ${data.filters.salesType}`])
  }
  
  worksheetData.push([]) // Empty row
  
  // Table headers
  worksheetData.push([
    'Area',
    'Actual',
    'Annual Target',
    'Budget/Month',
    'Achievement %',
    'Variance'
  ])
  
  // Table data
  data.areaSummaries.forEach(item => {
    worksheetData.push([
      item.area,
      item.actual.toString(),
      item.annualTarget.toString(),
      item.budgetPerMonth.toString(),
      item.achievement.toString(),
      item.variance.toString()
    ])
  })
  
  // Totals row
  worksheetData.push([
    data.totals.area,
    data.totals.actual.toString(),
    data.totals.annualTarget.toString(),
    data.totals.budgetPerMonth.toString(),
    data.totals.achievement.toString(),
    data.totals.variance.toString()
  ])
  
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // Area
    { wch: 20 }, // Actual
    { wch: 20 }, // Annual Target
    { wch: 20 }, // Budget/Month
    { wch: 15 }, // Achievement
    { wch: 20 }  // Variance
  ]
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Summary by Area')
  
  // Generate and save file
  const filename = generateFilename('xlsx', data.filters)
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, filename)
}
