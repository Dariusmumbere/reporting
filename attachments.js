/**
 * Handles downloading of report attachments
 */

// Function to download a file from a URL
export async function downloadFile(url, filename) {
    try {
        // Create a temporary anchor element
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Revoke the object URL to free memory
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
    } catch (error) {
        console.error('Error downloading file:', error);
        throw error;
    }
}

// Function to download an attachment from the API
export async function downloadAttachment(attachmentUrl, attachmentName) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_BASE_URL}${attachmentUrl}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to download attachment: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        await downloadFile(url, attachmentName);
    } catch (error) {
        console.error('Error downloading attachment:', error);
        showAlert(`Failed to download attachment: ${error.message}`, 'danger');
        throw error;
    }
}

// Function to handle attachment download clicks
export function setupAttachmentDownloadListeners() {
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.download-attachment-btn')) {
            e.preventDefault();
            const btn = e.target.closest('.download-attachment-btn');
            const url = btn.getAttribute('data-url');
            const name = btn.getAttribute('data-name');
            
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            btn.disabled = true;
            
            try {
                await downloadAttachment(url, name);
            } finally {
                btn.innerHTML = '<i class="fas fa-download"></i>';
                btn.disabled = false;
            }
        }
    });
}

// Initialize attachment download functionality
export function initAttachments() {
    setupAttachmentDownloadListeners();
}
