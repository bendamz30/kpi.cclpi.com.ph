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
      color: "#013f99",
      accentColor: "#4cb1e9",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
    },
    {
      title: "Sales Counselor",
      actual: safeData.salesCounselorActual,
      target: safeData.salesCounselorTarget,
      budgetMonthly: safeData.salesCounselorBudgetMonthly,
      budgetWeekly: safeData.salesCounselorBudgetWeekly,
      format: formatNumber,
      color: "#013f99",
      accentColor: "#4cb1e9",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
    },
    {
      title: "Policy Sold",
      actual: safeData.policySoldActual,
      target: safeData.policySoldTarget,
      budgetMonthly: safeData.policySoldBudgetMonthly,
      budgetWeekly: safeData.policySoldBudgetWeekly,
      format: formatNumber,
      color: "#013f99",
      accentColor: "#4cb1e9",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
    },
    {
      title: "Agency Coop",
      actual: safeData.agencyCoopActual,
      target: safeData.agencyCoopTarget,
      budgetMonthly: safeData.agencyCoopBudgetMonthly,
      budgetWeekly: safeData.agencyCoopBudgetWeekly,
      format: formatNumber,
      color: "#013f99",
      accentColor: "#4cb1e9",
      bgColor: "#f8fafc",
      borderColor: "#e2e8f0",
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
          <div 
            key={item.title} 
            className="rounded-xl p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] border-2"
            style={{ 
              backgroundColor: item.bgColor,
              borderColor: item.borderColor
            }}
          >
            {/* Header with title and status indicator */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 truncate leading-tight flex items-center">
                <div className="w-1 h-6 rounded-full mr-3" style={{ backgroundColor: item.color }}></div>
                {item.title}
              </h3>
              <div className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: item.accentColor }}></div>
            </div>

            {/* Main value display */}
            <div className="mb-4">
              <div className="flex flex-col gap-1">
                <span className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 truncate leading-tight">
                  {item.format(item.actual)}
                </span>
                <span className="text-sm sm:text-base text-gray-600 font-medium leading-tight">
                  / {item.format(item.target)}
                </span>
              </div>
            </div>

            {/* Target breakdown */}
            <div className="mb-4 space-y-2 p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-semibold">Monthly Target:</span>
                <span className="font-bold text-gray-900 text-sm truncate ml-2">{item.format(item.budgetMonthly)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-semibold">Weekly Target:</span>
                <span className="font-bold text-gray-900 text-sm truncate ml-2">{item.format(item.budgetWeekly)}</span>
              </div>
            </div>

            {/* Progress section */}
            <div className="space-y-3">
              <div className="text-sm font-bold text-gray-800 leading-tight">Progress</div>

              {/* Progress bar */}
              <div className="w-full rounded-full h-3 shadow-inner bg-white">
                <div
                  className="h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                  style={{ 
                    width: `${Math.min(percentage, 100)}%`,
                    background: `linear-gradient(90deg, ${item.color} 0%, ${item.accentColor} 100%)`
                  }}
                ></div>
              </div>

              {/* Progress percentage and variance */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold leading-tight" style={{ color: item.color }}>
                  {formatNumber(percentage)}%
                </span>
                <span className={`text-sm font-bold leading-tight ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}
                  {formatNumber(variance)}%
                </span>
              </div>

              {/* Variance badge */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800 leading-tight">Variance</span>
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                    isPositive 
                      ? "text-green-800" 
                      : "text-red-800"
                  }`}
                  style={{
                    backgroundColor: isPositive 
                      ? '#dcfce7' 
                      : '#fecaca'
                  }}
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
