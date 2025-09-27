import React from 'react';
import { Search, Filter, Calendar, SortAsc, SortDesc, X } from 'lucide-react';
import './OrderFilters.css';

const OrderFilters = ({ 
  filters, 
  onFilterChange, 
  onClearFilters, 
  isOpen, 
  onToggle 
}) => {
  const statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const dateRangeOptions = [
    { value: 'ALL', label: 'All Time' },
    { value: 'TODAY', label: 'Today' },
    { value: 'WEEK', label: 'This Week' },
    { value: 'MONTH', label: 'This Month' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'id', label: 'Order ID' },
    { value: 'userName', label: 'Customer Name' },
    { value: 'totalAmount', label: 'Total Amount' },
    { value: 'status', label: 'Status' }
  ];

  const hasActiveFilters = filters.search || filters.status !== 'ALL' || filters.dateRange !== 'ALL';

  return (
    <div className={`order-filters ${isOpen ? 'open' : ''}`}>
      <div className="filters-header">
        <div className="filters-title">
          <Filter size={20} />
          <span>Filters & Search</span>
          {hasActiveFilters && (
            <span className="active-count">
              {[filters.search, filters.status !== 'ALL', filters.dateRange !== 'ALL'].filter(Boolean).length}
            </span>
          )}
        </div>
        <div className="filters-actions">
          {hasActiveFilters && (
            <button 
              className="clear-filters-btn"
              onClick={onClearFilters}
              title="Clear all filters"
            >
              <X size={16} />
              Clear
            </button>
          )}
          <button 
            className="toggle-filters-btn"
            onClick={onToggle}
            title={isOpen ? 'Hide filters' : 'Show filters'}
          >
            {isOpen ? <X size={16} /> : <Filter size={16} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="filters-content">
          {/* Search */}
          <div className="filter-group">
            <label className="filter-label">
              <Search size={16} />
              Search Orders
            </label>
            <input
              type="text"
              placeholder="Search by order ID, customer name, or status..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="search-input"
            />
          </div>

          {/* Status Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <Filter size={16} />
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="filter-select"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="filter-group">
            <label className="filter-label">
              <Calendar size={16} />
              Date Range
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => onFilterChange({ dateRange: e.target.value })}
              className="filter-select"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="filter-group">
            <label className="filter-label">
              {filters.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              Sort By
            </label>
            <div className="sort-controls">
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                className="filter-select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="sort-order-btn"
                onClick={() => onFilterChange({ 
                  sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
                })}
                title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {filters.sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFilters;
