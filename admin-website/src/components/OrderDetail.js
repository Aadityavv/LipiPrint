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
  const [isPrinting, setIsPrinting] = useState(false);

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

  const printFileWithIframe = (fileUrl, filename) => {
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '0';
      iframe.style.height = '0';
      
      iframe.onload = () => {
        try {
          iframe.contentWindow.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1000);
        } catch (error) {
          document.body.removeChild(iframe);
          reject(error);
        }
      };
      
      iframe.onerror = () => {
        document.body.removeChild(iframe);
        reject(new Error('Failed to load file'));
      };
      
      iframe.src = fileUrl;
      document.body.appendChild(iframe);
    });
  };

  const handlePrintFile = async (printJob) => {
    try {
      if (!printJob.file?.url) {
        toast.error('File URL not available for printing');
        return;
      }

      setIsPrinting(true);
      const fileUrl = printJob.file.url;
      const fileType = printJob.file.contentType || printJob.file.mimeType || '';
      const filename = printJob.file.filename || printJob.file.originalFilename || 'file';
      
      console.log('Printing file:', { fileUrl, fileType, filename });
      
      // Try multiple approaches for better compatibility
      try {
        // Method 1: Direct window.open with print
        const printWindow = window.open(fileUrl, '_blank', 'width=800,height=600');
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
              // Close window after a delay
              setTimeout(() => {
                printWindow.close();
              }, 2000);
            }, 1500);
          };
        } else {
          throw new Error('Popup blocked');
        }
      } catch (error) {
        console.log('Window method failed, trying iframe method:', error);
        
        // Method 2: Iframe fallback
        try {
          await printFileWithIframe(fileUrl, filename);
        } catch (iframeError) {
          console.log('Iframe method failed, trying direct print:', iframeError);
          
          // Method 3: Create a temporary link and trigger download/view
          const link = document.createElement('a');
          link.href = fileUrl;
          link.target = '_blank';
          link.click();
          
          toast.info('File opened in new tab. Please use Ctrl+P to print.');
        }
      }
      
      // Show confirmation modal after a short delay
      setTimeout(() => {
        setPrintingFile(printJob);
        setShowPrintConfirm(true);
        setIsPrinting(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error opening print window:', error);
      toast.error('Failed to open print dialog. Please try downloading the file and printing manually.');
      setIsPrinting(false);
    }
  };

  const confirmPrint = async () => {
    try {
      if (!printingFile?.id) {
        toast.error('Print job ID not found');
        return;
      }
      
      await api.markPrintJobAsCompleted(printingFile.id);
      toast.success('File marked as printed successfully!');
      setShowPrintConfirm(false);
      setPrintingFile(null);
      
      // Reload order to get updated data
      await loadOrder();
      
      // Check if all print jobs are completed and update order status
      if (order?.printJobs) {
        const allCompleted = order.printJobs.every(pj => pj.status === 'COMPLETED');
        if (allCompleted && order.status !== 'COMPLETED') {
          try {
            await api.updateOrderStatus(orderId, 'COMPLETED');
            toast.success('All files printed! Order marked as completed.');
          } catch (error) {
            console.error('Error updating order status:', error);
          }
        }
      }
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
            <div className="card-title">
              <h2>
                <FileText size={20} />
                Files ({order.printJobs?.length || 0})
              </h2>
              {order.printJobs && order.printJobs.length > 0 && (
                <div className="print-progress">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${(order.printJobs.filter(pj => pj.status === 'COMPLETED').length / order.printJobs.length) * 100}%` 
                      }}
                    ></div>
                  </div>
                  <span className="progress-text">
                    {order.printJobs.filter(pj => pj.status === 'COMPLETED').length} of {order.printJobs.length} files printed
                  </span>
                </div>
              )}
            </div>
            <div className="files-list">
              {order.printJobs?.map((printJob, index) => (
                <div key={printJob.id || index} className="file-item">
                  <div className="file-header">
                    <div className="file-name">
                      <FileText size={16} />
                      <span>{printJob.file?.filename || printJob.file?.originalFilename || 'Unknown file'}</span>
                    </div>
                    <div className="file-status">
                      {printJob.status === 'COMPLETED' ? (
                        <span className="status-printed">
                          <CheckCircle size={14} />
                          Printed
                        </span>
                      ) : (
                        <span className="status-not-printed">
                          <Clock size={14} />
                          {printJob.status === 'PRINTING' ? 'Printing...' : 'Not Printed'}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Print Job Options */}
                  {printJob.options && (
                    <div className="print-options">
                      <small>
                        Options: {JSON.parse(printJob.options).color || 'B&W'}, 
                        {JSON.parse(printJob.options).paper || 'A4'}, 
                        {JSON.parse(printJob.options).quality || 'Standard'}
                      </small>
                    </div>
                  )}
                  
                  <div className="file-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={() => handleViewFile(printJob.file?.url)}
                      disabled={!printJob.file?.url}
                    >
                      <Eye size={16} />
                      View
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => handleDownloadFile(printJob.file?.url, printJob.file?.filename)}
                      disabled={!printJob.file?.url}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    <button 
                      className="btn btn-warning"
                      onClick={() => handlePrintFile(printJob)}
                      disabled={printJob.status === 'COMPLETED' || isPrinting}
                    >
                      <Printer size={16} />
                      {isPrinting ? 'Opening Print...' : 
                       printJob.status === 'COMPLETED' ? 'Printed' : 'Print'}
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
              {printingFile && (
                <div className="print-file-info">
                  <strong>File:</strong> {printingFile.file?.filename || printingFile.file?.originalFilename || 'Unknown file'}
                  {printingFile.options && (
                    <div className="print-options-preview">
                      <small>
                        Options: {JSON.parse(printingFile.options).color || 'B&W'}, 
                        {JSON.parse(printingFile.options).paper || 'A4'}, 
                        {JSON.parse(printingFile.options).quality || 'Standard'}
                      </small>
                    </div>
                  )}
                </div>
              )}
              <div className="print-instructions">
                <p><strong>Instructions:</strong></p>
                <ul>
                  <li>If the print dialog didn't open automatically, check your browser's popup blocker</li>
                  <li>You can also use Ctrl+P (or Cmd+P on Mac) to print the file</li>
                  <li>Make sure to select the correct printer and settings</li>
                </ul>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-success"
                  onClick={confirmPrint}
                >
                  <CheckCircle size={16} />
                  Yes, Printed Successfully
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => {
                    setShowPrintConfirm(false);
                    handlePrintFile(printingFile);
                  }}
                >
                  <Printer size={16} />
                  Try Print Again
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
