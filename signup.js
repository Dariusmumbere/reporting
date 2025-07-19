// Signup functionality
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showSignupLink = document.getElementById('show-signup');
    const showLoginLink = document.getElementById('show-login');
    const signupBtn = document.getElementById('signup-btn');
    const signupBtnText = document.getElementById('signup-btn-text');
    const signupSpinner = document.getElementById('signup-spinner');
    const signupError = document.getElementById('signup-error');
    const signupErrorMessage = document.getElementById('signup-error-message');
    const orgNameGroup = document.getElementById('org-name-group');
    const orgNameInput = document.getElementById('org-name');
    
    // API Configuration
    const API_BASE_URL = 'https://reporting-api-uvze.onrender.com';
    
    // State Management
    let currentUser = null;
    const loginView = document.getElementById('login-view');
    const appView = document.getElementById('app-view');
    
    // Initialize - hide org name field by default
    orgNameGroup.style.display = 'none';
    if (orgNameInput) orgNameInput.required = false;
    
    // Toggle between login and signup forms
    showSignupLink?.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Check if this is the first user when switching to signup form
        try {
            const isFirstUser = await checkFirstUser();
            if (isFirstUser) {
                orgNameGroup.style.display = 'block';
                if (orgNameInput) orgNameInput.required = true;
            }
        } catch (error) {
            console.error('Error checking first user:', error);
        }
        
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    });
    
    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
        orgNameGroup.style.display = 'none';
        if (orgNameInput) orgNameInput.required = false;
    });
    
    // Handle signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const orgName = orgNameInput?.value.trim();
        
        // Validate inputs
        if (!name || !email || !password || !confirmPassword) {
            showSignupError('Please fill in all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            showSignupError('Passwords do not match');
            return;
        }
        
        if (password.length < 8) {
            showSignupError('Password must be at least 8 characters');
            return;
        }
        
        // Show loading state
        signupBtnText.textContent = 'Creating account...';
        signupSpinner.classList.remove('hidden');
        signupError.classList.add('hidden');
        
        try {
            // Check again if this is the first user (in case page was refreshed)
            const isFirstUser = await checkFirstUser();
            
            // If this is the first user and no org name provided
            if (isFirstUser && (!orgNameInput || !orgName)) {
                showSignupError('Organization name is required');
                signupBtnText.textContent = 'Create Account';
                signupSpinner.classList.add('hidden');
                orgNameGroup.style.display = 'block';
                if (orgNameInput) orgNameInput.required = true;
                return;
            }
            
            // Prepare form data
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            if (isFirstUser && orgName) {
                formData.append('organization_name', orgName);
            }
            
            // Create the user
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Signup failed');
            }
            
            const data = await response.json();
            
            // Store the token and organization name
            localStorage.setItem('token', data.access_token);
            if (data.organization) {
                localStorage.setItem('orgName', data.organization);
            }
            
            // Get user info
            const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }
            
            currentUser = await userResponse.json();
            
            // Show welcome message
            const welcomeOrgName = data.organization || localStorage.getItem('orgName');
            if (welcomeOrgName) {
                showAlert(`Welcome to ${welcomeOrgName}!`, 'success');
            } else {
                showAlert('Account created successfully!', 'success');
            }
            
            // Redirect to app
            setupUIForUser();
            loginView.classList.add('hidden');
            appView.classList.remove('hidden');
            
        } catch (error) {
            console.error('Signup error:', error);
            showSignupError(error.message || 'An error occurred during signup');
        } finally {
            signupBtnText.textContent = 'Create Account';
            signupSpinner.classList.add('hidden');
        }
    });
    
    // Helper function to show signup errors
    function showSignupError(message) {
        signupErrorMessage.textContent = message;
        signupError.classList.remove('hidden');
        setTimeout(() => {
            signupError.classList.add('hidden');
        }, 5000);
    }
    
    // Check if this is the first user in the system
    async function checkFirstUser() {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/first-user`);
            if (!response.ok) {
                throw new Error('Failed to check first user status');
            }
            const data = await response.json();
            return data.is_first_user;
        } catch (error) {
            console.error('Error checking first user:', error);
            return false;
        }
    }
    
    // Setup UI based on user role
    function setupUIForUser() {
        if (!currentUser) return;
        
        // Set user info in the UI
        const userNameElements = document.querySelectorAll('#user-name, #user-dropdown-name');
        const userRoleElements = document.querySelectorAll('#user-role');
        const userAvatarElements = document.querySelectorAll('#user-avatar, #user-dropdown-avatar');
        const userEmailElements = document.querySelectorAll('#user-dropdown-email');
        
        const initials = currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
        
        userNameElements.forEach(el => el.textContent = currentUser.name || 'User');
        userRoleElements.forEach(el => el.textContent = currentUser.role === 'admin' ? 'Administrator' : 'Staff Member');
        userAvatarElements.forEach(el => el.textContent = initials);
        userEmailElements.forEach(el => el.textContent = currentUser.email);
        
        // Show organization name in the UI if available
        const orgName = localStorage.getItem('orgName');
        if (orgName) {
            const orgNameElements = document.querySelectorAll('.organization-name');
            orgNameElements.forEach(el => {
                if (el) el.textContent = orgName;
            });
        }
        
        // Show/hide admin menu
        const adminMenu = document.getElementById('admin-menu');
        if (currentUser.role === 'admin') {
            adminMenu?.classList.remove('hidden');
        } else {
            adminMenu?.classList.add('hidden');
        }
    }
    
    // Show alert message
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
        if (content) {
            if (content.firstChild) {
                content.insertBefore(alert, content.firstChild);
            } else {
                content.appendChild(alert);
            }
        }
        
        // Remove after 5 seconds
        setTimeout(() => {
            alert.classList.add('hidden');
            setTimeout(() => {
                alert.remove();
            }, 300);
        }, 5000);
    }
});
