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
    
    // Organization registration modal elements
    const orgRegistrationModal = document.getElementById('org-registration-modal');
    const orgRegistrationForm = document.getElementById('org-registration-form');
    const organizationNameInput = document.getElementById('organization-name');
    const submitOrgBtn = document.getElementById('submit-org-registration');
    const submitOrgText = document.getElementById('submit-org-text');
    const submitOrgSpinner = document.getElementById('submit-org-spinner');
    
    // Toggle between login and signup forms
    showSignupLink?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        signupForm.reset();
        signupError.classList.add('hidden');
    });
    
    showLoginLink?.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    });
    
    // Handle signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;
        const orgName = document.getElementById('org-name')?.value.trim();
        
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
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showSignupError('Please enter a valid email address');
            return;
        }
        
        // Show loading state
        signupBtnText.textContent = 'Creating account...';
        signupSpinner.classList.remove('hidden');
        signupError.classList.add('hidden');
        
        try {
            // Check if this is the first user in the system
            const isFirstUser = await checkFirstUser();
            
            // Prepare form data
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('password', password);
            
            // If this is the first user, include organization name
            if (isFirstUser) {
                if (!orgName) {
                    throw new Error('Organization name is required for the first user');
                }
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
            
            // Store the token
            localStorage.setItem('token', data.access_token);
            
            // Show success message
            showAlert('Account created successfully!', 'success');
            
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
            
            // If this is the first user, show organization registration modal
            if (isFirstUser && !data.organization) {
                orgRegistrationModal.classList.add('active');
            } else {
                // For regular users, proceed to app
                setupUIForUser();
                loginView.classList.add('hidden');
                appView.classList.remove('hidden');
                loadInitialData();
            }
            
        } catch (error) {
            console.error('Signup error:', error);
            showSignupError(error.message || 'An error occurred during signup');
        } finally {
            signupBtnText.textContent = 'Create Account';
            signupSpinner.classList.add('hidden');
        }
    });
    
    // Handle organization registration
    submitOrgBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        const orgName = organizationNameInput.value.trim();
        
        if (!orgName) {
            showAlert('Please enter an organization name', 'danger');
            return;
        }
        
        if (orgName.length < 3) {
            showAlert('Organization name must be at least 3 characters', 'danger');
            return;
        }
        
        // Show loading state
        submitOrgText.textContent = 'Registering...';
        submitOrgSpinner.classList.remove('hidden');
        
        try {
            // Update organization name
            const response = await fetch(`${API_BASE_URL}/users/update-organization`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    organization_name: orgName
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to register organization');
            }
            
            const data = await response.json();
            
            // Store organization name
            localStorage.setItem('orgName', orgName);
            
            // Close modal and proceed to app
            orgRegistrationModal.classList.remove('active');
            showAlert(`Welcome to ${orgName}!`, 'success');
            
            // Refresh user data
            const userResponse = await fetch(`${API_BASE_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            
            if (!userResponse.ok) {
                throw new Error('Failed to get user info');
            }
            
            currentUser = await userResponse.json();
            setupUIForUser();
            loginView.classList.add('hidden');
            appView.classList.remove('hidden');
            loadInitialData();
            
        } catch (error) {
            console.error('Organization registration error:', error);
            showAlert(error.message || 'Failed to register organization', 'danger');
        } finally {
            submitOrgText.textContent = 'Register Organization';
            submitOrgSpinner.classList.add('hidden');
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

    // Show organization name field for first user
    async function checkAndShowOrgField() {
        try {
            const isFirstUser = await checkFirstUser();
            const orgNameGroup = document.getElementById('org-name-group');
            
            if (isFirstUser) {
                orgNameGroup.style.display = 'block';
            } else {
                orgNameGroup.style.display = 'none';
            }
        } catch (error) {
            console.error('Error checking first user status:', error);
        }
    }

    // Check and show organization field when signup form is shown
    showSignupLink?.addEventListener('click', checkAndShowOrgField);
    
    // Initial check if we're already on the signup form
    if (!signupForm.classList.contains('hidden')) {
        checkAndShowOrgField();
    }
});
