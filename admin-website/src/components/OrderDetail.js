import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  Truck, 
  Store,
  FileText,
  Eye,
  Download,
  Printer,
  CheckCircle,
  Clock,
  Settings,
  LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import './OrderDetail.css';

const OrderDetail = ({ user, onLogout }) => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [printingFile, setPrintingFile] = useState(null);

  useEffect(() => {
    loadOrder();
    checkPermissions();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setIsLoading(true);
      console.log('Loading order details for ID:', orderId);
      const orderData = await api.getOrderById(orderId);
      console.log('Order details loaded:', orderData);
      setOrder(orderData);
    } catch (error) {
      console.error('Error loading order:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error('Failed to load order details');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const checkPermissions = async () => {
    try {
      const permissions = await api.checkCanEdit();
      setCanEdit(permissions.canEdit);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setCanEdit(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setIsUpdating(true);
      await api.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated successfully!');
      loadOrder(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintFile = (file) => {
    setPrintingFile(file);
    setShowPrintConfirm(true);
  };

  const confirmPrint = async () => {
    try {
      await api.markOrderAsPrinted(orderId);
      toast.success('File marked as printed successfully!');
      setShowPrintConfirm(false);
      setPrintingFile(null);
      loadOrder(); // Reload to get updated data
    } catch (error) {
      console.error('Error marking as printed:', error);
      toast.error('Failed to mark file as printed');
    }
  };

  const handleViewFile = (url) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast.error('File URL not available');
    }
  };

  const handleDownloadFile = (url, filename) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'file';
      link.click();
      toast.success('File download started');
    } else {
      toast.error('File URL not available');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#f59e0b';
      case 'PROCESSING': return '#3b82f6';
      case 'COMPLETED': return '#10b981';
      case 'DELIVERED': return '#8b5cf6';
      case 'CANCELLED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} />;
      case 'PROCESSING': return <Settings size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'DELIVERED': return <Truck size={16} />;
      case 'CANCELLED': return <Clock size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="order-detail-loading">
        <div className="loading"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-error">
        <h2>Order not found</h2>
        <p>The order you're looking for doesn't exist.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="order-detail">
      <div className="order-detail-header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/')}
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className="header-actions">
            <button 
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              <Settings size={16} />
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
        <div className="order-detail-content">
          {/* Order Header */}
          <div className="card order-header-card">
            <div className="order-title">
              <h1>Order #{order.id}</h1>
              <div 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(order.status) }}
              >
                {getStatusIcon(order.status)}
                <span>{order.status}</span>
              </div>
            </div>
            <div className="order-meta">
              <div className="meta-item">
                <Calendar size={16} />
                <span>Created: {formatDateTime(order.createdAt)}</span>
              </div>
              <div className="meta-item">
                <DollarSign size={16} />
                <span>Total: ₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>

          <div className="order-detail-grid">
            {/* Customer Information */}
            <div className="card">
              <h2 className="card-title">
                <User size={20} />
                Customer Information
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <User size={16} className="info-icon" />
                  <div>
                    <div className="info-label">Name</div>
                    <div className="info-value">{order.user?.name || 'Unknown'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Phone size={16} className="info-icon" />
                  <div>
                    <div className="info-label">Phone</div>
                    <div className="info-value">{order.user?.phone || 'N/A'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <Mail size={16} className="info-icon" />
                  <div>
                    <div className="info-label">Email</div>
                    <div className="info-value">{order.user?.email || 'N/A'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Information */}
            <div className="card">
              <h2 className="card-title">
                <FileText size={20} />
                Order Information
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <div>
                    <div className="info-label">Status</div>
                    <div className="info-value">{order.status}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div>
                    <div className="info-label">Delivery Type</div>
                    <div className="info-value">
                      {order.deliveryType === 'DELIVERY' ? (
                        <>
                          <Truck size={16} />
                          Delivery
                        </>
                      ) : (
                        <>
                          <Store size={16} />
                          Pickup
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="info-item">
                  <div>
                    <div className="info-label">Payment Method</div>
                    <div className="info-value">{order.paymentMethod || 'N/A'}</div>
                  </div>
                </div>
                <div className="info-item">
                  <div>
                    <div className="info-label">Total Amount</div>
                    <div className="info-value">₹{order.totalAmount?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Files Section */}
          <div className="card">
            <h2 className="card-title">
              <FileText size={20} />
              Files ({order.printJobs?.length || 0})
            </h2>
            <div className="files-list">
              {order.printJobs?.map((printJob, index) => (
                <div key={index} className="file-item">
                  <div className="file-header">
                    <div className="file-name">
                      <FileText size={16} />
                      <span>{printJob.file?.filename || 'Unknown file'}</span>
                    </div>
                    <div className="file-status">
                      {printJob.file?.printed ? (
                        <span className="status-printed">
                          <CheckCircle size={14} />
                          Printed
                        </span>
                      ) : (
                        <span className="status-not-printed">
                          <Clock size={14} />
                          Not Printed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="file-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewFile(printJob.file?.url)}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleDownloadFile(printJob.file?.url, printJob.file?.filename)}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handlePrintFile(printJob.file)}
                    >
                      <Printer size={16} />
                      Print
                    </button>
                  </div>
                </div>
              )) || (
                <div className="empty-files">
                  <FileText size={48} />
                  <p>No files found for this order</p>
                </div>
              )}
            </div>
          </div>

          {/* Status Update Section */}
          <div className="card">
            <h2 className="card-title">
              <Settings size={20} />
              Update Order Status
            </h2>
            <div className="status-update">
              <select
                value={order.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="status-select"
                disabled={isUpdating}
              >
                <option value="PENDING">Pending</option>
                <option value="PROCESSING">Processing</option>
                <option value="COMPLETED">Completed</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              {isUpdating && (
                <div className="updating-indicator">
                  <div className="loading"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Confirmation Modal */}
      {showPrintConfirm && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Print Confirmation</h3>
              <button 
                className="close-button"
                onClick={() => setShowPrintConfirm(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <p>Did the file print successfully?</p>
              <div className="modal-actions">
                <button 
                  className="btn btn-success"
                  onClick={confirmPrint}
                >
                  <CheckCircle size={16} />
                  Yes, Printed Successfully
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPrintConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
