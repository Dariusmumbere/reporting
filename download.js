// download.js - Report PDF Generation and Download functionality

// Function to generate a PDF from a report
async function generateReportPDF(report) {
    // Create a new PDF document
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add ReportHub logo (placeholder - you would replace with your actual logo)
    const logoUrl = 'https://via.placeholder.com/150x50?text=ReportHub';
    const logoResponse = await fetch(logoUrl);
    const logoBlob = await logoResponse.blob();
    const logoDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(logoBlob);
    });
    
    // Add logo to PDF
    doc.addImage(logoDataUrl, 'JPEG', 15, 10, 40, 15);
    
    // Add report title with styling
    doc.setFontSize(20);
    doc.setTextColor(33, 37, 41); // Dark gray
    doc.setFont('helvetica', 'bold');
    doc.text(report.title, 15, 40);
    
    // Add report metadata in a modern layout
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    
    // Create metadata columns
    const metadata = [
        { label: 'Report ID', value: `#REP-${report.id.toString().padStart(3, '0')}` },
        { label: 'Author', value: report.author_name },
        { label: 'Date', value: new Date(report.created_at).toLocaleDateString() },
        { label: 'Status', value: report.status.charAt(0).toUpperCase() + report.status.slice(1) },
        { label: 'Category', value: report.category }
    ];
    
    // Draw metadata in two columns
    let yPosition = 50;
    metadata.forEach((item, index) => {
        const column = index % 2;
        const xPosition = 15 + (column * 90);
        
        // Label
        doc.setTextColor(108, 117, 125); // Gray
        doc.text(`${item.label}:`, xPosition, yPosition);
        
        // Value
        doc.setTextColor(33, 37, 41); // Dark gray
        doc.text(item.value, xPosition + 25, yPosition);
        
        // Move to next row if we're in the second column
        if (column === 1) yPosition += 7;
    });
    
    // Add a divider line
    doc.setDrawColor(222, 226, 230); // Light gray
    doc.line(15, yPosition + 5, 195, yPosition + 5);
    
    // Add report description with proper formatting
    doc.setFontSize(12);
    doc.setTextColor(33, 37, 41);
    const descriptionLines = doc.splitTextToSize(report.description, 180);
    doc.text(descriptionLines, 15, yPosition + 15);
    
    // Add admin comments if they exist
    if (report.admin_comments) {
        doc.setFontSize(14);
        doc.setTextColor(67, 97, 238); // Primary color
        doc.text('Admin Comments', 15, yPosition + 15 + (descriptionLines.length * 7) + 10);
        
        doc.setFontSize(12);
        doc.setTextColor(33, 37, 41);
        const commentLines = doc.splitTextToSize(report.admin_comments, 180);
        doc.text(commentLines, 15, yPosition + 15 + (descriptionLines.length * 7) + 20);
    }
    
    // Add attachments section if there are attachments
    if (report.attachments && report.attachments.length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(67, 97, 238); // Primary color
        doc.text('Attachments', 15, doc.internal.pageSize.height - 30);
        
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125); // Gray
        report.attachments.forEach((attachment, index) => {
            doc.text(`${index + 1}. ${attachment.name} (${formatFileSize(attachment.size)})`, 
                    15, doc.internal.pageSize.height - 20 + (index * 5));
        });
    }
    
    // Add footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125); // Gray
        doc.text(`Page ${i} of ${pageCount}`, 180, doc.internal.pageSize.height - 10);
        doc.text(new Date().toLocaleDateString(), 15, doc.internal.pageSize.height - 10);
    }
    
    return doc;
}

