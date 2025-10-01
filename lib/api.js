// API service for communicating with Laravel backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic fetch method with error handling
  async fetchData(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const maxRetries = 3
    let attempt = 0
    const headers = Object.assign(
      { Accept: 'application/json', 'Content-Type': 'application/json' },
      options.headers || {}
    )
    while (attempt <= maxRetries) {
      let res;
      try {
        res = await fetch(url, Object.assign({}, options, { headers }));
      } catch (e) {
        throw new Error('Network error: ' + e.message);
      }
      
      // 429 -> retry with exponential backoff
      if (res.status === 429 && attempt < maxRetries) {
        const wait = Math.pow(2, attempt) * 300
        await new Promise(r => setTimeout(r, wait))
        attempt++
        continue
      }
      
      if (!res.ok) {
        let body = '';
        try { 
          body = await res.text(); 
        } catch {}
        throw new Error(`HTTP error! status: ${res.status} body: ${body.slice(0,200)}`);
      }
      
      const ct = res.headers.get('content-type') || ''
      if (!ct.includes('application/json')) {
        let body = '';
        try { 
          body = await res.text(); 
        } catch {}
        throw new Error('Non-JSON response received: ' + body.slice(0,200));
      }
      
      return res.json()
    }
    throw new Error('Too many 429 responses')
  }

  // Sales API methods
  async getSales() {
    return this.fetchData('/sales');
  }

  async getSale(id) {
    return this.fetchData(`/sales/${id}`);
  }

  async createSale(saleData) {
    return this.fetchData('/sales', {
      method: 'POST',
      body: JSON.stringify(saleData),
    });
  }

  async updateSale(id, saleData) {
    return this.fetchData(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(saleData),
    });
  }

  async deleteSale(id) {
    return this.fetchData(`/sales/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales Reports API methods (for compatibility with existing code)
  async getSalesReports() {
    return this.fetchData('/sales-reports');
  }

  async getSalesReport(id) {
    return this.fetchData(`/sales-reports/${id}`);
  }

  async createSalesReport(reportData) {
    return this.fetchData('/sales-reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async updateSalesReport(id, reportData) {
    return this.fetchData(`/sales-reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(reportData),
    });
  }

  async deleteSalesReport(id) {
    return this.fetchData(`/sales-reports/${id}`, {
      method: 'DELETE',
    });
  }

  // Users API methods
  async getUsers() {
    return this.fetchData('/users');
  }

  async getUser(id) {
    return this.fetchData(`/users/${id}`);
  }

  async createUser(userData) {
    return this.fetchData('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.fetchData(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.fetchData(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Sales Targets API methods
  async getSalesTargets() {
    return this.fetchData('/sales-targets');
  }

  // Get dynamic KPI targets for a specific user and date range
  async getDynamicKpiTargets(userId, startDate, endDate, year = new Date().getFullYear()) {
    const params = new URLSearchParams();
    
    // Only add parameters if they have values
    if (startDate) {
      params.append('start', startDate);
    }
    if (endDate) {
      params.append('end', endDate);
    }
    if (year) {
      params.append('year', year.toString());
    }
    
    return this.fetchData(`/users/${userId}/kpi-target?${params}`);
  }

  async getSalesTarget(id) {
    return this.fetchData(`/sales-targets/${id}`);
  }

  async createSalesTarget(targetData) {
    return this.fetchData('/sales-targets', {
      method: 'POST',
      body: JSON.stringify(targetData),
    });
  }

  async updateSalesTarget(id, targetData) {
    return this.fetchData(`/sales-targets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(targetData),
    });
  }

  async deleteSalesTarget(id) {
    return this.fetchData(`/sales-targets/${id}`, {
      method: 'DELETE',
    });
  }

  // Areas API methods
  async getAreas() {
    return this.fetchData('/areas');
  }

  async getArea(id) {
    return this.fetchData(`/areas/${id}`);
  }

  // Sales Types API methods
  async getSalesTypes() {
    return this.fetchData('/sales-types');
  }

  async getSalesType(id) {
    return this.fetchData(`/sales-types/${id}`);
  }

  // Regions API methods (if available)
  async getRegions() {
    try {
      return this.fetchData('/regions');
    } catch (error) {
      // Fallback to mock data if regions endpoint doesn't exist
      console.warn('Regions endpoint not available, using mock data');
      return this.getMockRegions();
    }
  }

  // Mock data fallbacks
  async getMockRegions() {
    return [
      { regionId: 1, regionName: 'NCR' },
      { regionId: 2, regionName: 'Region 1' },
      { regionId: 3, regionName: 'Region 2' },
      { regionId: 4, regionName: 'Region 3' },
      { regionId: 5, regionName: 'Region 4' },
      { regionId: 6, regionName: 'Region 5' },
      { regionId: 7, regionName: 'Region 6' },
      { regionId: 8, regionName: 'Region 7' },
      { regionId: 9, regionName: 'Region 8' },
      { regionId: 10, regionName: 'Region 9' },
      { regionId: 11, regionName: 'Region 10' },
      { regionId: 12, regionName: 'Region 11' },
      { regionId: 13, regionName: 'Region 12' },
    ];
  }

  // Trash Bin API methods
  async getTrashStats() {
    return this.fetchData('/trash/stats');
  }

  async getDeletedUsers(page = 1, perPage = 15, search = '') {
    const params = new URLSearchParams();
    
    // Only add non-empty parameters
    if (page) {
      params.append('page', page.toString());
    }
    if (perPage) {
      params.append('per_page', perPage.toString());
    }
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    
    return this.fetchData(`/trash/users?${params}`);
  }

  async getDeletedSalesReports(page = 1, perPage = 15, search = '') {
    const params = new URLSearchParams();
    
    // Only add non-empty parameters
    if (page) {
      params.append('page', page.toString());
    }
    if (perPage) {
      params.append('per_page', perPage.toString());
    }
    if (search && search.trim() !== '') {
      params.append('search', search.trim());
    }
    
    return this.fetchData(`/trash/sales-reports?${params}`);
  }

  async restoreUser(userId) {
    return this.fetchData(`/trash/users/${userId}/restore`, {
      method: 'POST'
    });
  }

  async restoreSalesReport(reportId) {
    return this.fetchData(`/trash/sales-reports/${reportId}/restore`, {
      method: 'POST'
    });
  }

  async permanentlyDeleteUser(userId) {
    return this.fetchData(`/trash/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async permanentlyDeleteSalesReport(reportId) {
    return this.fetchData(`/trash/sales-reports/${reportId}`, {
      method: 'DELETE'
    });
  }

  // Health check
  async healthCheck() {
    return this.fetchData('/');
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
