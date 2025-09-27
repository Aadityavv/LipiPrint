import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  FileText, 
  Settings, 
  CheckCircle, 
  Clock, 
  Truck,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import OrderCard from './OrderCard';
import StatsCard from './StatsCard';
import OrderFilters from './OrderFilters';
import BulkActions from './BulkActions';
import ExportModal from './ExportModal';
import './Dashboard.css';

const Dashboard = ({ user, onLogout }) => {
  const navigate = useNavigate();
  
  // State management
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  
  // Filters and search
  const [filters, setFilters] = useState({
    search: '',
    status: 'ALL',
    dateRange: 'ALL',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });
  
  // UI state
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Analytics
  const [analytics, setAnalytics] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    processingOrders: 0,
    deliveredOrders: 0,
    cancelledOrders: 0,
    todayOrders: 0,
    weekOrders: 0,
    monthOrders: 0
  });

  // Initialize dashboard
  useEffect(() => {
    console.log('Dashboard mounted, loading orders...');
    loadOrders();
    checkPermissions();
    loadAnalytics();
  }, []);

  // Filter orders when filters change
  useEffect(() => {
    filterOrders();
  }, [orders, filters]);

  // Load more orders when page changes
  useEffect(() => {
    if (pagination.currentPage > 0) {
      loadOrders(pagination.currentPage);
    }
  }, [pagination.currentPage]);

  // Enhanced load orders with pagination and error handling
  const loadOrders = useCallback(async (page = 0, append = false) => {
    try {
      if (append) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      console.log('Loading orders...', { page, filters });
      
      const response = await api.getOrders({
        page,
        limit: pagination.size,
        status: filters.status !== 'ALL' ? filters.status : null,
        sort: `${filters.sortBy},${filters.sortOrder}`
      });
      
      console.log('Orders response:', response);
      
      if (response.orders && Array.isArray(response.orders)) {
        if (append) {
          setOrders(prev => [...prev, ...response.orders]);
        } else {
          setOrders(response.orders);
        }
        
        setPagination(prev => ({
          ...prev,
          currentPage: response.pagination?.currentPage || page,
          totalPages: response.pagination?.totalPages || 0,
          totalElements: response.pagination?.totalElements || 0
        }));
        
        console.log('Successfully loaded orders:', response.orders.length);
      } else {
        console.warn('API returned invalid data:', response);
        if (!append) setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        toast.error('Session expired. Please log in again.');
        onLogout();
      } else {
        toast.error(error.message || 'Failed to load orders');
      }
      
      if (!append) setOrders([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, pagination.size, onLogout]);

  // Load analytics data
  const loadAnalytics = useCallback(async () => {
    try {
      // Calculate analytics from current orders
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
      const completedOrders = orders.filter(o => o.status === 'COMPLETED').length;
      const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
      const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
      const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;
      
      // Date-based analytics
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const todayOrders = orders.filter(o => new Date(o.createdAt) >= today).length;
      const weekOrders = orders.filter(o => new Date(o.createdAt) >= weekAgo).length;
      const monthOrders = orders.filter(o => new Date(o.createdAt) >= monthAgo).length;
      
      setAnalytics({
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        processingOrders,
        deliveredOrders,
        cancelledOrders,
        todayOrders,
        weekOrders,
        monthOrders
      });
    } catch (error) {
      console.error('Error calculating analytics:', error);
    }
  }, [orders]);

  const checkPermissions = async () => {
    try {
      const permissions = await api.checkCanEdit();
      setCanEdit(permissions.canEdit);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanEdit(false);
    }
  };

  // Enhanced filtering with multiple criteria
  const filterOrders = useCallback(() => {
    if (!Array.isArray(orders)) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...orders];

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchTerm) ||
        order.userName?.toLowerCase().includes(searchTerm) ||
        order.status?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    if (filters.status !== 'ALL') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Date range filter
    if (filters.dateRange !== 'ALL') {
      const now = new Date();
      let startDate;
      
      switch (filters.dateRange) {
        case 'TODAY':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'WEEK':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'MONTH':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filtered = filtered.filter(order => new Date(order.createdAt) >= startDate);
      }
    }

    // Sort orders
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (filters.sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'userName':
          aValue = a.userName || '';
          bValue = b.userName || '';
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredOrders(filtered);
  }, [orders, filters]);

  // Event handlers
  const handleOrderClick = useCallback((orderId) => {
    navigate(`/order/${orderId}`);
  }, [navigate]);

  const handleRefresh = useCallback(() => {
    loadOrders(0, false);
  }, [loadOrders]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const handlePageChange = useCallback((page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  const handleSelectOrder = useCallback((orderId, selected) => {
    setSelectedOrders(prev => 
      selected 
        ? [...prev, orderId]
        : prev.filter(id => id !== orderId)
    );
  }, []);

  const handleSelectAll = useCallback((selected) => {
    if (selected) {
      setSelectedOrders(filteredOrders.map(order => order.id));
    } else {
      setSelectedOrders([]);
    }
  }, [filteredOrders]);

  const handleBulkAction = useCallback(async (action, data) => {
    try {
      if (selectedOrders.length === 0) {
        toast.error('Please select orders first');
        return;
      }

      let result;
      switch (action) {
        case 'updateStatus':
          result = await api.bulkUpdateOrderStatus(selectedOrders, data.status);
          toast.success(`Updated ${result.successful} orders successfully`);
          break;
        case 'export':
          setShowExportModal(true);
          break;
        default:
          toast.error('Unknown action');
          return;
      }

      if (result && result.failed > 0) {
        toast.error(`${result.failed} orders failed to update`);
      }

      // Refresh orders
      handleRefresh();
      setSelectedOrders([]);
    } catch (error) {
      console.error('Bulk action error:', error);
      toast.error(error.message || 'Bulk action failed');
    }
  }, [selectedOrders, handleRefresh]);

  // Memoized stats calculation
  const stats = useMemo(() => ({
    total: analytics.totalOrders,
    processing: analytics.processingOrders,
    completed: analytics.completedOrders,
    delivered: analytics.deliveredOrders,
    revenue: analytics.totalRevenue
  }), [analytics]);

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <div className="loading"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Debug logging
  console.log('Dashboard render - orders:', orders);
  console.log('Dashboard render - filteredOrders:', filteredOrders);
  console.log('Dashboard render - stats:', stats);

  // Safety check - ensure we have valid data before rendering
  if (!Array.isArray(orders)) {
    console.warn('Orders is not an array, rendering loading state');
    return (
      <div className="dashboard-loading">
        <div className="loading"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <h1 className="dashboard-title">
              <span className="title-icon">🖨️</span>
              LipiPrint Admin Dashboard
            </h1>
            <p className="dashboard-subtitle">
              Welcome back, {user?.name || 'Admin'}!
            </p>
          </div>
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button 
              className="btn btn-danger"
              onClick={onLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <FileText size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Orders</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon processing">
              <Clock size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.processing}</div>
              <div className="stat-label">Processing</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon completed">
              <CheckCircle size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon delivered">
              <Truck size={32} />
            </div>
            <div className="stat-content">
              <div className="stat-number">{stats.delivered}</div>
              <div className="stat-label">Delivered</div>
            </div>
          </div>
        </div>

        {/* Orders Section */}
        <div className="card">
          <div className="orders-header">
            <h2 className="section-title">
              <FileText size={24} />
              Orders ({filteredOrders.length})
            </h2>
            
            <div className="filters">
              <div className="search-container">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  className="search-input"
                />
              </div>
              
              <div className="filter-container">
                <Filter size={16} className="filter-icon" />
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange({ status: e.target.value })}
                  className="filter-select"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>
          </div>

          <div className="orders-list">
            {!Array.isArray(filteredOrders) || filteredOrders.length === 0 ? (
              <div className="empty-state">
                <FileText size={48} className="empty-icon" />
                <h3>No orders found</h3>
                <p>
                  {!Array.isArray(filteredOrders) 
                    ? 'Loading orders...'
                    : filters.search || filters.status !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No orders have been placed yet'
                  }
                </p>
                {Array.isArray(orders) && orders.length === 0 && (
                  <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    <p>Debug info:</p>
                    <p>• Orders array length: {orders.length}</p>
                    <p>• Filtered orders length: {filteredOrders.length}</p>
                    <p>• Search term: "{filters.search}"</p>
                    <p>• Status filter: "{filters.status}"</p>
                  </div>
                )}
              </div>
            ) : (
              filteredOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onClick={() => handleOrderClick(order.id)}
                  canEdit={canEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
