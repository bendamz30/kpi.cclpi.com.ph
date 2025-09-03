export interface KPIData {
  premiumActual: number
  premiumTarget: number
  premiumBudgetMonthly: number
  premiumBudgetWeekly: number
  salesCounselorActual: number
  salesCounselorTarget: number
  salesCounselorBudgetMonthly: number
  salesCounselorBudgetWeekly: number
  policySoldActual: number
  policySoldTarget: number
  policySoldBudgetMonthly: number
  policySoldBudgetWeekly: number
  agencyCoopActual: number
  agencyCoopTarget: number
  agencyCoopBudgetMonthly: number
  agencyCoopBudgetWeekly: number
}

interface KPICardsProps {
  data: KPIData
  loading?: boolean
}

export function DashboardKPICards({ data, loading }: KPICardsProps) {
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

  const calculatePercentage = (actual: number, target: number) => {
    if (target === 0) return 0
    return (actual / target) * 100
  }

  const calculateVariance = (actual: number, target: number) => {
    if (target === 0) return 0
    return ((actual - target) / target) * 100
  }

  const calculateAbsoluteVariance = (actual: number, target: number) => {
    return actual - target
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatVarianceNumber = (amount: number) => {
    return new Intl.NumberFormat("en-US").format(amount)
  }

  const safeData = {
    premiumActual: data?.premiumActual || 0,
    premiumTarget: data?.premiumTarget || 0,
    premiumBudgetMonthly: data?.premiumBudgetMonthly || 0,
    premiumBudgetWeekly: data?.premiumBudgetWeekly || 0,
    salesCounselorActual: data?.salesCounselorActual || 0,
    salesCounselorTarget: data?.salesCounselorTarget || 0,
    salesCounselorBudgetMonthly: data?.salesCounselorBudgetMonthly || 0,
    salesCounselorBudgetWeekly: data?.salesCounselorBudgetWeekly || 0,
    policySoldActual: data?.policySoldActual || 0,
    policySoldTarget: data?.policySoldTarget || 0,
    policySoldBudgetMonthly: data?.policySoldBudgetMonthly || 0,
    policySoldBudgetWeekly: data?.policySoldBudgetWeekly || 0,
    agencyCoopActual: data?.agencyCoopActual || 0,
    agencyCoopTarget: data?.agencyCoopTarget || 0,
    agencyCoopBudgetMonthly: data?.agencyCoopBudgetMonthly || 0,
    agencyCoopBudgetWeekly: data?.agencyCoopBudgetWeekly || 0,
  }

  const kpiItems = [
    {
      title: "Premium",
      actual: safeData.premiumActual,
      target: safeData.premiumTarget,
      budgetMonthly: safeData.premiumBudgetMonthly,
      budgetWeekly: safeData.premiumBudgetWeekly,
      format: formatCurrency,
      color: "bg-blue-500",
    },
    {
      title: "Sales Counselor",
      actual: safeData.salesCounselorActual,
      target: safeData.salesCounselorTarget,
      budgetMonthly: safeData.salesCounselorBudgetMonthly,
      budgetWeekly: safeData.salesCounselorBudgetWeekly,
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-emerald-500",
    },
    {
      title: "Policy Sold",
      actual: safeData.policySoldActual,
      target: safeData.policySoldTarget,
      budgetMonthly: safeData.policySoldBudgetMonthly,
      budgetWeekly: safeData.policySoldBudgetWeekly,
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-amber-500",
    },
    {
      title: "Agency Coop",
      actual: safeData.agencyCoopActual,
      target: safeData.agencyCoopTarget,
      budgetMonthly: safeData.agencyCoopBudgetMonthly,
      budgetWeekly: safeData.agencyCoopBudgetWeekly,
      format: (val: number) => (val ?? 0).toString(),
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiItems.map((item) => {
        const percentage = calculatePercentage(item.actual, item.target)
        const variance = calculateVariance(item.actual, item.target)
        const absoluteVariance = calculateAbsoluteVariance(item.actual, item.target)
        const isPositive = variance >= 0

        return (
          <div key={item.title} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-medium text-gray-700">{item.title}</h3>
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-gray-900">{item.format(item.actual)}</span>
                <span className="text-lg text-gray-400">/ {item.format(item.target)}</span>
              </div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly Budget:</span>
                <span className="font-medium text-gray-900">{item.format(item.budgetMonthly)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Weekly Budget:</span>
                <span className="font-medium text-gray-900">{item.format(item.budgetWeekly)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-600">Progress</div>

              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${item.color}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{percentage.toFixed(2)}%</span>
                <span className={`text-sm font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}
                  {variance.toFixed(2)}%
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-gray-600">Variance</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isPositive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatVarianceNumber(absoluteVariance)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
