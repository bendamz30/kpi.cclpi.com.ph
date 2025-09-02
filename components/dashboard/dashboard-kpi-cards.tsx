export interface KPIData {
  premiumActual: number
  premiumTarget: number
  salesCounselorActual: number
  salesCounselorTarget: number
  policySoldActual: number
  policySoldTarget: number
  agencyCoopActual: number
  agencyCoopTarget: number
}

interface KPICardsProps {
  data: KPIData
  loading?: boolean
  startDate?: string
  endDate?: string
  granularity?: string
}

export function DashboardKPICards({ data, loading, startDate, endDate, granularity }: KPICardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-2 bg-gray-200 rounded w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  const calculateMonthsInRange = () => {
    if (!startDate || !endDate) return 12 // Default to full year if no range specified

    const start = new Date(startDate)
    const end = new Date(endDate)

    const yearDiff = end.getFullYear() - start.getFullYear()
    const monthDiff = end.getMonth() - start.getMonth()

    return Math.max(1, yearDiff * 12 + monthDiff + 1) // +1 to include both start and end months
  }

  const calculateBudget = (annualTarget: number) => {
    if (!annualTarget) return 0

    const monthsInRange = calculateMonthsInRange()

    if (granularity === "Monthly") {
      const monthlyTarget = annualTarget / 12
      return monthlyTarget * monthsInRange
    } else if (granularity === "Weekly") {
      const weeklyTarget = annualTarget / 48
      const weeksInRange = monthsInRange * 4 // Approximate weeks per month
      return weeklyTarget * weeksInRange
    }

    return annualTarget // Default to annual target
  }

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0
    return Math.min((actual / target) * 100, 100)
  }

  const calculateVariance = (actual: number, target: number) => {
    if (target === 0) return 0
    return ((actual - target) / target) * 100
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const safeData = {
    premiumActual: data?.premiumActual || 0,
    premiumTarget: data?.premiumTarget || 0,
    salesCounselorActual: data?.salesCounselorActual || 0,
    salesCounselorTarget: data?.salesCounselorTarget || 0,
    policySoldActual: data?.policySoldActual || 0,
    policySoldTarget: data?.policySoldTarget || 0,
    agencyCoopActual: data?.agencyCoopActual || 0,
    agencyCoopTarget: data?.agencyCoopTarget || 0,
  }

  const kpiItems = [
    {
      title: "Premium",
      actual: safeData.premiumActual,
      target: safeData.premiumTarget,
      budget: calculateBudget(safeData.premiumTarget * 12), // Convert monthly target back to annual for calculation
      format: formatCurrency,
      color: "bg-blue-500",
    },
    {
      title: "Sales Counselor",
      actual: safeData.salesCounselorActual,
      target: safeData.salesCounselorTarget,
      budget: calculateBudget(safeData.salesCounselorTarget * 12),
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-emerald-500",
    },
    {
      title: "Policy Sold",
      actual: safeData.policySoldActual,
      target: safeData.policySoldTarget,
      budget: calculateBudget(safeData.policySoldTarget * 12),
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-amber-500",
    },
    {
      title: "Agency Coop",
      actual: safeData.agencyCoopActual,
      target: safeData.agencyCoopTarget,
      budget: calculateBudget(safeData.agencyCoopTarget * 12),
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiItems.map((item) => {
        const percentage = calculatePercentage(item.actual, item.target)
        const variance = calculateVariance(item.actual, item.target)
        const isPositive = variance >= 0

        return (
          <div key={item.title} className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{item.title}</h3>
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-gray-900">{item.format(item.actual)}</span>
                <span className="text-sm text-gray-500">/ {item.format(item.target)}</span>
              </div>

              <div className="text-xs text-gray-600">Budget: {item.format(item.budget)}</div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{percentage.toFixed(1)}% Complete</span>
                <span className={`font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}
                  {variance.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
