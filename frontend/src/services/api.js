import AsyncStorage from '@react-native-async-storage/async-storage';

const baseUrl = 'http://192.168.1.11:8082/api'; // Ensure no trailing slash
class ApiService {
    constructor() {
        this.baseURL = baseUrl;
        this.baseUrl = baseUrl;
        this.token = null;
    }

    async setToken(token) {
        this.token = token;
        await AsyncStorage.setItem('authToken', token);
    }

    async getToken() {
        if (!this.token) {
            this.token = await AsyncStorage.getItem('authToken');
        }
        return this.token;
    }

    async clearToken() {
        this.token = null;
        await AsyncStorage.removeItem('authToken');
    }

    async getHeaders(isFormData = false, isDeleteNoBody = false) {
        let token = this.token;
        if (!token) {
            token = await AsyncStorage.getItem('authToken');
            this.token = token;
        }
        const headers = {};
        if (!isFormData && !isDeleteNoBody) {
            headers['Content-Type'] = 'application/json';
        }
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        console.log('API headers:', headers);
        return headers;
    }

    async request(endpoint, options = {}) {
        // Ensure endpoint starts with a single slash and baseURL does not end with a slash
        let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${cleanEndpoint}`;
        const isFormData = options.body instanceof FormData;
        const isDeleteNoBody = options.method === 'DELETE' && !options.body;
        const headers = await this.getHeaders(isFormData, isDeleteNoBody);
        const config = {
            headers,
            ...options,
        };

        // Log request details for debugging
        console.log('[API CALL]', {
            url,
            method: options.method || 'GET',
            headers,
            token: this.token,
            body: options.body,
        });

        try {
            const response = await fetch(url, config);
            
            // Log response status
            console.log('[API RESPONSE STATUS]', { url, status: response.status });

            if (response.status === 401) {
                await this.clearToken();
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Only parse JSON if there is content
            const text = await response.text();
            // Log response body
            console.log('[API RESPONSE BODY]', { url, response: text });
            
            // For DELETE operations with 204 No Content, return success indicator
            if (options.method === 'DELETE' && response.status === 204) {
                return { success: true };
            }
            
            try {
                return text ? JSON.parse(text) : {};
            } catch (e) {
                return {};
            }
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Authentication
    async login(phone, password) {
        const response = await this.request('/auth/signin', {
            method: 'POST',
            body: JSON.stringify({ phone, password }),
        });
        
        if (response.accessToken) {
            await this.setToken(response.accessToken);
        }
        
        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/signup', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        if (response.accessToken) {
            await this.setToken(response.accessToken);
        }
        
        return response;
    }

    async logout() {
        await this.clearToken();
    }

    // User Management
    async getCurrentUser() {
        return await this.request('/user/profile');
    }

    async getUserStatistics() {
        return await this.request('/user/statistics');
    }

    async updateProfile(userData) {
        return await this.request('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    }

    // File Management
    async uploadFile(formData) {
        return await this.request('/files/upload', {
            method: 'POST',
            body: formData,
        });
    }

    async getFiles() {
        return await this.request('/files');
    }

    async getAdminFiles() {
        return await this.request('/files/admin');
    }

    async deleteFile(fileId) {
        return await this.request(`/files/${fileId}`, {
            method: 'DELETE',
        });
    }

    // Print Jobs
    async createPrintJob(printJobData) {
        return await this.request('/print-jobs', {
            method: 'POST',
            body: JSON.stringify(printJobData),
        });
    }

    async getPrintJobs() {
        return await this.request('/print-jobs');
    }

    async getPrintJob(id) {
        return await this.request(`/print-jobs/${id}`);
    }

    async updatePrintJobStatus(id, status) {
        return await this.request(`/print-jobs/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Orders
    async createOrder(orderData) {
        return await this.request('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });
    }

    // Fetch only the top N recent orders (default 3)
    async getRecentOrders(limit = 3) {
        try {
            // If backend supports ?limit=3, use it:
            const orders = await this.request(`/orders?limit=${limit}`);
            if (Array.isArray(orders)) return orders;
            // Fallback: fetch all and slice
            const allOrders = await this.getOrders();
            return Array.isArray(allOrders) ? allOrders.slice(0, limit) : [];
        } catch (e) {
            // Fallback: fetch all and slice
            const allOrders = await this.getOrders();
            return Array.isArray(allOrders) ? allOrders.slice(0, limit) : [];
        }
    }

    async getOrders() {
        return await this.request('/orders');
    }

    async getOrder(id) {
        return await this.request(`/orders/${id}`);
    }

    async updateOrderStatus(id, status) {
        return await this.request(`/orders/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    }

    // Notifications
    async getNotifications() {
        return await this.request('/notifications');
    }

    async markNotificationAsRead(index) {
        return await this.request(`/notifications/read/${index}`, {
            method: 'POST',
        });
    }

    async clearNotifications() {
        return await this.request('/notifications', {
            method: 'DELETE',
        });
    }

    // Help Center
    async getHelpArticles() {
        return await this.request('/helpcenter/articles');
    }

    async createSupportTicket(ticketData) {
        return await this.request('/helpcenter/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData),
        });
    }

    // Settings
    async getSettings() {
        return await this.request('/settings');
    }

    async updateSettings(settings) {
        return await this.request('/settings', {
            method: 'POST',
            body: JSON.stringify(settings),
        });
    }

    // Analytics
    async getAnalytics(type) {
        return await this.request(`/analytics/${type}`);
    }

    // Admin endpoints
    async getUsers() {
        return await this.request('/users');
    }

    async blockUser(userId, blocked) {
        // Correct endpoint: /user/block/{id}?blocked=true
        return await this.request(`/user/block/${userId}?blocked=${blocked}`, {
            method: 'POST',
        });
    }

    async assignUserRole(userId, role) {
        return await this.request(`/users/${userId}/role`, {
            method: 'POST',
            body: JSON.stringify({ role }),
        });
    }

    // Pricing Calculation
    async calculatePrintCost(options) {
        return await this.request('/print-jobs/calculate-cost', {
            method: 'POST',
            body: JSON.stringify(options),
        });
    }

    // Get available options for current selection
    async getAvailablePrintOptions(selection) {
        return await this.request('/print-jobs/available-options', {
            method: 'POST',
            body: JSON.stringify(selection),
        });
    }

    // Per-file pricing breakdown
    async calculatePrintCostForFiles(files) {
        return await this.request('/print-jobs/calculate-cost', {
            method: 'POST',
            body: JSON.stringify({ files }),
        });
    }

    // Calculate total price for multiple print jobs/files
    async calculatePrintJobsCost(payload) {
        // POST to /print-jobs/calculate-cost
        return await this.request('/print-jobs/calculate-cost', {
            method: 'POST',
            body: JSON.stringify(payload),
        });
    }

    // User Address Management
    async getUserAddresses() {
        return await this.request('/user/addresses');
    }
    async addUserAddress(address) {
        return await this.request('/user/addresses', {
            method: 'POST',
            body: JSON.stringify(address),
        });
    }
    async updateUserAddress(id, address) {
        return await this.request(`/user/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(address),
        });
    }
    async deleteUserAddress(id) {
        return await this.request(`/user/addresses/${id}`, {
            method: 'DELETE',
        });
    }
    async setDefaultUserAddress(id) {
        return await this.request(`/user/addresses/${id}/default`, {
            method: 'PUT',
        });
    }

    // Admin: Orders with failed/missing payments
    async getOrdersWithFailedPayments() {
        return await this.request('/payments/orders-with-failed-payments');
    }

    // Admin: Payments received but no order created
    async getPaymentsWithoutOrder() {
        return await this.request('/payments/payments-without-order');
    }

    async getAdminDeliveredFiles() {
        return await this.request('/files/admin/delivered');
    }

    async deleteAdminFile(fileId) {
        return await this.request(`/files/admin/${fileId}`, {
            method: 'DELETE',
        });
    }

    async deleteAccount() {
        return await this.request('/user/profile', { method: 'DELETE' });
    }
}

export default new ApiService();
