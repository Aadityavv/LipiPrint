import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import { PermissionsAndroid, Platform } from 'react-native';
import { roundIndianPrice } from '../utils/priceUtils';

const InvoiceGenerator = {
  // Generate PDF invoice from order data
  async generateInvoice(orderData, onSuccess, onError) {
    try {
      console.log('[InvoiceGenerator] Starting PDF generation for order:', orderData?.id);
      console.log('[InvoiceGenerator] Order data structure:', {
        id: orderData?.id,
        hasUser: !!orderData?.user,
        printJobsType: Array.isArray(orderData?.printJobs) ? 'array' : typeof orderData?.printJobs,
        printJobsLength: orderData?.printJobs?.length || 0,
        hasBreakdown: !!orderData?.breakdown,
        breakdownType: Array.isArray(orderData?.breakdown) ? 'array' : typeof orderData?.breakdown
      });
      
      // Request storage permission for Android (only for versions < 11)
      if (Platform.OS === 'android' && Platform.Version < 30) {
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
          throw new Error('Storage permission denied. Please allow storage access to save invoices.');
        }
      }

      // Generate HTML content
      const htmlContent = this.generateInvoiceHTML(orderData);
      
      // Configure PDF options with better directory handling
      const options = {
        html: htmlContent,
        fileName: `invoice_${orderData.id}_${new Date().getTime()}`,
        directory: Platform.OS === 'android' 
          ? (Platform.Version >= 30 ? 'Download' : 'Documents') 
          : 'Documents',
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
      
      // Provide more specific error messages
      let errorMessage = error.message || 'Failed to generate invoice PDF';
      
      if (error.message && error.message.includes('permission')) {
        errorMessage = 'Storage permission denied. Please allow storage access in app settings to save invoices.';
      } else if (error.message && error.message.includes('template')) {
        errorMessage = 'Invoice template error. Please contact support.';
      } else if (error.message && error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      const enhancedError = new Error(errorMessage);
      enhancedError.originalError = error;
      
      if (onError) {
        onError(enhancedError);
      }
      throw enhancedError;
    }
  },

  // Generate HTML content for the invoice
  generateInvoiceHTML(orderData) {
    // Ensure we have valid order data
    if (!orderData) {
      throw new Error('Order data is required');
    }

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

    // Ensure arrays are not null
    const safePrintJobs = Array.isArray(printJobs) ? printJobs : [];
    const safeBreakdown = Array.isArray(breakdown) ? breakdown : [];

    const currentDate = new Date().toLocaleDateString();
    const orderDate = createdAt ? new Date(createdAt).toLocaleDateString() : currentDate;
    
    // Calculate totals
    const finalSubtotal = subtotal || 0;
    const finalDiscount = discount || 0;
    const finalGst = gst || 0;
    const finalDelivery = delivery || 0;
    const finalTotal = roundIndianPrice(grandTotal || totalAmount || 0);

    // Generate order items HTML
    const orderItemsHTML = safePrintJobs.map(printJob => {
      const printOptions = printJob.options ? this.formatPrintOptions(printJob.options) : 'Standard';
      return `
        <tr style="border-bottom:1px solid #eee;">
          <td style="padding:8px 6px;">${printJob.file?.originalFilename || printJob.file?.filename || 'Unknown File'}</td>
          <td style="padding:8px 6px;">${printOptions}</td>
          <td style="padding:8px 6px;">${printJob.file?.pages || 0}</td>
          <td style="padding:8px 6px;">₹${((printJob.file?.pages || 0) * 6).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    // Generate shipping info if available
    const shippingInfoHTML = (deliveryType === 'DELIVERY' && (awbNumber || courierName)) ? `
      <div class="section">
        <div class="section-title">Shipping Information</div>
        <div class="highlight">
          ${awbNumber ? `<div><b>AWB Number:</b> ${awbNumber}</div>` : ''}
          ${courierName ? `<div><b>Courier:</b> ${courierName}</div>` : ''}
          ${expectedDeliveryDate ? `<div><b>Expected Delivery:</b> ${new Date(expectedDeliveryDate).toLocaleDateString()}</div>` : ''}
        </div>
      </div>
    ` : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Invoice - LipiPrint</title>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f7f9fb; color: #222; }
            .container { max-width: 700px; margin: 40px auto; background: #fff; border-radius: 14px; box-shadow: 0 4px 24px #0001; padding: 32px 28px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
            .logo { height: 60px; }
            .company-info { font-size: 15px; line-height: 1.5; margin-top: 8px; color: #555; }
            .invoice-meta { text-align: right; font-size: 15px; }
            .invoice-title { font-size: 28px; font-weight: bold; color: #2d6cdf; margin-bottom: 8px; letter-spacing: 1px; }
            .section { margin-top: 36px; }
            .section-title { font-size: 19px; font-weight: bold; color: #4a4a4a; margin-bottom: 14px; letter-spacing: 0.5px; }
            .info-table { width: 100%; border-collapse: collapse; }
            .info-table td { padding: 3px 0; font-size: 15px; }
            .group-block { background: #f0f4ff; border-radius: 10px; padding: 18px 14px; margin-bottom: 18px; border: 1px solid #e0e7ef; }
            .group-title { font-size: 16px; font-weight: bold; color: #764ba2; margin-bottom: 6px; }
            .options-list { margin-bottom: 8px; margin-left: 8px; }
            .options-list span { display: block; color: #333; font-size: 14px; }
            .files-list { margin-left: 8px; }
            .file-row { margin-bottom: 2px; }
            .file-name { color: #22194f; font-weight: bold; font-size: 14px; }
            .file-meta { color: #888; font-size: 13px; }
            .order-note-block { background: #fffbe6; border-left: 4px solid #ffe066; border-radius: 8px; padding: 12px 14px; margin-top: 18px; color: #7a5d00; font-size: 15px; }
            .totals { margin-top: 18px; width: 100%; border-collapse: collapse; }
            .totals td { font-size: 15px; padding: 6px 0; }
            .totals .label { text-align: right; color: #666; }
            .totals .value { text-align: right; font-weight: bold; }
            .grand-total { font-size: 20px; color: #2d6cdf; font-weight: bold; border-top: 2px solid #eee; padding-top: 10px; }
            .footer { margin-top: 40px; text-align: center; color: #888; font-size: 14px; border-top: 1px solid #eee; padding-top: 16px; }
            .highlight { background: #eaf6ff; border-radius: 8px; padding: 12px 10px; margin-bottom: 10px; }
        </style>
    </head>
    <body>
    <div class="container">
        <div class="header">
            <div>
                    <div class="company-info">
                        LipiPrint<br />
                        123 Printing Street, Saharanpur, Uttar Pradesh, India<br />
                        support@lipiprint.in | +91 12345 67890<br />
                        <b>GSTIN:</b> 09AJ0PN3715E1Z3
                    </div>
            </div>
            <div class="invoice-meta">
                    <div class="invoice-title">INVOICE</div>
                        <div>Invoice #: LP${id}</div>
                        <div>Date: ${orderDate}</div>
                        <div>Status: ${status || 'PENDING'}</div>
                    </div>
        </div>
        <div class="section">
            <div class="section-title">Bill To</div>
            <table class="info-table">
                <tr><td><b>Name:</b></td><td>${user?.name || 'Customer'}</td></tr>
                <tr><td><b>Email:</b></td><td>${user?.email || ''}</td></tr>
                <tr><td><b>Phone:</b></td><td>${user?.phone || ''}</td></tr>
                <tr><td><b>Address:</b></td><td>${deliveryAddress || ''}</td></tr>
                <tr><td><b>GSTIN:</b></td><td>${user?.gstin || 'Not Provided'}</td></tr>
            </table>
        </div>
        <div class="section">
            <div class="section-title">Order Summary</div>
            <table class="info-table">
                <tr><td><b>Order ID:</b></td><td>LP${id}</td></tr>
                <tr><td><b>Order Date:</b></td><td>${orderDate}</td></tr>
                <tr><td><b>Status:</b></td><td>${status || 'PENDING'}</td></tr>
                <tr><td><b>Delivery Type:</b></td><td>${deliveryType === 'DELIVERY' ? 'Home Delivery' : 'Store Pickup'}</td></tr>
            </table>
        </div>
        <div class="section">
            <div class="section-title">Order Items</div>
            <table class="info-table" style="border-collapse:collapse;width:100%;margin-bottom:10px;">
                <tr style="background:#f0f4ff;color:#22194f;font-weight:bold;">
                    <td style="padding:8px 6px;">File Name</td>
                    <td style="padding:8px 6px;">Print Options</td>
                    <td style="padding:8px 6px;">Pages</td>
                    <td style="padding:8px 6px;">Price</td>
                </tr>
                ${orderItemsHTML}
            </table>
        </div>
        ${shippingInfoHTML}
        <div class="section">
            <div class="section-title">Pricing</div>
            <table class="totals" style="background:#f8f9fa;border-radius:10px;padding:10px;">
                <tr><td class="label">Subtotal</td><td class="value">INR ${finalSubtotal.toFixed(2)}</td></tr>
                ${finalDiscount > 0 ? `<tr><td class="label">Discount</td><td class="value">INR -${finalDiscount.toFixed(2)}</td></tr>` : ''}
                ${orderData.isIntraState ? `
                  <tr><td class="label">CGST (9%)</td><td class="value">INR ${(orderData.cgst || 0).toFixed(2)}</td></tr>
                  <tr><td class="label">SGST (9%)</td><td class="value">INR ${(orderData.sgst || 0).toFixed(2)}</td></tr>
                ` : `
                  <tr><td class="label">IGST (18%)</td><td class="value">INR ${(orderData.igst || finalGst).toFixed(2)}</td></tr>
                `}
                <tr><td class="label">Delivery</td><td class="value">INR ${finalDelivery.toFixed(2)}</td></tr>
                <tr><td class="label grand-total">Grand Total</td><td class="value grand-total">INR ${finalTotal}</td></tr>
            </table>
        </div>
        <div class="footer" style="margin-top:40px;text-align:center;color:#888;font-size:14px;border-top:1px solid #eee;padding-top:16px;background:#fff;">
            Thank you for choosing LipiPrint! For support, contact support@lipiprint.in<br/>
            <span style="font-size:13px;color:#bbb;">This is a computer-generated invoice and does not require a signature.</span>
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
