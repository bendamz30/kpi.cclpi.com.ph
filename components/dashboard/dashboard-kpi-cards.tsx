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

  const formatNumber = (value: number): string => {
    // Format to 2 decimal places and remove .00 if it's a whole number
    const formatted = value.toFixed(2)
    return formatted.endsWith('.00') ? formatted.slice(0, -3) : formatted
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
      format: formatNumber,
      color: "bg-emerald-500",
    },
    {
      title: "Policy Sold",
      actual: safeData.policySoldActual,
      target: safeData.policySoldTarget,
      budgetMonthly: safeData.policySoldBudgetMonthly,
      budgetWeekly: safeData.policySoldBudgetWeekly,
      format: formatNumber,
      color: "bg-amber-500",
    },
    {
      title: "Agency Coop",
      actual: safeData.agencyCoopActual,
      target: safeData.agencyCoopTarget,
      budgetMonthly: safeData.agencyCoopBudgetMonthly,
      budgetWeekly: safeData.agencyCoopBudgetWeekly,
      format: formatNumber,
      color: "bg-purple-500",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {kpiItems.map((item) => {
        const percentage = calculatePercentage(item.actual, item.target)
        const variance = calculateVariance(item.actual, item.target)
        const absoluteVariance = calculateAbsoluteVariance(item.actual, item.target)
        const isPositive = variance >= 0

        return (
          <div key={item.title} className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
              <h3 className="text-xs sm:text-sm lg:text-base font-semibold text-gray-800 truncate leading-tight">{item.title}</h3>
              <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${item.color} flex-shrink-0 shadow-sm`}></div>
            </div>

            <div className="mb-2 sm:mb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-base sm:text-lg lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate leading-tight">{item.format(item.actual)}</span>
                <span className="text-xs sm:text-sm lg:text-base text-gray-500 font-medium leading-tight">/ {item.format(item.target)}</span>
              </div>
            </div>

            <div className="mb-2 sm:mb-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium leading-tight">Monthly Target:</span>
                <span className="font-semibold text-gray-900 text-xs truncate ml-1">{item.format(item.budgetMonthly)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium leading-tight">Weekly Target:</span>
                <span className="font-semibold text-gray-900 text-xs truncate ml-1">{item.format(item.budgetWeekly)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-gray-700 leading-tight">Progress</div>

              <div className="w-full bg-gray-100 rounded-full h-2 shadow-inner">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ease-out ${item.color} shadow-sm`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 font-medium leading-tight">{formatNumber(percentage)}%</span>
                <span className={`text-xs font-semibold leading-tight ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}
                  {formatNumber(variance)}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700 leading-tight">Variance</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
                    isPositive ? "bg-emerald-100 text-emerald-800 border border-emerald-200" : "bg-red-100 text-red-800 border border-red-200"
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
