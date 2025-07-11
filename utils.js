// API Base URL - Replace with your Render backend URL
const API_BASE_URL = 'https://your-render-app.onrender.com';

// Check authentication status
async function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;
    
    try {
        const response = await fetch(`${API_BASE_URL}/users/me/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const user = await response.json();
            // Update UI elements if they exist
            if (document.getElementById('userName')) {
                document.getElementById('userName').textContent = user.full_name || user.email;
            }
            if (document.getElementById('userRole')) {
                document.getElementById('userRole').textContent = user.is_admin ? 'Administrator' : 'Staff Member';
            }
            return user;
        } else {
            localStorage.removeItem('authToken');
            return null;
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        return null;
    }
}

// Fetch API wrapper
async function fetchApi(endpoint, options = {}) {
    const token = localStorage.getItem('authToken');
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers = {
        'Accept': 'application/json',
        ...options.headers
    };
    
    if (token && !headers['Authorization']) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
            return;
        }
        
        return response;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Setup modal functionality
function setupModal(modalId, openButtonId = null) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    // Close buttons
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => closeModal(modalId));
    });
    
    // Open button if specified
    if (openButtonId) {
        const openButton = document.getElementById(openButtonId);
        if (openButton) {
            openButton.addEventListener('click', () => openModal(modalId));
        }
    }
    
    // Close when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal(modalId);
        }
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Initialize logout button if it exists
document.addEventListener('DOMContentLoaded', () => {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }
    
    // Check auth on pages that require it
    const protectedPages = ['dashboard.html', 'reports.html', 'create-report.html', 'admin.html'];
    if (protectedPages.some(page => window.location.pathname.endsWith(page))) {
        checkAuth().then(user => {
            if (!user) {
                window.location.href = 'login.html';
            }
        });
    }
});
