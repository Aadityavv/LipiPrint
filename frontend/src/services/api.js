import AsyncStorage from '@react-native-async-storage/async-storage';

const baseUrl = 'https://lipiprint-freelance.onrender.com/api'; // Ensure no trailing slash

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

    async getHeaders() {
        let token = this.token;
        if (!token) {
            token = await AsyncStorage.getItem('authToken');
            this.token = token;
        }
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${this.baseURL}${cleanEndpoint}`;

        const headers = await this.getHeaders();
        const isFormData = options.body instanceof FormData;

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const config = {
            headers,
            ...options,
        };

        console.log('[API CALL]', { url, method: options.method || 'GET', headers, token: this.token, body: options.body });
        console.log('[API DEBUG] About to fetch:', url, config);
        
        try {
            const response = await fetch(url, config);
            console.log('[API DEBUG] After fetch:', response);
            console.log('[API RESPONSE STATUS]', { url, status: response.status });
            
            if (response.status === 401) {
                await this.clearToken();
                throw new Error('Unauthorized');
            }
            if (!response.ok) {
                // Try to get error message from response
                let errorMessage = `HTTP error! status: ${response.status}`;
                try {
                    const errorText = await response.text();
                    if (errorText) {
                        const errorData = JSON.parse(errorText);
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    }
                } catch (e) {
                    // Keep default error message
                }
                throw new Error(errorMessage);
            }
            
            const text = await response.text();
            console.log('[API RESPONSE BODY]', { url, response: text });
            
            if (options.method === 'DELETE' && response.status === 204) {
                return { success: true };
            }
            try {
                return text ? JSON.parse(text) : {};
            } catch (e) {
                return {};
            }
        } catch (error) {
            console.error('[API ERROR]', error);
            throw error;
        }
    }

    // Authentication
    async login(phone, password) {
        const response = await this.request('/auth/login', {
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

    async getRecentOrders(limit = 3) {
        try {
            const orders = await this.request(`/orders?limit=${limit}`);
            if (Array.isArray(orders)) return orders;
            const allOrders = await this.getOrders();
            return Array.isArray(allOrders) ? allOrders.slice(0, limit) : [];
        } catch (e) {
            const allOrders = await this.getOrders();
            return Array.isArray(allOrders) ? allOrders.slice(0, limit) : [];
        }
    }

    async getOrders() {
        const res = await this.request('/orders');
        if (res && Array.isArray(res.content)) return res.content;
        if (Array.isArray(res)) return res;
        return [];
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

    // *** NEW: SHIPPING & TRACKING METHODS FOR NIMBUSPOST INTEGRATION ***
    
    // Track order by order ID
    async trackOrder(orderId) {
        try {
            return await this.request(`/shipping/track/${orderId}`);
        } catch (error) {
            console.error('Failed to track order:', error);
            throw error;
        }
    }

    // Track by AWB number
    async trackByAwb(awbNumber) {
        try {
            return await this.request(`/shipping/track/awb/${awbNumber}`);
        } catch (error) {
            console.error('Failed to track by AWB:', error);
            throw error;
        }
    }

    // Get delivery estimate for pincode
    async getDeliveryEstimate(pincode, weight = 0.2) {
        try {
            return await this.request('/shipping/estimate-delivery', {
                method: 'POST',
                body: JSON.stringify({ pincode, weight })
            });
        } catch (error) {
            console.error('Failed to get delivery estimate:', error);
            throw error;
        }
    }

    // Get shipping rates for order
    async getShippingRates(orderDetails) {
        try {
            return await this.request('/shipping/rates', {
                method: 'POST', 
                body: JSON.stringify(orderDetails)
            });
        } catch (error) {
            console.error('Failed to get shipping rates:', error);
            throw error;
        }
    }

    // Retry shipment creation for failed orders
    async retryShipmentCreation(orderId) {
        try {
            return await this.request(`/shipping/retry/${orderId}`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Failed to retry shipment creation:', error);
            throw error;
        }
    }

    // *** END SHIPPING METHODS ***

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

    async getAvailablePrintOptions(selection) {
        return await this.request('/print-jobs/available-options', {
            method: 'POST',
            body: JSON.stringify(selection),
        });
    }

    async calculatePrintCostForFiles(files) {
        return await this.request('/print-jobs/calculate-cost', {
            method: 'POST',
            body: JSON.stringify({ files }),
        });
    }

    async calculatePrintJobsCost(payload) {
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

    // Admin canEdit permission management
    async updateCanEdit(userId, canEdit) {
        return await this.request(`/user/can-edit/${userId}?canEdit=${canEdit}`, {
            method: 'POST',
        });
    }

    async checkCanEdit() {
        return await this.request('/user/can-edit');
    }
}

export default new ApiService();
