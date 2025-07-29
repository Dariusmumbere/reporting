// download.js - Premium Report PDF Generation

// Global Configuration with premium colors
const CONFIG = {
  DESIGN: {
    PRIMARY_COLOR: [30, 50, 90],    // Deep navy blue
    SECONDARY_COLOR: [0, 120, 215], // Microsoft blue
    ACCENT_COLOR: [200, 80, 60],    // Coral accent
    LIGHT_GRAY: [248, 249, 250],    // Very light gray
    DARK_GRAY: [52, 58, 64],        // Dark slate
    SUCCESS_COLOR: [40, 167, 69],   // Bootstrap success green
    WARNING_COLOR: [255, 193, 7],   // Bootstrap warning yellow
    DANGER_COLOR: [220, 53, 69],    // Bootstrap danger red
    TEXT_COLOR: [33, 37, 41],       // Dark text
    LIGHT_TEXT: [248, 249, 250]     // Light text
  },
  LAYOUT: {
    MARGIN: 20,
    CONTENT_WIDTH: 170,
    LINE_HEIGHT: 7,
    SECTION_SPACING: 15,
    PAGE_PADDING: 15
  }
};

// Modern gradient generator
function createGradient(doc, yPosition, height, color) {
  const gradient = doc.context2d.createLinearGradient(0, yPosition, 0, yPosition + height);
  gradient.addColorStop(0, `rgba(${color.join(',')}, 0.9)`);
  gradient.addColorStop(1, `rgba(${color.join(',')}, 0.6)`);
  return gradient;
}

// Load jsPDF library with premium features
async function loadJSPDFLibrary() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      // Load additional plugins for premium features
      const pluginScript = document.createElement('script');
      pluginScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
      pluginScript.onload = resolve;
      pluginScript.onerror = reject;
      document.head.appendChild(pluginScript);
    };
    script.onerror = () => reject(new Error('Failed to load jsPDF library'));
    document.head.appendChild(script);
  });
}

// Enhanced image loader with premium placeholder
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create a premium placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Premium gradient background
      const gradient = ctx.createLinearGradient(0, 0, 200, 100);
      gradient.addColorStop(0, 'rgba(30, 50, 90, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 120, 215, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 100);
      
      // Premium text
      ctx.font = 'bold 16px "Helvetica Neue", Arial';
      ctx.fillStyle = 'rgba(30, 50, 90, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Organization Logo', 100, 60);
      
      resolve(canvas);
    };
    img.src = url;
  });
}

// Premium header generator with organization details
async function createPremiumHeader(doc, title, organization) {
  const { PRIMARY_COLOR, LIGHT_TEXT } = CONFIG.DESIGN;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add gradient background with subtle pattern
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, pageWidth, 70, 'F');
  
  // Add organization logo (left side)
  let logoImg;
  try {
    if (organization?.logo_url) {
      logoImg = await loadImage(`${API_BASE_URL}${organization.logo_url}`);
      const logoHeight = 25;
      const logoWidth = (logoImg.width * logoHeight) / logoImg.height;
      doc.addImage(logoImg, 'PNG', CONFIG.LAYOUT.MARGIN, 20, logoWidth, logoHeight);
    }
  } catch (error) {
    console.warn('Logo not loaded:', error.message);
  }
  
  // Add organization name and title (center)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...LIGHT_TEXT);
  
  if (organization?.name) {
    doc.text(organization.name, pageWidth / 2, 30, { align: 'center' });
  }
  
  doc.setFontSize(18);
  doc.text(title, pageWidth / 2, 45, { align: 'center' });
  
  // Add report type ribbon (right side)
  doc.setFillColor(200, 80, 60); // Coral accent
  doc.roundedRect(pageWidth - 70, 15, 60, 20, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL REPORT', pageWidth - 40, 28, { align: 'center' });
  
  return 75; // Return new Y position
}

// Premium status badge
function createPremiumStatusBadge(doc, status, x, y) {
  const statusConfig = {
    approved: { color: CONFIG.DESIGN.SUCCESS_COLOR, text: '✓ APPROVED' },
    pending: { color: CONFIG.DESIGN.WARNING_COLOR, text: '⏳ PENDING REVIEW' },
    rejected: { color: CONFIG.DESIGN.DANGER_COLOR, text: '✗ REJECTED' }
  };
  
  const statusInfo = statusConfig[status.toLowerCase()] || statusConfig.pending;
  
  // Premium rounded badge with shadow effect
  doc.setFillColor(...statusInfo.color);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(x, y, 60, 18, 4, 4, 'FD');
  
  // White text with subtle shadow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(statusInfo.text, x + 30, y + 11, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
}

