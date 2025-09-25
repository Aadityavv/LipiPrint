import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';

const InvoiceGenerator = {
  // Generate PDF invoice from order data
  async generateInvoice(orderData, onSuccess, onError) {
    try {
      console.log('[InvoiceGenerator] Starting PDF generation for order:', orderData.id);
      
      // Request storage permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs storage permission to save invoices',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error('Storage permission denied');
        }
      }

      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(orderData);
      
      // Configure PDF options
      const options = {
        html: htmlContent,
        fileName: `invoice_${orderData.id}_${new Date().getTime()}`,
        directory: Platform.OS === 'android' ? 'Downloads' : 'Documents',
        width: 612,
        height: 792,
        padding: 24,
        bgColor: '#FFFFFF'
      };

      console.log('[InvoiceGenerator] Generating PDF with options:', options);
      
      // Generate PDF
      const pdf = await RNHTMLtoPDF.convert(options);
      
      console.log('[InvoiceGenerator] PDF generated successfully:', pdf.filePath);
      
      if (onSuccess) {
        onSuccess(pdf);
      }
      
      return pdf;
      
    } catch (error) {
      console.error('[InvoiceGenerator] Error generating PDF:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  },

  // Generate HTML content for the invoice
  generateInvoiceHTML(orderData) {
    const {
      id,
      user,
      printJobs = [],
      status,
      totalAmount,
      createdAt,
      deliveryType,
      deliveryAddress,
      subtotal,
      discount,
      gst,
      delivery,
      grandTotal,
      breakdown = [],
      awbNumber,
      courierName,
      expectedDeliveryDate
    } = orderData;

    const currentDate = new Date().toLocaleDateString();
    const orderDate = createdAt ? new Date(createdAt).toLocaleDateString() : currentDate;
    
    // Calculate totals
    const finalSubtotal = subtotal || 0;
    const finalDiscount = discount || 0;
    const finalGst = gst || 0;
    const finalDelivery = delivery || 0;
    const finalTotal = grandTotal || totalAmount || 0;

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Invoice #${id}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                background: #fff;
                padding: 20px;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                background: #fff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }
            
            .header h1 {
                font-size: 32px;
                font-weight: bold;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 16px;
                opacity: 0.9;
            }
            
            .invoice-info {
                display: flex;
                justify-content: space-between;
                padding: 30px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
            }
            
            .invoice-details {
                flex: 1;
            }
            
            .customer-details {
                flex: 1;
                text-align: right;
            }
            
            .invoice-details h2, .customer-details h2 {
                font-size: 18px;
                color: #495057;
                margin-bottom: 15px;
                font-weight: 600;
            }
            
            .invoice-details p, .customer-details p {
                margin-bottom: 5px;
                color: #6c757d;
            }
            
            .items-section {
                padding: 30px;
            }
            
            .items-section h2 {
                font-size: 20px;
                color: #495057;
                margin-bottom: 20px;
                border-bottom: 2px solid #667eea;
                padding-bottom: 10px;
            }
            
            .file-item {
                background: #f8f9fa;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 6px;
                border-left: 4px solid #667eea;
            }
            
            .file-name {
                font-weight: 600;
                color: #495057;
                margin-bottom: 5px;
            }
            
            .file-details {
                color: #6c757d;
                font-size: 14px;
            }
            
            .breakdown-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
                background: #fff;
                border-radius: 6px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .breakdown-table th {
                background: #667eea;
                color: white;
                padding: 15px;
                text-align: left;
                font-weight: 600;
            }
            
            .breakdown-table td {
                padding: 12px 15px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .breakdown-table tr:last-child td {
                border-bottom: none;
            }
            
            .totals-section {
                padding: 30px;
                background: #f8f9fa;
            }
            
            .totals-table {
                width: 100%;
                max-width: 400px;
                margin-left: auto;
            }
            
            .totals-table td {
                padding: 8px 0;
                border-bottom: 1px solid #dee2e6;
            }
            
            .totals-table .label {
                color: #6c757d;
                font-weight: 500;
            }
            
            .totals-table .amount {
                text-align: right;
                font-weight: 600;
                color: #495057;
            }
            
            .totals-table .total-row {
                border-top: 2px solid #667eea;
                border-bottom: none;
                font-size: 18px;
                font-weight: bold;
                color: #667eea;
            }
            
            .shipping-info {
                padding: 20px 30px;
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
            }
            
            .shipping-info h3 {
                color: #1976d2;
                margin-bottom: 10px;
                font-size: 16px;
            }
            
            .shipping-info p {
                color: #424242;
                margin-bottom: 5px;
            }
            
            .footer {
                padding: 30px;
                text-align: center;
                background: #f8f9fa;
                color: #6c757d;
                border-top: 1px solid #e9ecef;
            }
            
            .footer p {
                margin-bottom: 10px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .status-${status?.toLowerCase() || 'pending'} {
                background: ${this.getStatusColor(status)};
                color: white;
            }
            
            @media print {
                body { padding: 0; }
                .invoice-container { box-shadow: none; }
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="header">
                <h1>LipiPrint</h1>
                <p>Your Trusted Printing Partner</p>
            </div>
            
            <!-- Invoice Info -->
            <div class="invoice-info">
                <div class="invoice-details">
                    <h2>Invoice Details</h2>
                    <p><strong>Invoice #:</strong> ${id}</p>
                    <p><strong>Date:</strong> ${orderDate}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-${status?.toLowerCase() || 'pending'}">${status || 'PENDING'}</span></p>
                    <p><strong>Delivery:</strong> ${deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</p>
                </div>
                
                <div class="customer-details">
                    <h2>Bill To</h2>
                    <p><strong>${user?.name || 'Customer'}</strong></p>
                    <p>${user?.email || ''}</p>
                    <p>${user?.phone || ''}</p>
                    ${deliveryAddress ? `<p><strong>Delivery Address:</strong><br>${deliveryAddress}</p>` : ''}
                </div>
            </div>
            
            <!-- Items Section -->
            <div class="items-section">
                <h2>Order Items</h2>
                ${printJobs.map(printJob => `
                    <div class="file-item">
                        <div class="file-name">${printJob.file?.originalFilename || printJob.file?.filename || 'Unknown File'}</div>
                        <div class="file-details">
                            ${printJob.file?.pages || 0} pages • ${printJob.status || 'QUEUED'}
                            ${printJob.options ? `<br><small>${this.formatPrintOptions(printJob.options)}</small>` : ''}
                        </div>
                    </div>
                `).join('')}
                
                ${breakdown.length > 0 ? `
                    <table class="breakdown-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th>Quantity</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${breakdown.map(item => `
                                <tr>
                                    <td>${item.description || 'Print Service'}</td>
                                    <td>${item.quantity || 1}</td>
                                    <td>₹${(item.rate || 0).toFixed(2)}</td>
                                    <td>₹${(item.total || 0).toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : ''}
            </div>
            
            <!-- Shipping Information -->
            ${deliveryType === 'DELIVERY' && (awbNumber || courierName) ? `
                <div class="shipping-info">
                    <h3>🚚 Shipping Information</h3>
                    ${awbNumber ? `<p><strong>AWB Number:</strong> ${awbNumber}</p>` : ''}
                    ${courierName ? `<p><strong>Courier:</strong> ${courierName}</p>` : ''}
                    ${expectedDeliveryDate ? `<p><strong>Expected Delivery:</strong> ${new Date(expectedDeliveryDate).toLocaleDateString()}</p>` : ''}
                </div>
            ` : ''}
            
            <!-- Totals -->
            <div class="totals-section">
                <table class="totals-table">
                    <tbody>
                        <tr>
                            <td class="label">Subtotal:</td>
                            <td class="amount">₹${finalSubtotal.toFixed(2)}</td>
                        </tr>
                        ${finalDiscount > 0 ? `
                            <tr>
                                <td class="label">Discount:</td>
                                <td class="amount">-₹${finalDiscount.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        ${finalGst > 0 ? `
                            <tr>
                                <td class="label">GST (18%):</td>
                                <td class="amount">₹${finalGst.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        ${finalDelivery > 0 ? `
                            <tr>
                                <td class="label">Delivery:</td>
                                <td class="amount">₹${finalDelivery.toFixed(2)}</td>
                            </tr>
                        ` : ''}
                        <tr class="total-row">
                            <td class="label">Total Amount:</td>
                            <td class="amount">₹${finalTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>Thank you for choosing LipiPrint!</strong></p>
                <p>For support, contact us at support@lipiprint.in</p>
                <p>Generated on ${currentDate}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    return html;
  },

  // Get status color for CSS
  getStatusColor(status) {
    switch (status?.toUpperCase()) {
      case 'PENDING': return '#FFA500';
      case 'PROCESSING': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'OUT_FOR_DELIVERY': return '#FF9800';
      case 'DELIVERED': return '#66BB6A';
      case 'CANCELLED': return '#FF3B30';
      default: return '#6c757d';
    }
  },

  // Format print options for display
  formatPrintOptions(options) {
    if (!options) return '';
    
    try {
      const parsed = JSON.parse(options);
      const formatted = [];
      
      if (parsed.color) formatted.push(`Color: ${parsed.color}`);
      if (parsed.paper) formatted.push(`Paper: ${parsed.paper}`);
      if (parsed.quality) formatted.push(`Quality: ${parsed.quality}`);
      if (parsed.side) formatted.push(`Side: ${parsed.side}`);
      
      return formatted.join(' • ');
    } catch (error) {
      return options; // Return as-is if not JSON
    }
  },

  // Show download success message
  showDownloadSuccess(filePath) {
    Alert.alert(
      'Invoice Downloaded',
      `Invoice saved to: ${filePath}`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  },

  // Show download error message
  showDownloadError(error) {
    Alert.alert(
      'Download Failed',
      `Failed to generate invoice: ${error.message}`,
      [
        { text: 'OK', style: 'default' }
      ]
    );
  }
};

export default InvoiceGenerator;
