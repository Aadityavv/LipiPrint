import React, { useState } from 'react';
import { Download, FileText, X, Calendar, Filter } from 'lucide-react';
import './ExportModal.css';

const ExportModal = ({ 
  isOpen, 
  onClose, 
  selectedOrders, 
  totalOrders,
  onExport 
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [includeFilters, setIncludeFilters] = useState(true);
  const [dateRange, setDateRange] = useState('ALL');

  const formatOptions = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'xlsx', label: 'Excel', description: 'Microsoft Excel format' },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation' }
  ];

  const dateRangeOptions = [
    { value: 'ALL', label: 'All Orders' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'This Week' },
    { value: 'MONTH', label: 'This Month' }
  ];

  const handleExport = () => {
    const exportData = {
      format: exportFormat,
      includeFilters,
      dateRange,
      selectedOrders: selectedOrders.length > 0 ? selectedOrders : null
    };
    
    onExport(exportData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Download size={20} />
            <span>Export Orders</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {/* Export Summary */}
          <div className="export-summary">
            <div className="summary-item">
              <FileText size={16} />
              <span>
                {selectedOrders.length > 0 
                  ? `${selectedOrders.length} selected orders`
                  : `${totalOrders} total orders`
                }
              </span>
            </div>
            <div className="summary-item">
              <Filter size={16} />
              <span>
                {includeFilters ? 'With current filters' : 'All data'}
              </span>
            </div>
          </div>

          {/* Export Format */}
          <div className="form-group">
            <label className="form-label">Export Format</label>
            <div className="format-options">
              {formatOptions.map(option => (
                <button
                  key={option.value}
                  className={`format-option ${exportFormat === option.value ? 'selected' : ''}`}
                  onClick={() => setExportFormat(option.value)}
                >
                  <div className="format-info">
                    <div className="format-name">{option.label}</div>
                    <div className="format-description">{option.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="form-group">
            <label className="form-label">
              <Calendar size={16} />
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="form-select"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={includeFilters}
                onChange={(e) => setIncludeFilters(e.target.checked)}
              />
              <span>Include current filters in export</span>
            </label>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={16} />
            Export Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
