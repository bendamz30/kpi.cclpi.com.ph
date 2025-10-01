import { useState, useEffect, useCallback } from 'react';
import apiService from '@/lib/api';

// Custom hook for API data fetching with loading and error states
export function useApi(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const {
    immediate = true,
    dependencies = [],
    transform = (data) => data,
  } = options;

  const fetchData = useCallback(async () => {
    if (!immediate) return;

    setLoading(true);
    setError(null);

    try {
      let result;
      
      // Handle different endpoint types
      if (typeof endpoint === 'function') {
        result = await endpoint();
      } else if (endpoint.startsWith('/sales')) {
        result = await apiService.getSales();
      } else if (endpoint.startsWith('/sales-reports')) {
        result = await apiService.getSalesReports();
      } else if (endpoint.startsWith('/users')) {
        result = await apiService.getUsers();
      } else if (endpoint.startsWith('/sales-targets')) {
        result = await apiService.getSalesTargets();
      } else if (endpoint.startsWith('/areas')) {
        result = await apiService.getAreas();
      } else if (endpoint.startsWith('/sales-types')) {
        result = await apiService.getSalesTypes();
      } else if (endpoint.startsWith('/regions')) {
        result = await apiService.getRegions();
      } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
      }

      const transformedData = transform(result);
      setData(transformedData);
    } catch (err) {
      console.error('API fetch error:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [endpoint, immediate, transform, refetchTrigger, ...dependencies]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
}

// Hook for sales data specifically
export function useSales() {
  return useApi('/sales', {
    transform: (response) => {
      // Handle Laravel API response format
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for sales reports data
export function useSalesReports() {
  return useApi('/sales-reports', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for users data
export function useUsers() {
  return useApi('/users', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for sales targets data
export function useSalesTargets() {
  return useApi('/sales-targets', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for areas data
export function useAreas() {
  return useApi('/areas', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for sales types data
export function useSalesTypes() {
  return useApi('/sales-types', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for regions data
export function useRegions() {
  return useApi('/regions', {
    transform: (response) => {
      if (response && response.data) {
        return response.data;
      }
      return response || [];
    }
  });
}

// Hook for merged reports (combines multiple API calls)
export function useMergedReports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false to not block auth
  const [error, setError] = useState(null);

  const fetchMergedReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const urls = [
        apiService.getSales(), // Use sales endpoint instead of sales-reports
        apiService.getUsers(),
        apiService.getSalesTargets(),
        apiService.getAreas(),
        apiService.getRegions(),
        apiService.getSalesTypes(),
      ];
      
      const fetchMergedReports = async (urls, batchSize = 3) => {
        const results = []
        for (let i = 0; i < urls.length; i += batchSize) {
          const batch = urls.slice(i, i + batchSize)
          // run batch in parallel, but limit the batch size
          const batchResults = await Promise.all(
            batch.map(async (u) => {
              try { return await u }
              catch (e) { 
                console.warn('API call failed:', e);
                return { __error: String(e) } 
              }
            })
          )
          results.push(...batchResults)
          // small pause between batches
          await new Promise(r => setTimeout(r, 150))
        }
        return results
      }
      
      const results = await fetchMergedReports(urls);
      const [salesReportsRes, usersRes, targetsRes, areasRes, regionsRes, salesTypesRes] = results;

      const salesReports = Array.isArray(salesReportsRes?.data) ? salesReportsRes.data : 
                          Array.isArray(salesReportsRes) ? salesReportsRes : [];
      const users = Array.isArray(usersRes?.data) ? usersRes.data : 
                   Array.isArray(usersRes) ? usersRes : [];
      const targets = Array.isArray(targetsRes?.data) ? targetsRes.data : 
                     Array.isArray(targetsRes) ? targetsRes : [];
      const areas = Array.isArray(areasRes?.data) ? areasRes.data : 
                   Array.isArray(areasRes) ? areasRes : [];
      const regions = Array.isArray(regionsRes?.data) ? regionsRes.data : 
                     Array.isArray(regionsRes) ? regionsRes : [];
      const salesTypes = Array.isArray(salesTypesRes?.data) ? salesTypesRes.data : 
                        Array.isArray(salesTypesRes) ? salesTypesRes : [];

      const mergedReports = Array.isArray(salesReports)
        ? salesReports.map((report) => {
        const user = users.find((u) => Number(u.userId) === Number(report.salesRepId));
        const reportYear = new Date(report.reportDate).getFullYear();
        const target = targets.find(
          (t) => Number(t.salesRepId) === Number(report.salesRepId) && Number(t.year) === reportYear,
        );
        const area = areas.find((a) => Number(a.areaId) === Number(user?.areaId));
        const region = regions.find((r) => Number(r.regionId) === Number(user?.regionId));
        const salesType = salesTypes.find((st) => Number(st.salesTypeId) === Number(user?.salesTypeId));

        return {
          ...report,
          areaId: Number(user?.areaId) || 0,
          regionId: Number(user?.regionId) || 0,
          salesTypeId: Number(user?.salesTypeId) || 0,
          areaName: area?.areaName || "Unknown",
          regionName: region?.regionName || "Unknown",
          salesTypeName: salesType?.salesTypeName || "Unknown",
          userName: user?.name || "Unknown",
          premiumTarget: 0,
          salesCounselorTarget: 0,
          policySoldTarget: 0,
          agencyCoopTarget: 0,
          _annualPremiumTarget: Number(target?.premiumTarget) || 0,
          _annualSalesCounselorTarget: Number(target?.salesCounselorTarget) || 0,
          _annualPolicySoldTarget: Number(target?.policySoldTarget) || 0,
          _annualAgencyCoopTarget: Number(target?.agencyCoopTarget) || 0,
        };
        })
        : [];

      // Add placeholder reports for users who have targets but no actual reports
      const usersWithTargetsOnly = Array.isArray(users) ? users.filter((user) => {
        const hasReports = Array.isArray(salesReports) ? salesReports.some((report) => Number(report.salesRepId) === Number(user.userId)) : false;
        const hasTargets = Array.isArray(targets) ? targets.some((target) => Number(target.salesRepId) === Number(user.userId)) : false;
        return !hasReports && hasTargets && user.role === "RegionalUser";
      }) : [];

      const placeholderReports = Array.isArray(usersWithTargetsOnly) ? usersWithTargetsOnly.map((user) => {
        const target = Array.isArray(targets) ? targets.find((t) => Number(t.salesRepId) === Number(user.userId)) : null;
        const area = Array.isArray(areas) ? areas.find((a) => Number(a.areaId) === Number(user.areaId)) : null;
        const region = Array.isArray(regions) ? regions.find((r) => Number(r.regionId) === Number(user.regionId)) : null;
        const salesType = Array.isArray(salesTypes) ? salesTypes.find((st) => Number(st.salesTypeId) === Number(user.salesTypeId)) : null;

        return {
          reportId: `placeholder-${user.userId}`,
          salesRepId: Number(user.userId),
          reportDate: new Date().toISOString().split('T')[0],
          premiumActual: 0,
          salesCounselorActual: 0,
          policySoldActual: 0,
          agencyCoopActual: 0,
          areaId: Number(user.areaId) || 0,
          regionId: Number(user.regionId) || 0,
          salesTypeId: Number(user.salesTypeId) || 0,
          areaName: area?.areaName || "Unknown",
          regionName: region?.regionName || "Unknown",
          salesTypeName: salesType?.salesTypeName || "Unknown",
          userName: user.name || "Unknown",
          premiumTarget: 0,
          salesCounselorTarget: 0,
          policySoldTarget: 0,
          agencyCoopTarget: 0,
          _annualPremiumTarget: Number(target?.premiumTarget) || 0,
          _annualSalesCounselorTarget: Number(target?.salesCounselorTarget) || 0,
          _annualPolicySoldTarget: Number(target?.policySoldTarget) || 0,
          _annualAgencyCoopTarget: Number(target?.agencyCoopTarget) || 0,
        };
      }) : [];

      setData([...mergedReports, ...placeholderReports]);
    } catch (err) {
      console.error('Error fetching merged reports:', err);
      setError(err.message || 'Failed to fetch merged reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Add a timeout to prevent blocking authentication
    const timeoutId = setTimeout(() => {
      console.log('useMergedReports timeout - setting loading to false');
      setLoading(false);
    }, 5000); // 5 second timeout

    fetchMergedReports();

    return () => clearTimeout(timeoutId);
  }, [fetchMergedReports]);

  return {
    data,
    loading,
    error,
    refetch: fetchMergedReports,
  };
}
