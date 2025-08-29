// Mock data for the sales dashboard system - aligned with JSON backend structure
export interface User {
  userId: number
  name: string
  email: string
  passwordHash: string
  role: "Admin" | "Viewer" | "RegionalUser"
  regionId?: number | null
  createdAt: string
  updatedAt: string | null
}

export interface Area {
  areaId: number
  areaName: string
}

export interface Region {
  regionId: number
  regionName: string
  areaId: number
}

export interface SalesType {
  salesTypeId: number
  typeName: string
}

export interface SalesRepresentative {
  salesRepId: number
  name: string
  userId?: number | null
  regionId: number
  salesTypeId: number
  createdAt: string
  updatedAt: string | null
}

export interface SalesTarget {
  targetId: number
  salesRepId: number
  year: number
  premiumTarget: number
  salesCounselorTarget: number
  policySoldTarget: number
  agencyCoopTarget: number
  createdBy: number
  createdAt: string
  updatedAt: string | null
}

export interface SalesReport {
  reportId: number
  salesRepId: number
  reportDate: string
  premiumActual: number
  salesCounselorActual: number
  policySoldActual: number
  agencyCoopActual: number
  createdBy: number
  createdAt: string
  updatedAt: string | null
}

export const mockUsers: User[] = [
  {
    userId: 1,
    name: "System Admin",
    email: "admin@example.com",
    passwordHash: "PLEASE_REPLACE_WITH_HASH",
    role: "Admin",
    regionId: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    userId: 2,
    name: "Viewer User",
    email: "viewer@example.com",
    passwordHash: "PLEASE_REPLACE_WITH_HASH",
    role: "Viewer",
    regionId: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    userId: 3,
    name: "Regional User",
    email: "regional@example.com",
    passwordHash: "PLEASE_REPLACE_WITH_HASH",
    role: "RegionalUser",
    regionId: 10,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
]

export const mockAreas: Area[] = [
  { areaId: 1, areaName: "Luzon" },
  { areaId: 2, areaName: "Visayas" },
  { areaId: 3, areaName: "Mindanao" },
]

export const mockRegions: Region[] = [
  { regionId: 1, regionName: "NCR", areaId: 1 },
  { regionId: 10, regionName: "Region 10", areaId: 3 },
  { regionId: 7, regionName: "Central Visayas", areaId: 2 },
]

export const mockSalesTypes: SalesType[] = [
  { salesTypeId: 1, typeName: "Traditional" },
  { salesTypeId: 2, typeName: "Hybrid" },
]

export const mockSalesReps: SalesRepresentative[] = [
  {
    salesRepId: 101,
    name: "Jazcyl M. Periodico",
    userId: null,
    regionId: 10,
    salesTypeId: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    salesRepId: 102,
    name: "Maria Santos",
    userId: null,
    regionId: 1,
    salesTypeId: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    salesRepId: 103,
    name: "Juan dela Cruz",
    userId: null,
    regionId: 7,
    salesTypeId: 2,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
]

export const mockSalesTargets: SalesTarget[] = [
  {
    targetId: 201,
    salesRepId: 101,
    year: 2025,
    premiumTarget: 12000000.0,
    salesCounselorTarget: 165,
    policySoldTarget: 1362,
    agencyCoopTarget: 12,
    createdBy: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    targetId: 202,
    salesRepId: 102,
    year: 2025,
    premiumTarget: 8000000.0,
    salesCounselorTarget: 120,
    policySoldTarget: 960,
    agencyCoopTarget: 8,
    createdBy: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
  {
    targetId: 203,
    salesRepId: 103,
    year: 2025,
    premiumTarget: 10000000.0,
    salesCounselorTarget: 140,
    policySoldTarget: 1200,
    agencyCoopTarget: 10,
    createdBy: 1,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: null,
  },
]

export const mockSalesReports: SalesReport[] = [
  {
    reportId: 301,
    salesRepId: 101,
    reportDate: "2025-08-01",
    premiumActual: 1200000.0,
    salesCounselorActual: 12,
    policySoldActual: 100,
    agencyCoopActual: 1,
    createdBy: 1,
    createdAt: "2025-08-01T08:00:00Z",
    updatedAt: null,
  },
  {
    reportId: 302,
    salesRepId: 102,
    reportDate: "2025-08-01",
    premiumActual: 850000.0,
    salesCounselorActual: 8,
    policySoldActual: 75,
    agencyCoopActual: 1,
    createdBy: 1,
    createdAt: "2025-08-01T08:00:00Z",
    updatedAt: null,
  },
  {
    reportId: 303,
    salesRepId: 103,
    reportDate: "2025-08-01",
    premiumActual: 950000.0,
    salesCounselorActual: 10,
    policySoldActual: 85,
    agencyCoopActual: 1,
    createdBy: 1,
    createdAt: "2025-08-01T08:00:00Z",
    updatedAt: null,
  },
]

export function calculateMonthlyTarget(annualTarget: number): number {
  return annualTarget / 12
}

export function calculateWeeklyTarget(annualTarget: number): number {
  return annualTarget / 52
}

export function calculateVariance(actual: number, target: number): number {
  return target - actual
}

export function calculatePercentage(actual: number, target: number): number {
  return target > 0 ? (actual / target) * 100 : 0
}

export const users = mockUsers
