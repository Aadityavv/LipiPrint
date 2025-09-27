import React, { useState } from 'react';
import { 
  CheckSquare, 
  Square, 
  MoreVertical, 
  Edit, 
  Download, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  Clock,
  Truck
} from 'lucide-react';
import './BulkActions.css';

const BulkActions = ({ 
  selectedOrders, 
  totalOrders, 
  onSelectAll, 
  onBulkAction, 
  onClearSelection,
  canEdit 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  const isAllSelected = selectedOrders.length === totalOrders && totalOrders > 0;
  const isPartiallySelected = selectedOrders.length > 0 && selectedOrders.length < totalOrders;

  const statusOptions = [
    { value: 'PENDING', label: 'Pending', icon: Clock, color: '#f59e0b' },
    { value: 'PROCESSING', label: 'Processing', icon: AlertCircle, color: '#3b82f6' },
    { value: 'COMPLETED', label: 'Completed', icon: CheckCircle, color: '#10b981' },
    { value: 'DELIVERED', label: 'Delivered', icon: Truck, color: '#8b5cf6' },
    { value: 'CANCELLED', label: 'Cancelled', icon: Trash2, color: '#ef4444' }
  ];

  const handleSelectAll = () => {
    onSelectAll(!isAllSelected);
  };

  const handleBulkStatusUpdate = () => {
    if (!selectedStatus) return;
    
    onBulkAction('updateStatus', { status: selectedStatus });
    setShowStatusModal(false);
    setSelectedStatus('');
  };

  const handleExport = () => {
    onBulkAction('export', { orderIds: selectedOrders });
  };

  if (selectedOrders.length === 0) {
    return (
      <div className="bulk-actions">
        <div className="bulk-actions-header">
          <div className="selection-info">
            <span className="order-count">{totalOrders} orders</span>
          </div>
          <div className="bulk-actions-actions">
            <button 
              className="select-all-btn"
              onClick={handleSelectAll}
              disabled={totalOrders === 0}
            >
              {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
              Select All
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-actions active">
      <div className="bulk-actions-header">
        <div className="selection-info">
          <div className="selection-count">
            {isPartiallySelected ? (
              <Square size={16} className="partial" />
            ) : (
              <CheckSquare size={16} />
            )}
            <span>{selectedOrders.length} of {totalOrders} selected</span>
          </div>
          <button 
            className="clear-selection-btn"
            onClick={onClearSelection}
          >
            Clear
          </button>
        </div>
        
        <div className="bulk-actions-actions">
          {canEdit && (
            <button 
              className="bulk-action-btn primary"
              onClick={() => setShowStatusModal(true)}
            >
              <Edit size={16} />
              Update Status
            </button>
          )}
          
          <button 
            className="bulk-action-btn"
            onClick={handleExport}
          >
            <Download size={16} />
            Export
          </button>
          
          <div className="more-actions">
            <button 
              className="more-actions-btn"
              onClick={() => setShowActions(!showActions)}
            >
              <MoreVertical size={16} />
            </button>
            
            {showActions && (
              <div className="more-actions-menu">
                <button 
                  className="menu-item"
                  onClick={() => setShowStatusModal(true)}
                  disabled={!canEdit}
                >
                  <Edit size={16} />
                  Update Status
                </button>
                <button 
                  className="menu-item"
                  onClick={handleExport}
                >
                  <Download size={16} />
                  Export Selected
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Status for {selectedOrders.length} Orders</h3>
              <button 
                className="close-btn"
                onClick={() => setShowStatusModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="status-options">
                {statusOptions.map(option => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      className={`status-option ${selectedStatus === option.value ? 'selected' : ''}`}
                      onClick={() => setSelectedStatus(option.value)}
                      style={{ '--status-color': option.color }}
                    >
                      <Icon size={20} />
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowStatusModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleBulkStatusUpdate}
                  disabled={!selectedStatus}
                >
                  Update {selectedOrders.length} Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;