// Premium section divider with icon
function createPremiumSectionDivider(doc, yPos, title = '', icon = '') {
  const { PRIMARY_COLOR, LIGHT_GRAY } = CONFIG.DESIGN;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add icon if provided
  if (icon) {
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text(icon, CONFIG.LAYOUT.MARGIN, yPos);
  }
  
  if (title) {
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, CONFIG.LAYOUT.MARGIN + (icon ? 10 : 0), yPos);
    yPos += 5;
  }
  
  // Thin line with gradient effect
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.3);
  doc.line(CONFIG.LAYOUT.MARGIN, yPos, pageWidth - CONFIG.LAYOUT.MARGIN, yPos);
  
  return yPos + 10;
}

// Function to format template data for display
function formatTemplateData(templateData) {
  if (!templateData) return null;
  
  let formattedText = '';
  
  for (const [field, value] of Object.entries(templateData)) {
    if (value === null || value === undefined) continue;
    
    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    if (Array.isArray(value)) {
      formattedText += `${fieldName}: ${value.join(', ')}\n\n`;
    } else if (typeof value === 'object') {
      formattedText += `${fieldName}:\n${JSON.stringify(value, null, 2)}\n\n`;
    } else if (typeof value === 'boolean') {
      formattedText += `${fieldName}: ${value ? 'Yes' : 'No'}\n\n`;
    } else {
      formattedText += `${fieldName}: ${value}\n\n`;
    }
  }
  
  return formattedText.trim();
}

