# Dynamic KPI Target Calculation System

## Overview
The dashboard implements a dynamic KPI target calculation system that adjusts targets based on the user's selected date range. This ensures that targets are proportional to the time period being analyzed.

## Formula
```
KPI Target = (Annual Target ÷ 12) × (Number of months in selected date range)
```

## How It Works

### 1. Annual Target Storage
- Each sales officer has an annual target value stored in the database
- Example: Annual Premium Target = ₱36,000,000

### 2. Monthly Target Calculation
- Monthly Target = Annual Target ÷ 12
- Example: Monthly Premium Target = ₱36,000,000 ÷ 12 = ₱3,000,000

### 3. Dynamic Target Calculation
The system automatically calculates the appropriate target based on the selected date range:

#### Example Scenarios:

**January–December (Full Year)**
- Months in range: 12
- KPI Target = ₱3,000,000 × 12 = ₱36,000,000

**September–December (4 months)**
- Months in range: 4
- KPI Target = ₱3,000,000 × 4 = ₱12,000,000

**August–December (5 months)**
- Months in range: 5
- KPI Target = ₱3,000,000 × 5 = ₱15,000,000

**Single Month (e.g., January)**
- Months in range: 1
- KPI Target = ₱3,000,000 × 1 = ₱3,000,000

## Implementation Details

### Date Range Calculation
The system uses the `calculateMonthsInRange` function to count months inclusively:
```typescript
const calculateMonthsInRange = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 12 // Default to full year
  
  const start = new Date(startDate)
  const end = new Date(endDate)
  const yearDiff = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()
  
  return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
}
```

### Target Calculation Logic
```typescript
// Monthly mode: Annual Target ÷ 12 × number of months in range
const monthlyTarget = annualTarget / 12
const dynamicTarget = Math.round(monthlyTarget * monthsInRange * 100) / 100
```

### KPI Types Supported
- **Premium**: Financial targets (₱)
- **Sales Counselor**: Count targets (number)
- **Policy Sold**: Count targets (number)
- **Agency Coop**: Count targets (number)

## User Interface

### Default Behavior
- **Initial Load**: August–December range (5 months)
- **Clear Dates**: Full year range (12 months)
- **Custom Range**: User-selected date range

### Filter Controls
- **Start Date**: Beginning of the analysis period
- **End Date**: End of the analysis period
- **Clear Dates**: Resets to full year (January–December)
- **Apply Filter**: Updates KPI targets based on selected range

## Debug Information
The system provides detailed console logging for verification:
```javascript
console.log("[v0] Dynamic KPI Target Calculation:", {
  formula: "KPI Target = (Annual Target ÷ 12) × (Number of months in selected date range)",
  annualTarget: 36000000,
  monthlyTarget: "36000000 ÷ 12 = 3000000",
  monthsInRange: "5 months in selected range",
  calculation: "3000000 × 5 = 15000000",
  finalTarget: 15000000,
  dateRange: "2025-08-01 to 2025-12-31"
})
```

## Benefits
1. **Proportional Targets**: Targets scale with the time period
2. **Fair Comparison**: Enables fair performance comparison across different time periods
3. **Flexible Analysis**: Users can analyze any date range with appropriate targets
4. **Consistent Logic**: Same calculation method for all KPI types
5. **Real-time Updates**: Targets update immediately when date range changes

## Testing Scenarios
1. **Full Year (Jan-Dec)**: Should show monthly × 12
2. **Quarter (Oct-Dec)**: Should show monthly × 3
3. **Half Year (Jul-Dec)**: Should show monthly × 6
4. **Single Month**: Should show monthly × 1
5. **Custom Range**: Should show monthly × (calculated months)

## Technical Notes
- All calculations are rounded to 2 decimal places for precision
- The system handles edge cases (empty dates, invalid ranges)
- Monthly and weekly budget targets remain fixed (not affected by date range)
- The calculation is performed in real-time when filters are applied