// Function to format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Function to download a report as PDF
async function downloadReportAsPDF(reportId) {
    try {
        // Show loading state
        showAlert('Generating PDF...', 'info');
        
        // Fetch the report data
        const response = await fetch(`${API_BASE_URL}/reports/${reportId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch report');
        }
        
        const report = await response.json();
        
        // Generate the PDF
        const pdfDoc = await generateReportPDF(report);
        
        // Save the PDF
        pdfDoc.save(`Report_${reportId}.pdf`);
        
        // Show success message
        showAlert('Report downloaded successfully', 'success');
    } catch (error) {
        console.error('Error downloading report:', error);
        showAlert('Failed to download report', 'danger');
    }
}

// Function to download an attachment
async function downloadAttachment(url) {
    try {
        // In a real implementation, this would download the file
        // For this demo, we'll simulate it with the actual URL
        const a = document.createElement('a');
        a.href = url;
        a.download = url.split('/').pop();
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        showAlert('Failed to download attachment', 'danger');
    }
}

// Add event listeners for download buttons
document.addEventListener('DOMContentLoaded', () => {
    // Add download functionality to report view buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.download-report-btn')) {
            const btn = e.target.closest('.download-report-btn');
            const reportId = btn.getAttribute('data-id');
            downloadReportAsPDF(reportId);
        }
        
        if (e.target.closest('.download-attachment-btn')) {
            const btn = e.target.closest('.download-attachment-btn');
            const url = btn.getAttribute('data-url');
            downloadAttachment(url);
        }
    });
    
    // Add download buttons to existing UI elements
    addDownloadButtons();
});

// Function to add download buttons to the UI
function addDownloadButtons() {
    // Add download buttons to dashboard reports
    const dashboardRows = document.querySelectorAll('#dashboard-reports-table-body tr');
    dashboardRows.forEach(row => {
        const viewBtn = row.querySelector('.view-report-btn');
        if (viewBtn) {
            const reportId = viewBtn.getAttribute('data-id');
            const actionsCell = row.querySelector('td:last-child');
            
            // Check if download button already exists
            if (!actionsCell.querySelector('.download-report-btn')) {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'action-btn download-report-btn';
                downloadBtn.setAttribute('data-id', reportId);
                downloadBtn.setAttribute('title', 'Download PDF');
                downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                
                // Insert before the view button
                actionsCell.insertBefore(downloadBtn, viewBtn);
            }
        }
    });
    
    // Add download buttons to reports view
    const reportRows = document.querySelectorAll('#reports-table-body tr');
    reportRows.forEach(row => {
        const viewBtn = row.querySelector('.view-report-btn');
        if (viewBtn) {
            const reportId = viewBtn.getAttribute('data-id');
            const actionsCell = row.querySelector('td:last-child');
            
            // Check if download button already exists
            if (!actionsCell.querySelector('.download-report-btn')) {
                const downloadBtn = document.createElement('button');
                downloadBtn.className = 'action-btn download-report-btn';
                downloadBtn.setAttribute('data-id', reportId);
                downloadBtn.setAttribute('title', 'Download PDF');
                downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
                
                // Insert after the view button
                viewBtn.parentNode.insertBefore(downloadBtn, viewBtn.nextSibling);
            }
        }
    });
    
    // Add download buttons to attachments in view report modal
    const attachmentItems = document.querySelectorAll('#view-report-attachments .file-item');
    attachmentItems.forEach(item => {
        const downloadIcon = item.querySelector('.fa-download');
        if (downloadIcon) {
            downloadIcon.classList.add('download-attachment-btn');
        }
    });
}

// Function to show alert messages
function showAlert(message, type) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} fade-in`;
    
    let icon;
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'danger') {
        icon = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
    } else {
        icon = 'fa-info-circle';
    }
    
    alert.innerHTML = `
        <i class="fas ${icon}"></i>
        <div class="alert-content">
            <div class="alert-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
            <div class="alert-message">${message}</div>
        </div>
    `;
    
    // Insert at the top of the content area
    const content = document.querySelector('.content');
    if (content.firstChild) {
        content.insertBefore(alert, content.firstChild);
    } else {
        content.appendChild(alert);
    }
    
    // Remove after 5 seconds
    setTimeout(() => {
        alert.classList.add('hidden');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
}

// Initialize the download functionality when the page loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(addDownloadButtons, 1000);
} else {
    document.addEventListener('DOMContentLoaded', addDownloadButtons);
}
