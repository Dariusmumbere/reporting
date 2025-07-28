// download.js - Premium Report PDF Generation with Template Data Support

// Global Configuration
const CONFIG = {
  DESIGN: {
    PRIMARY_COLOR: [40, 53, 147],
    SECONDARY_COLOR: [76, 201, 240],
    ACCENT_COLOR: [247, 37, 133],
    LIGHT_GRAY: [245, 245, 245],
    DARK_GRAY: [100, 100, 100],
    SUCCESS_COLOR: [46, 204, 113],
    WARNING_COLOR: [248, 150, 30],
    DANGER_COLOR: [231, 76, 60]
  },
  LOGO: {
    URL: 'logo.jpg',
    WIDTH: 40,
    HEIGHT: 15,
    POSITION: { x: 20, y: 15 }
  },
  LAYOUT: {
    MARGIN: 20,
    CONTENT_WIDTH: 170,
    LINE_HEIGHT: 7,
    SECTION_SPACING: 15
  }
};

// Modern gradient generator
function createGradient(doc, yPosition, height, color) {
  const gradient = doc.context2d.createLinearGradient(0, yPosition, 0, yPosition + height);
  gradient.addColorStop(0, `rgba(${color.join(',')}, 0.8)`);
  gradient.addColorStop(1, `rgba(${color.join(',')}, 0.4)`);
  return gradient;
}

// Load jsPDF library with modern features
async function loadJSPDFLibrary() {
  return new Promise((resolve, reject) => {
    if (window.jspdf) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => {
      // Load additional plugins for modern features
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

// Enhanced image loader with placeholder fallback
async function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Create a modern placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 200, 100);
      gradient.addColorStop(0, 'rgba(40, 53, 147, 0.1)');
      gradient.addColorStop(1, 'rgba(76, 201, 240, 0.1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 200, 100);
      
      // Text
      ctx.font = '16px Arial';
      ctx.fillStyle = 'rgba(40, 53, 147, 0.5)';
      ctx.textAlign = 'center';
      ctx.fillText('Company Logo', 100, 60);
      
      resolve(canvas);
    };
    img.src = url;
  });
}

// Modern header generator
function createModernHeader(doc, title) {
  const { PRIMARY_COLOR } = CONFIG.DESIGN;
  
  // Add gradient background
  doc.setFillColor(PRIMARY_COLOR[0], PRIMARY_COLOR[1], PRIMARY_COLOR[2]);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 50, 'F');
  
  // Add title with modern typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text(title, doc.internal.pageSize.getWidth() / 2, 35, { align: 'center' });
  
  return 60; // Return new Y position
}

// Status badge with modern design
function createStatusBadge(doc, status, yPos) {
  const statusConfig = {
    approved: { color: CONFIG.DESIGN.SUCCESS_COLOR, text: '✓ Approved' },
    pending: { color: CONFIG.DESIGN.WARNING_COLOR, text: '⏳ Pending' },
    rejected: { color: CONFIG.DESIGN.DANGER_COLOR, text: '✗ Rejected' }
  };
  
  const statusInfo = statusConfig[status] || statusConfig.pending;
  
  // Modern rounded badge with shadow
  doc.setFillColor(...statusInfo.color);
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(150, yPos, 45, 18, 4, 4, 'FD');
  
  // White text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(statusInfo.text, 172.5, yPos + 11, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
}

// Modern section divider
function createSectionDivider(doc, yPos, title = '') {
  const { PRIMARY_COLOR, LIGHT_GRAY } = CONFIG.DESIGN;
  
  if (title) {
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, CONFIG.LAYOUT.MARGIN, yPos);
    yPos += 5;
  }
  
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(CONFIG.LAYOUT.MARGIN, yPos, CONFIG.LAYOUT.MARGIN + CONFIG.LAYOUT.CONTENT_WIDTH, yPos);
  
  return yPos + 10;
}

// Function to convert HTML to plain text while preserving some basic formatting
function htmlToPlainText(html) {
  // Create a temporary div element
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
  
  // Get the text content and clean up multiple newlines
  let text = tempDiv.textContent;
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Replace 3+ newlines with 2
  text = text.trim();
  
  return text;
}

