// Handle signup form submission
signupForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
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
        const isFirstUserResponse = await fetch(`${API_BASE_URL}/auth/first-user`);
        const isFirstUserData = await isFirstUserResponse.json();
        const isFirstUser = isFirstUserData.is_first_user;
        
        // Prepare form data
        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        formData.append('password', password);
        
        // If first user, append organization name (will be empty initially)
        if (isFirstUser) {
            formData.append('organization_name', '');
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
        if (isFirstUser) {
            // Hide the signup form
            signupForm.classList.add('hidden');
            
            // Show the organization registration modal
            orgRegistrationModal.classList.add('active');
            
            // Handle organization registration
            submitOrgBtn.addEventListener('click', async () => {
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
