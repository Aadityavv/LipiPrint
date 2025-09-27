import axios from 'axios';

class ApiService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
    this.token = localStorage.getItem('authToken');
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // Create axios instance with better configuration
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Increased timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        
        // Add request timestamp for caching
        config.metadata = { startTime: new Date() };
        
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor with retry logic
    this.api.interceptors.response.use(
      (response) => {
        // Log successful requests
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);
        return response;
      },
      async (error) => {
        const config = error.config;
        
        // Log errors
        const duration = new Date() - (config.metadata?.startTime || new Date());
        console.error(`❌ ${config.method?.toUpperCase()} ${config.url} - ${error.response?.status || 'Network Error'} (${duration}ms)`, error);
        
        // Handle 401 - Unauthorized
        if (error.response?.status === 401) {
          this.clearToken();
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Retry logic for network errors
        if (!error.response && config && !config.__retryCount) {
          config.__retryCount = 0;
        }
        
        if (config && config.__retryCount < 3) {
          config.__retryCount++;
          console.log(`🔄 Retrying request (${config.__retryCount}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * config.__retryCount));
          return this.api(config);
        }
        
        return Promise.reject(error);
      }
    );
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  getToken() {
    return this.token || localStorage.getItem('authToken');
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
    this.cache.clear(); // Clear cache on logout
  }

  // Cache management
  getCacheKey(url, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((result, key) => {
      result[key] = params[key];
      return result;
    }, {});
    return `${url}?${JSON.stringify(sortedParams)}`;
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 Cache hit: ${key}`);
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Enhanced request method with caching
  async request(endpoint, options = {}, useCache = false) {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const cacheKey = useCache ? this.getCacheKey(url, options.params) : null;
    
    // Check cache first
    if (useCache && cacheKey) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.api.request({
        url,
        ...options
      });

      // Cache successful responses
      if (useCache && cacheKey && response.data) {
        this.setCache(cacheKey, response.data);
      }

      return response.data;
    } catch (error) {
      console.error(`API Error: ${url}`, error);
      throw error;
    }
  }

  // Authentication methods
  async login(phone, password) {
    try {
      const response = await this.api.post('/auth/login', {
        phone,
        password,
      });
      
      if (response.data.accessToken) {
        this.setToken(response.data.accessToken);
        return response.data;
      }
      throw new Error('No access token received');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    this.clearToken();
  }

  // Order methods with enhanced functionality
  async getOrders(params = {}) {
    try {
      const response = await this.request('/orders', {
        method: 'GET',
        params: {
          page: params.page || 0,
          limit: params.limit || 50,
          status: params.status || null,
          sort: params.sort || 'createdAt,desc'
        }
      }, true); // Use cache
      
      // Handle paginated response
      if (response && response.content) {
        return {
          orders: response.content,
          pagination: {
            totalElements: response.totalElements,
            totalPages: response.totalPages,
            currentPage: response.page,
            size: response.size,
            hasNext: response.page < response.totalPages - 1,
            hasPrevious: response.page > 0
          }
        };
      }
      
      return { orders: [], pagination: null };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error(`Failed to fetch orders: ${error.response?.data?.message || error.message}`);
    }
  }

  async getOrderById(orderId) {
    try {
      const response = await this.request(`/orders/${orderId}`, {}, true);
      return response;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw new Error(`Failed to fetch order details: ${error.response?.data?.message || error.message}`);
    }
  }

  async updateOrderStatus(orderId, status) {
    try {
      const response = await this.request(`/orders/${orderId}/status`, {
        method: 'PUT',
        params: { status }
      });
      
      // Clear cache for orders list
      this.cache.delete(this.getCacheKey('/orders'));
      
      return response;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error(`Failed to update order status: ${error.response?.data?.message || error.message}`);
    }
  }

  async markOrderAsPrinted(orderId) {
    try {
      const response = await this.request(`/orders/${orderId}/print`, {
        method: 'POST'
      });
      
      // Clear cache for orders list
      this.cache.delete(this.getCacheKey('/orders'));
      
      return response;
    } catch (error) {
      console.error('Error marking order as printed:', error);
      throw new Error(`Failed to mark order as printed: ${error.response?.data?.message || error.message}`);
    }
  }

  // Bulk operations
  async bulkUpdateOrderStatus(orderIds, status) {
    try {
      const promises = orderIds.map(id => this.updateOrderStatus(id, status));
      const results = await Promise.allSettled(promises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      return { successful, failed, results };
    } catch (error) {
      console.error('Error in bulk update:', error);
      throw new Error(`Bulk update failed: ${error.message}`);
    }
  }

  // Print Job methods
  async getPrintJobs() {
    try {
      const response = await this.request('/print-jobs', {}, true);
      return response;
    } catch (error) {
      console.error('Error fetching print jobs:', error);
      throw new Error(`Failed to fetch print jobs: ${error.response?.data?.message || error.message}`);
    }
  }

  async getPrintJobById(printJobId) {
    try {
      const response = await this.request(`/print-jobs/${printJobId}`, {}, true);
      return response;
    } catch (error) {
      console.error('Error fetching print job:', error);
      throw new Error(`Failed to fetch print job: ${error.response?.data?.message || error.message}`);
    }
  }

  async updatePrintJobStatus(printJobId, status) {
    try {
      const response = await this.request(`/print-jobs/${printJobId}/status`, {
        method: 'PUT',
        params: { status }
      });
      
      // Clear cache for print jobs
      this.cache.delete(this.getCacheKey('/print-jobs'));
      
      return response;
    } catch (error) {
      console.error('Error updating print job status:', error);
      throw new Error(`Failed to update print job status: ${error.response?.data?.message || error.message}`);
    }
  }

  async markPrintJobAsCompleted(printJobId) {
    try {
      const response = await this.updatePrintJobStatus(printJobId, 'COMPLETED');
      return response;
    } catch (error) {
      console.error('Error marking print job as completed:', error);
      throw new Error(`Failed to mark print job as completed: ${error.response?.data?.message || error.message}`);
    }
  }

  // User profile methods
  async getProfile() {
    try {
      const response = await this.api.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async checkCanEdit() {
    try {
      const response = await this.api.get('/user/can-edit');
      return response.data;
    } catch (error) {
      console.error('Error checking canEdit permission:', error);
      throw error;
    }
  }
}

export default new ApiService();