// Format template field value for display
function formatTemplateFieldValue(value) {
  if (value === null || value === undefined) return 'N/A';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

// Generate Modern PDF Report with Template Data Support
async function generateReportPDF(report) {
  try {
    // Initialize PDF document with modern settings
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      filters: ['ASCIIHexEncode']
    });
    
    // Set default font
    doc.setFont('helvetica');
    
    // Add Modern Header
    let currentY = createModernHeader(doc, report.title);
    
    // Add Logo (top right)
    try {
      const logoImg = await loadImage(CONFIG.LOGO.URL);
      doc.addImage(logoImg, 'JPEG', 
        doc.internal.pageSize.getWidth() - CONFIG.LOGO.WIDTH - CONFIG.LAYOUT.MARGIN, 
        CONFIG.LOGO.POSITION.y, 
        CONFIG.LOGO.WIDTH, 
        CONFIG.LOGO.HEIGHT
      );
    } catch (error) {
      console.warn('Logo not loaded, using text fallback:', error.message);
    }
    
    // Report Metadata in modern card layout
    doc.setFillColor(...CONFIG.DESIGN.LIGHT_GRAY);
    doc.roundedRect(
      CONFIG.LAYOUT.MARGIN, 
      currentY, 
      CONFIG.LAYOUT.CONTENT_WIDTH, 
      45, 
      3, 
      3, 
      'F'
    );
    
    doc.setFontSize(11);
    doc.setTextColor(...CONFIG.DESIGN.DARK_GRAY);
    
    // Left column
    doc.text(`Report ID:`, CONFIG.LAYOUT.MARGIN + 5, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(`#REP-${report.id.toString().padStart(3, '0')}`, CONFIG.LAYOUT.MARGIN + 25, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Author:`, CONFIG.LAYOUT.MARGIN + 5, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(report.author_name, CONFIG.LAYOUT.MARGIN + 25, currentY + 16);
    
    // Right column
    doc.setFont('helvetica', 'normal');
    doc.text(`Date:`, CONFIG.LAYOUT.MARGIN + 90, currentY + 8);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(report.created_at).toLocaleDateString(), CONFIG.LAYOUT.MARGIN + 110, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Category:`, CONFIG.LAYOUT.MARGIN + 90, currentY + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(report.category, CONFIG.LAYOUT.MARGIN + 110, currentY + 16);
    
    // Status badge
    createStatusBadge(doc, report.status, currentY + 25);
    
    currentY += 55;
    
    // Description section
    currentY = createSectionDivider(doc, currentY, 'Description');
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    
    // Convert HTML description to plain text with basic formatting
    const plainTextDescription = htmlToPlainText(report.description);
    
    // Split the text into lines that fit the content width
    const descLines = doc.splitTextToSize(plainTextDescription, CONFIG.LAYOUT.CONTENT_WIDTH);
    
    // Add each line to the PDF
    descLines.forEach(line => {
      // Skip empty lines that might be from HTML conversion
      if (line.trim() === '') return;
      
      // Check if we need a new page
      if (currentY > doc.internal.pageSize.height - 20) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.text(line, CONFIG.LAYOUT.MARGIN, currentY);
      currentY += CONFIG.LAYOUT.LINE_HEIGHT;
    });
    
    currentY += CONFIG.LAYOUT.SECTION_SPACING;
    
    // Template Data Section (if exists)
    if (report.template_data && Object.keys(report.template_data).length > 0) {
      currentY = createSectionDivider(doc, currentY, 'Form Data');
      
      // Create a table for template data
      const templateDataRows = [];
      
      // Convert template data to table rows
      for (const [fieldName, fieldValue] of Object.entries(report.template_data)) {
        const formattedName = fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const formattedValue = formatTemplateFieldValue(fieldValue);
        
        templateDataRows.push({
          name: formattedName,
          value: formattedValue
        });
      }
      
      // Add table to PDF
      doc.autoTable({
        startY: currentY,
        head: [['Field', 'Value']],
        body: templateDataRows.map(row => [row.name, row.value]),
        margin: { left: CONFIG.LAYOUT.MARGIN, right: CONFIG.LAYOUT.MARGIN },
        styles: {
          fontSize: 10,
          cellPadding: 4,
          overflow: 'linebreak',
          valign: 'middle'
        },
        headStyles: {
          fillColor: CONFIG.DESIGN.PRIMARY_COLOR,
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: CONFIG.DESIGN.LIGHT_GRAY
        },
        columnStyles: {
          0: { cellWidth: 60, fontStyle: 'bold' },
          1: { cellWidth: 'auto' }
        },
        didDrawPage: function(data) {
          currentY = data.cursor.y + 10;
        }
      });
      
      currentY = doc.lastAutoTable.finalY + 10;
    }
    
    // Admin Comments (if exists)
    if (report.admin_comments) {
      currentY = createSectionDivider(doc, currentY, 'Admin Feedback');
      
      // Comment card
      doc.setFillColor(253, 245, 230);
      doc.roundedRect(
        CONFIG.LAYOUT.MARGIN, 
        currentY, 
        CONFIG.LAYOUT.CONTENT_WIDTH, 
        30, 
        3, 
        3, 
        'F'
      );
      
      doc.setFontSize(10);
      doc.setTextColor(70, 70, 70);
      const commentLines = doc.splitTextToSize(report.admin_comments, CONFIG.LAYOUT.CONTENT_WIDTH - 10);
      
      // Add each comment line
      let commentY = currentY + 7;
      commentLines.forEach(line => {
        // Check if we need a new page
        if (commentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          commentY = 20;
          // Redraw the comment card background on the new page
          doc.setFillColor(253, 245, 230);
          doc.roundedRect(
            CONFIG.LAYOUT.MARGIN, 
            commentY - 7, 
            CONFIG.LAYOUT.CONTENT_WIDTH, 
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
      currentY = createSectionDivider(doc, currentY, 'Attachments');
      
      doc.setFontSize(10);
      report.attachments.forEach((attachment, index) => {
        // Check if we need a new page
        if (currentY > doc.internal.pageSize.height - 20) {
          doc.addPage();
          currentY = 20;
        }
        
        // Attachment card
        doc.setFillColor(240, 248, 255);
        doc.roundedRect(
          CONFIG.LAYOUT.MARGIN, 
          currentY, 
          CONFIG.LAYOUT.CONTENT_WIDTH, 
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
          CONFIG.LAYOUT.MARGIN + CONFIG.LAYOUT.CONTENT_WIDTH - 5, 
          currentY + 7, 
          { align: 'right' }
        );
        
        currentY += 12;
      });
    }
    
    // Modern footer
    const addFooter = (pageNumber, totalPages) => {
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      
      // Footer line
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 285, 190, 285);
      
      // Footer text
      doc.text(`ReportHub • ${new Date().toLocaleDateString()}`, CONFIG.LAYOUT.MARGIN, 290);
      doc.text(`Page ${pageNumber} of ${totalPages}`, doc.internal.pageSize.getWidth() / 2, 290, { align: 'center' });
      doc.text('Confidential', doc.internal.pageSize.getWidth() - CONFIG.LAYOUT.MARGIN, 290, { align: 'right' });
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

// Enhanced download function with modern UI feedback
async function downloadReportAsPDF(reportId) {
  try {
    showModernToast('Preparing your report...', 'info', {
      icon: '⏳',
      autoClose: 3000
    });
    
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to fetch report');
    
    const report = await response.json();
    const pdfDoc = await generateReportPDF(report);
    
    // Sanitize filename
    const cleanTitle = report.title
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50);
    
    // Show success before download starts
    showModernToast('Report ready! Downloading...', 'success', {
      icon: '✓',
      autoClose: 2000
    });
    
    // Small delay for better UX
    setTimeout(() => {
      pdfDoc.save(`Report_${cleanTitle}_${report.id}.pdf`);
    }, 500);
    
  } catch (error) {
    console.error('Download Error:', error);
    showModernToast('Failed to generate report', 'danger', {
      icon: '✗',
      autoClose: 5000
    });
  }
}

// Modern file size formatter
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Modern toast notification system
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
  
  // Progress animation
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

// Initialize PDF features with modern enhancements
function initializePDFFeatures() {
  // Add event listeners with modern ripple effect
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

  // Load jsPDF with modern loading indicator
  window.addEventListener('load', async () => {
    try {
      showModernToast('Loading PDF features...', 'info', {
        icon: '⚙️',
        autoClose: 1500
      });
      
      await loadJSPDFLibrary();
      console.log('PDF library ready with modern features');
    } catch (error) {
      console.error('PDF initialization failed:', error);
      showModernToast('PDF features unavailable', 'danger', {
        icon: '⚠️',
        autoClose: 5000
      });
    }
  });
}

// Modern CSS styles
const modernStyles = `
/* Modern Toast Notifications */
.modern-toast {
  position: fixed;
  bottom: 25px;
  right: 25px;
  padding: 15px 20px;
  border-radius: 8px;
  color: white;
  z-index: 10000;
  animation: modernFadeIn 0.3s ease-out;
  max-width: 320px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.modern-toast-fade-out {
  animation: modernFadeOut 0.3s ease-in forwards;
}

.modern-toast-success {
  background-color: rgba(46, 204, 113, 0.95);
}

.modern-toast-danger {
  background-color: rgba(231, 76, 60, 0.95);
}

.modern-toast-info {
  background-color: rgba(52, 152, 219, 0.95);
}

.modern-toast-warning {
  background-color: rgba(241, 196, 15, 0.95);
}

.modern-toast-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modern-toast-icon {
  font-size: 18px;
}

.modern-toast-message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.modern-toast-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: rgba(255, 255, 255, 0.3);
  transform-origin: left;
}

@keyframes progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

@keyframes modernFadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modernFadeOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}

/* Ripple Effect */
.modern-ripple {
  position: absolute;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.7);
  transform: scale(0);
  animation: modernRipple 600ms linear;
  pointer-events: none;
  width: 20px;
  height: 20px;
  margin-left: -10px;
  margin-top: -10px;
}

@keyframes modernRipple {
  to {
    transform: scale(10);
    opacity: 0;
  }
}

/* PDF Download Buttons */
.download-report-btn {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.download-report-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
`;

// Inject modern styles
const styleTag = document.createElement('style');
styleTag.innerHTML = modernStyles;
document.head.appendChild(styleTag);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePDFFeatures);
} else {
  initializePDFFeatures();
}