// Generate Premium PDF Report
async function generatePremiumReportPDF(report, organization) {
  try {
    // Initialize PDF document with premium settings
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      filters: ['ASCIIHexEncode']
    });
    
    // Set default font
    doc.setFont('helvetica');
    doc.setFontSize(11);
    
    // Add Premium Header with organization info
    let currentY = await createPremiumHeader(doc, report.title, organization);
    
    // Report Metadata in premium card layout
    doc.setFillColor(...CONFIG.DESIGN.LIGHT_GRAY);
    doc.roundedRect(
      CONFIG.LAYOUT.MARGIN, 
      currentY, 
      doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2), 
      40, 
      3, 
      3, 
      'F'
    );
    
    // Left column - Report Info
    doc.setFontSize(10);
    doc.setTextColor(...CONFIG.DESIGN.DARK_GRAY);
    doc.text(`Report ID:`, CONFIG.LAYOUT.MARGIN + 5, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(`#REP-${report.id.toString().padStart(4, '0')}`, CONFIG.LAYOUT.MARGIN + 25, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Author:`, CONFIG.LAYOUT.MARGIN + 5, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(report.author_name, CONFIG.LAYOUT.MARGIN + 25, currentY + 16);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Category:`, CONFIG.LAYOUT.MARGIN + 5, currentY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(report.category, CONFIG.LAYOUT.MARGIN + 25, currentY + 24);
    
    // Right column - Dates
    doc.setFont('helvetica', 'normal');
    doc.text(`Created:`, CONFIG.LAYOUT.MARGIN + 90, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(report.created_at).toLocaleDateString(), CONFIG.LAYOUT.MARGIN + 110, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Last Updated:`, CONFIG.LAYOUT.MARGIN + 90, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(report.updated_at || report.created_at).toLocaleDateString(), CONFIG.LAYOUT.MARGIN + 110, currentY + 16);
    
    // Status badge (top right)
    createPremiumStatusBadge(doc, report.status, doc.internal.pageSize.getWidth() - CONFIG.LAYOUT.MARGIN - 60, currentY + 10);
    
    currentY += 45;
    
    // Official Report Statement
    doc.setFontSize(10);
    doc.setTextColor(...CONFIG.DESIGN.DARK_GRAY);
    doc.setFont('helvetica', 'italic');
    doc.text(`This is the official report for ${organization?.name || 'the organization'}. Unauthorized distribution is prohibited.`, 
      CONFIG.LAYOUT.MARGIN, currentY, { maxWidth: doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2) });
    
    currentY += 10;
    
    // Description section
    currentY = createPremiumSectionDivider(doc, currentY, 'Report Details', '📋');
    
    doc.setFontSize(11);
    doc.setTextColor(...CONFIG.DESIGN.TEXT_COLOR);
    doc.setFont('helvetica', 'normal');
    
    // Convert HTML description to plain text with basic formatting
    const plainTextDescription = htmlToPlainText(report.description);
    
    // Split the text into lines that fit the content width
    const descLines = doc.splitTextToSize(plainTextDescription, doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2));
    
    // Add each line to the PDF
    descLines.forEach(line => {
      if (line.trim() === '') return;
      
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.text(line, CONFIG.LAYOUT.MARGIN, currentY);
      currentY += CONFIG.LAYOUT.LINE_HEIGHT;
    });
    
    currentY += CONFIG.LAYOUT.SECTION_SPACING;
    
    // Template Data (if exists)
    if (report.template_data) {
      currentY = createPremiumSectionDivider(doc, currentY, 'Form Data', '📊');
      
      // Format template data for display
      const formattedData = formatTemplateData(report.template_data);
      
      if (formattedData) {
        const dataLines = doc.splitTextToSize(formattedData, doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2));
        
        // Add light background for data section
        doc.setFillColor(245, 245, 245);
        doc.rect(CONFIG.LAYOUT.MARGIN, currentY, doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2), (dataLines.length * CONFIG.LAYOUT.LINE_HEIGHT) + 10, 'F');
        
        dataLines.forEach(line => {
          if (currentY > doc.internal.pageSize.height - 20) {
            doc.addPage();
            currentY = 20;
          }
          
          doc.text(line, CONFIG.LAYOUT.MARGIN + 5, currentY + 5);
          currentY += CONFIG.LAYOUT.LINE_HEIGHT;
        });
        
        currentY += 15;
      }
    }
    
    // Admin Comments (if exists)
    if (report.admin_comments) {
      currentY = createPremiumSectionDivider(doc, currentY, 'Administrator Feedback', '💬');
      
      // Comment card with light background
      doc.setFillColor(253, 245, 240); // Light peach background
      doc.roundedRect(
        CONFIG.LAYOUT.MARGIN, 
        currentY, 
        doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2), 
        30, 
        3, 
        3, 
        'F'
      );
      
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      const commentLines = doc.splitTextToSize(report.admin_comments, doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2) - 10);
      
      // Add each comment line
      let commentY = currentY + 7;
      commentLines.forEach(line => {
        if (commentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          commentY = 20;
          doc.setFillColor(253, 245, 240);
          doc.roundedRect(
            CONFIG.LAYOUT.MARGIN, 
            commentY - 7, 
            doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2), 
            30, 
            3, 
            3, 
            'F'
          );
        }
        
        doc.text(line, CONFIG.LAYOUT.MARGIN + 5, commentY);
        commentY += CONFIG.LAYOUT.LINE_HEIGHT;
      });
      
      currentY += 35 + (commentLines.length * CONFIG.LAYOUT.LINE_HEIGHT);
    }
    
    // Attachments (if exists)
    if (report.attachments?.length > 0) {
      currentY = createPremiumSectionDivider(doc, currentY, 'Attachments', '📎');
      
      doc.setFontSize(10);
      report.attachments.forEach((attachment, index) => {
        if (currentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 20;
        }
        
        // Attachment card with light blue background
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(
          CONFIG.LAYOUT.MARGIN, 
          currentY, 
          doc.internal.pageSize.getWidth() - (CONFIG.LAYOUT.MARGIN * 2), 
          10, 
          2, 
          2, 
          'F'
        );
        
        // File name with icon
        doc.setTextColor(...CONFIG.DESIGN.PRIMARY_COLOR);
        doc.text(`📄 ${attachment.name}`, CONFIG.LAYOUT.MARGIN + 5, currentY + 7);
        
        // File size
        doc.setTextColor(...CONFIG.DESIGN.DARK_GRAY);
        doc.text(
          formatFileSize(attachment.size), 
          doc.internal.pageSize.getWidth() - CONFIG.LAYOUT.MARGIN - 5, 
          currentY + 7, 
          { align: 'right' }
        );
        
        currentY += 12;
      });
    }
    
    // Premium footer with organization info
    const addFooter = (pageNumber, totalPages) => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(CONFIG.LAYOUT.MARGIN, doc.internal.pageSize.height - 15, doc.internal.pageSize.width - CONFIG.LAYOUT.MARGIN, doc.internal.pageSize.height - 15);
      
      // Footer text
      const footerY = doc.internal.pageSize.height - 10;
      
      doc.text(`${organization?.name || 'ReportHub'} • ${new Date().toLocaleDateString()}`, CONFIG.LAYOUT.MARGIN, footerY);
      doc.text(`Page ${pageNumber} of ${totalPages}`, doc.internal.pageSize.getWidth() / 2, footerY, { align: 'center' });
      doc.text('CONFIDENTIAL', doc.internal.pageSize.getWidth() - CONFIG.LAYOUT.MARGIN, footerY, { align: 'right' });
    };
    
    // Add footer to each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addFooter(i, pageCount);
    }
    
    return doc;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
}

// Enhanced download function with premium UI
async function downloadReportAsPDF(reportId) {
  try {
    showModernToast('Preparing premium report...', 'info', {
      icon: '⏳',
      autoClose: 3000
    });
    
    // Fetch report data
    const reportResponse = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!reportResponse.ok) throw new Error('Failed to fetch report');
    const report = await reportResponse.json();
    
    // Fetch organization data
    let organization = null;
    try {
      const orgResponse = await fetch(`${API_BASE_URL}/organization`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (orgResponse.ok) {
        organization = await orgResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch organization data:', error);
    }
    
    // Generate premium PDF
    const pdfDoc = await generatePremiumReportPDF(report, organization);
    
    // Sanitize filename
    const cleanTitle = report.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    const orgName = organization?.name ? organization.name.replace(/[^a-zA-Z0-9]/g, '') : '';
    const fileName = orgName ? `${orgName}_Report_${cleanTitle}.pdf` : `Report_${cleanTitle}.pdf`;
    
    // Show success before download starts
    showModernToast('Premium report ready!', 'success', {
      icon: '✓',
      autoClose: 2000
    });
    
    // Small delay for better UX
    setTimeout(() => {
      pdfDoc.save(fileName);
    }, 500);
    
  } catch (error) {
    console.error('Download Error:', error);
    showModernToast('Failed to generate report', 'danger', {
      icon: '✗',
      autoClose: 5000
    });
  }
}

// Helper function to convert HTML to plain text (unchanged from your original)
function htmlToPlainText(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Replace common HTML elements with their text equivalents
  tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    el.outerHTML = '\n\n' + el.textContent.toUpperCase() + '\n\n';
  });
  
  tempDiv.querySelectorAll('p').forEach(el => {
    el.outerHTML = '\n' + el.textContent + '\n';
  });
  
  tempDiv.querySelectorAll('li').forEach(el => {
    el.outerHTML = '• ' + el.textContent + '\n';
  });
  
  tempDiv.querySelectorAll('br').forEach(el => {
    el.outerHTML = '\n';
  });
  
  tempDiv.querySelectorAll('strong, b').forEach(el => {
    el.outerHTML = el.textContent.toUpperCase();
  });
  
  let text = tempDiv.textContent;
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n');
  return text.trim();
}

// Modern file size formatter (unchanged from your original)
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Modern toast notification system (unchanged from your original)
function showModernToast(message, type, options = {}) {
  const toast = document.createElement('div');
  toast.className = `modern-toast modern-toast-${type}`;
  
  const icon = options.icon || '';
  const autoClose = options.autoClose || 5000;
  
  toast.innerHTML = `
    <div class="modern-toast-content">
      <span class="modern-toast-icon">${icon}</span>
      <span class="modern-toast-message">${message}</span>
    </div>
    <div class="modern-toast-progress"></div>
  `;
  
  document.body.appendChild(toast);
  
  if (autoClose) {
    const progress = toast.querySelector('.modern-toast-progress');
    progress.style.animation = `progress ${autoClose}ms linear forwards`;
    
    setTimeout(() => {
      toast.classList.add('modern-toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }, autoClose);
  }
  
  return {
    close: () => {
      toast.classList.add('modern-toast-fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  };
}

// Initialize PDF features with premium enhancements
function initializePDFFeatures() {
  // Add event listeners with premium ripple effect
  document.addEventListener('click', async (e) => {
    const downloadBtn = e.target.closest('.download-report-btn');
    if (downloadBtn) {
      // Add ripple effect
      const ripple = document.createElement('span');
      ripple.className = 'modern-ripple';
      downloadBtn.appendChild(ripple);
      
      // Position ripple
      const rect = downloadBtn.getBoundingClientRect();
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      
      // Remove ripple after animation
      setTimeout(() => ripple.remove(), 600);
      
      // Download report
      const reportId = downloadBtn.getAttribute('data-id');
      await downloadReportAsPDF(reportId);
    }
  });

  // Load jsPDF with premium loading indicator
  window.addEventListener('load', async () => {
    try {
      showModernToast('Loading premium PDF features...', 'info', {
        icon: '⚙️',
        autoClose: 1500
      });
      
      await loadJSPDFLibrary();
      console.log('PDF library ready with premium features');
    } catch (error) {
      console.error('PDF initialization failed:', error);
      showModernToast('PDF features unavailable', 'danger', {
        icon: '⚠️',
        autoClose: 5000
      });
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePDFFeatures);
} else {
  initializePDFFeatures();
}
