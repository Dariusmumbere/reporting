// download.js - Report PDF generation and download functionality

// Global Configuration
const LOGO_URL = 'logo.jpg'; // Make sure this path is correct
const LOGO_WIDTH = 40;
const LOGO_HEIGHT = 15;
const LOGO_POSITION = { x: 20, y: 10 };

// Function to load jsPDF library
async function loadJSPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (window.jspdf) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load jsPDF library'));
        document.head.appendChild(script);
    });
}

// Function to load image
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
        img.src = url;
    });
}

// Generate PDF Report
async function generateReportPDF(report) {
    try {
        // Initialize PDF document
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add Logo
        try {
            const logoImg = await loadImage(LOGO_URL);
            doc.addImage(logoImg, 'JPEG', 
                LOGO_POSITION.x, 
                LOGO_POSITION.y, 
                LOGO_WIDTH, 
                LOGO_HEIGHT
            );
        } catch (error) {
            console.warn('Using text fallback for logo:', error.message);
            doc.setFontSize(12);
            doc.setTextColor(40, 53, 147);
            doc.text('ReportHub', LOGO_POSITION.x, LOGO_POSITION.y + 10);
        }

        // Report Header
        doc.setFontSize(20);
        doc.setTextColor(40, 53, 147);
        doc.text(report.title, 105, 30, { align: 'center' });

        // Metadata
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Report ID: #REP-${report.id.toString().padStart(3, '0')}`, 20, 50);
        doc.text(`Author: ${report.author_name}`, 20, 60);
        doc.text(`Date: ${new Date(report.created_at).toLocaleDateString()}`, 20, 70);
        doc.text(`Category: ${report.category}`, 20, 80);

        // Status Badge
        const statusConfig = {
            approved: { color: [76, 201, 240], text: 'Approved' },
            pending: { color: [248, 150, 30], text: 'Pending' },
            rejected: { color: [247, 37, 133], text: 'Rejected' }
        };
        const status = statusConfig[report.status] || statusConfig.pending;
        
        doc.setFillColor(...status.color);
        doc.setDrawColor(...status.color);
        doc.roundedRect(150, 45, 40, 15, 3, 3, 'FD');
        doc.setTextColor(255, 255, 255);
        doc.text(status.text, 170, 55, { align: 'center' });

        // Content Separator
        doc.setDrawColor(200, 200, 200);
        doc.line(20, 85, 190, 85);

        // Report Content
        doc.setFontSize(12);
        doc.setTextColor(50, 50, 50);
        const descLines = doc.splitTextToSize(report.description, 170);
        doc.text(descLines, 20, 100);

        // Admin Comments
        if (report.admin_comments) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Admin Comments:', 20, doc.autoTable.previous.finalY + 15);
            
            doc.setFontSize(11);
            doc.setTextColor(70, 70, 70);
            const commentLines = doc.splitTextToSize(report.admin_comments, 170);
            doc.text(commentLines, 20, doc.autoTable.previous.finalY + 25);
        }

        // Attachments
        if (report.attachments?.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            doc.text('Attachments:', 20, doc.autoTable.previous.finalY + 15);
            
            doc.setFontSize(10);
            report.attachments.forEach((attachment, index) => {
                const yPos = doc.autoTable.previous.finalY + 25 + (index * 7);
                doc.setTextColor(67, 97, 238);
                doc.textWithLink(attachment.name, 20, yPos, { url: attachment.url });
                doc.setTextColor(100, 100, 100);
                doc.text(`(${formatFileSize(attachment.size)})`, 170, yPos, { align: 'right' });
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 290, { align: 'center' });
        }

        return doc;
    } catch (error) {
        console.error('PDF Generation Error:', error);
        throw error;
    }
}

// Download Report as PDF
async function downloadReportAsPDF(reportId) {
    try {
        showToast('Preparing PDF...', 'info');
        
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to fetch report');
        
        const report = await response.json();
        const pdfDoc = await generateReportPDF(report);
        
        // Sanitize filename
        const cleanTitle = report.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        pdfDoc.save(`Report_${cleanTitle}_${report.id}.pdf`);
        
        showToast('PDF downloaded successfully', 'success');
    } catch (error) {
        console.error('Download Error:', error);
        showToast('Failed to generate PDF', 'danger');
    }
}

// Helper Functions
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    return {
        close: () => toast.remove()
    };
}

// Initialize PDF functionality
function initializePDFFeatures() {
    // Add event listeners for download buttons
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.download-report-btn')) {
            const reportId = e.target.closest('.download-report-btn').getAttribute('data-id');
            await downloadReportAsPDF(reportId);
        }
    });

    // Ensure jsPDF is loaded
    window.addEventListener('load', async () => {
        try {
            await loadJSPDFLibrary();
            console.log('PDF library ready');
        } catch (error) {
            console.error('PDF initialization failed:', error);
            showToast('PDF features unavailable', 'danger');
        }
    });
}

// Add CSS for toast notifications
const toastCSS = `
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 4px;
    color: white;
    z-index: 10000;
    animation: fadeIn 0.3s;
    max-width: 300px;
}
.toast.fade-out {
    animation: fadeOut 0.3s;
}
.toast-success { background-color: #4cc9f0; }
.toast-danger { background-color: #f72585; }
.toast-info { background-color: #4895ef; }
.toast-warning { background-color: #f8961e; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
`;

// Inject styles
const styleTag = document.createElement('style');
styleTag.innerHTML = toastCSS;
document.head.appendChild(styleTag);

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePDFFeatures);
} else {
    initializePDFFeatures();
}
