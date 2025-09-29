import React from 'react';
import { 
  User, 
  FileText, 
  Calendar, 
  DollarSign, 
  Truck, 
  Store,
  Clock,
  CheckCircle,
  Settings,
  CheckSquare,
  Square
} from 'lucide-react';
import './OrderCard.css';

const OrderCard = ({ 
  order, 
  onClick, 
  canEdit, 
  selected = false, 
  onSelect, 
  viewMode = 'grid',
  onStatusUpdate
}) => {
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
      case 'PENDING': return <Clock size={12} />;
      case 'PROCESSING': return <Settings size={12} />;
      case 'COMPLETED': return <CheckCircle size={12} />;
      case 'DELIVERED': return <Truck size={12} />;
      case 'CANCELLED': return <Clock size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'PROCESSING': return 'Processing';
      case 'COMPLETED': return 'Completed';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      default: return status;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusColor = getStatusColor(order.status);
  const statusIcon = getStatusIcon(order.status);
  const statusLabel = getStatusLabel(order.status);

  const handleCardClick = (e) => {
    // Don't trigger onClick if clicking on checkbox
    if (e.target.closest('.order-checkbox')) {
      return;
    }
    onClick();
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(!selected);
    }
  };

  return (
    <div 
      className={`order-card ${viewMode} ${selected ? 'selected' : ''}`} 
      onClick={handleCardClick}
      data-order-id={order.id}
    >
      {onSelect && (
        <div className="order-checkbox" onClick={handleSelect}>
          {selected ? <CheckSquare size={16} /> : <Square size={16} />}
        </div>
      )}
      
      <div className="order-header">
        <div className="order-id">
          <span className="order-number">#{order.id}</span>
          <div 
            className="status-badge"
            style={{ backgroundColor: statusColor }}
          >
            {statusIcon}
            <span>{statusLabel}</span>
          </div>
        </div>
        <div className="order-date">
          {formatDate(order.createdAt)}
        </div>
      </div>

      <div className="order-info">
        <div className="info-row">
          <div className="info-item">
            <User size={14} className="info-icon" />
            <span className="info-text">{order.userName || 'Unknown'}</span>
          </div>
          <div className="info-item">
            <FileText size={14} className="info-icon" />
            <span className="info-text">
              Order #{order.id}
            </span>
          </div>
        </div>
        
        <div className="info-row">
          <div className="info-item">
            {order.deliveryType === 'DELIVERY' ? (
              <Truck size={14} className="info-icon" />
            ) : (
              <Store size={14} className="info-icon" />
            )}
            <span className="info-text">
              {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
            </span>
          </div>
          <div className="info-item">
            <DollarSign size={14} className="info-icon" />
            <span className="info-text">
              ₹{order.totalAmount?.toFixed(2) || '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Pickup details for delivery orders */}
      {order.deliveryType === 'DELIVERY' && (order.pickupName || order.pickupStatus) && (
        <div className="pickup-details">
          <div className="pickup-header">
            <Truck size={14} className="pickup-icon" />
            <span className="pickup-title">Pickup Details</span>
          </div>
          {order.pickupName && (
            <div className="pickup-info">
              <span className="pickup-label">Pickup Location:</span>
              <span className="pickup-value">{order.pickupName}</span>
            </div>
          )}
          {order.pickupAddress && (
            <div className="pickup-info">
              <span className="pickup-label">Address:</span>
              <span className="pickup-value">{order.pickupAddress}</span>
            </div>
          )}
          {order.pickupCity && order.pickupState && (
            <div className="pickup-info">
              <span className="pickup-label">Location:</span>
              <span className="pickup-value">{order.pickupCity}, {order.pickupState} {order.pickupPincode}</span>
            </div>
          )}
          {order.pickupPhone && (
            <div className="pickup-info">
              <span className="pickup-label">Phone:</span>
              <span className="pickup-value">{order.pickupPhone}</span>
            </div>
          )}
          {order.pickupStatus && (
            <div className="pickup-info">
              <span className="pickup-label">Status:</span>
              <span className={`pickup-status ${order.pickupStatus.toLowerCase()}`}>
                {order.pickupStatus}
              </span>
            </div>
          )}
          {order.pickupScheduledDate && (
            <div className="pickup-info">
              <span className="pickup-label">Scheduled:</span>
              <span className="pickup-value">
                {new Date(order.pickupScheduledDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Admin tracking information */}
      {(order.printedByAdminName || order.processedByAdminName || order.completedByAdminName) && (
        <div className="admin-tracking">
          {order.printedByAdminName && (
            <div className="admin-info">
              <span className="admin-icon">🖨️</span>
              <span className="admin-text">Printed by: {order.printedByAdminName}</span>
            </div>
          )}
          {order.processedByAdminName && (
            <div className="admin-info">
              <span className="admin-icon">⚙️</span>
              <span className="admin-text">Processed by: {order.processedByAdminName}</span>
            </div>
          )}
          {order.completedByAdminName && (
            <div className="admin-info">
              <span className="admin-icon">✅</span>
              <span className="admin-text">Completed by: {order.completedByAdminName}</span>
            </div>
          )}
        </div>
      )}

      {/* Status update buttons */}
      {canEdit && onStatusUpdate && (
        <div className="status-actions">
          {order.status === 'PENDING' && (
            <button
              className="status-btn processing"
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate('PROCESSING');
              }}
            >
              <Settings size={14} />
              Start Processing
            </button>
          )}
          
          {order.status === 'PROCESSING' && (
            <button
              className="status-btn completed"
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate('COMPLETED');
              }}
            >
              <CheckCircle size={14} />
              Mark Complete
            </button>
          )}
          
          {order.status === 'COMPLETED' && (
            <button
              className="status-btn delivered"
              onClick={(e) => {
                e.stopPropagation();
                onStatusUpdate('DELIVERED');
              }}
            >
              <Truck size={14} />
              Mark Delivered
            </button>
          )}
        </div>
      )}

      <div className="order-footer">
        <div className="order-amount">
          <span className="amount-label">Total:</span>
          <span className="amount-value">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="order-actions">
          <span className="view-details">Click to view details →</span>
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
