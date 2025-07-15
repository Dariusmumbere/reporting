// signup.js - Handles the sign-up flow for new users

// DOM Elements
const loginView = document.getElementById('login-view');
const loginForm = document.getElementById('login-form');
const showSignupLink = document.getElementById('show-signup');
const loginRight = document.querySelector('.login-right');

// State
let currentSignupStep = 0; // 0 = not signing up, 1 = user details, 2 = org details

// Create signup form elements
function createSignupForm() {
    const signupForm = document.createElement('div');
    signupForm.className = 'login-form';
    signupForm.id = 'signup-form';
    
    signupForm.innerHTML = `
        <div class="login-logo">
            <h2>Create Account</h2>
            <p>Step ${currentSignupStep} of 2</p>
        </div>
        
        <form id="user-signup-form">
            <div class="alert alert-danger hidden" id="signup-error">
                <i class="fas fa-exclamation-circle"></i>
                <div class="alert-content">
                    <div class="alert-title">Signup failed</div>
                    <p class="alert-message" id="signup-error-message"></p>
                </div>
            </div>
            
            <div class="form-group">
                <label for="signup-name" class="form-label">Full Name</label>
                <input type="text" id="signup-name" class="form-control" placeholder="Enter your full name" required>
            </div>
            
            <div class="form-group">
                <label for="signup-email" class="form-label">Email Address</label>
                <input type="email" id="signup-email" class="form-control" placeholder="Enter your email" required>
            </div>
            
            <div class="form-group">
                <label for="signup-password" class="form-label">Password</label>
                <input type="password" id="signup-password" class="form-control" placeholder="Create a password" required minlength="8">
                <small class="text-muted">Password must be at least 8 characters with uppercase, lowercase, number, and special character</small>
            </div>
            
            <div class="form-group">
                <label for="signup-confirm-password" class="form-label">Confirm Password</label>
                <input type="password" id="signup-confirm-password" class="form-control" placeholder="Confirm your password" required minlength="8">
            </div>
            
            <button type="submit" class="btn btn-primary login-btn" id="signup-btn">
                <span id="signup-btn-text">Continue</span>
                <span class="spinner hidden" id="signup-spinner"></span>
            </button>
            
            <div class="login-footer">
                <p>Already have an account? <a href="#" id="show-login">Sign in</a></p>
            </div>
        </form>
    `;
    
    return signupForm;
}

// Create organization details form
function createOrgForm() {
    const orgForm = document.createElement('div');
    orgForm.className = 'login-form';
    orgForm.id = 'org-form';
    
    orgForm.innerHTML = `
        <div class="login-logo">
            <h2>Organization Details</h2>
            <p>Step 2 of 2</p>
        </div>
        
        <form id="org-details-form">
            <div class="alert alert-danger hidden" id="org-error">
                <i class="fas fa-exclamation-circle"></i>
                <div class="alert-content">
                    <div class="alert-title">Error</div>
                    <p class="alert-message" id="org-error-message"></p>
                </div>
            </div>
            
            <div class="form-group">
                <label for="org-name" class="form-label">Organization/School/Team Name</label>
                <input type="text" id="org-name" class="form-control" placeholder="Enter your organization name" required>
            </div>
            
            <div class="form-group">
                <label for="org-type" class="form-label">Type</label>
                <select id="org-type" class="form-control" required>
                    <option value="">Select type</option>
                    <option value="organization">Organization</option>
                    <option value="school">School</option>
                    <option value="team">Team</option>
                    <option value="other">Other</option>
                </select>
            </div>
            
            <div class="form-group">
                <label for="org-size" class="form-label">Approximate Size</label>
                <select id="org-size" class="form-control">
                    <option value="1-10">1-10 people</option>
                    <option value="11-50">11-50 people</option>
                    <option value="51-200">51-200 people</option>
                    <option value="201-1000">201-1000 people</option>
                    <option value="1000+">1000+ people</option>
                </select>
            </div>
            
            <div class="d-flex gap-2">
                <button type="button" class="btn btn-outline flex-grow-1" id="back-to-signup">Back</button>
                <button type="submit" class="btn btn-primary flex-grow-1" id="complete-signup">
                    <span id="complete-btn-text">Complete Signup</span>
                    <span class="spinner hidden" id="complete-spinner"></span>
                </button>
            </div>
        </form>
    `;
    
    return orgForm;
}

// Show signup form
function showSignupForm() {
    currentSignupStep = 1;
    const signupForm = createSignupForm();
    loginRight.innerHTML = '';
    loginRight.appendChild(signupForm);
    
    // Add event listeners
    document.getElementById('show-login').addEventListener('click', showLoginForm);
    document.getElementById('user-signup-form').addEventListener('submit', handleUserSignup);
}

// Show organization form
function showOrgForm(userData) {
    currentSignupStep = 2;
    const orgForm = createOrgForm();
    loginRight.innerHTML = '';
    loginRight.appendChild(orgForm);
    
    // Add event listeners
    document.getElementById('back-to-signup').addEventListener('click', () => {
        showSignupForm();
    });
    document.getElementById('org-details-form').addEventListener('submit', (e) => {
        e.preventDefault();
        handleOrgSignup(userData);
    });
}

// Show login form
function showLoginForm() {
    currentSignupStep = 0;
    loginRight.innerHTML = `
        <div class="login-form">
            <div class="login-logo">
                <h2>ReportHub</h2>
                <p>Sign in to your account</p>
            </div>
            <form id="login-form">
                <div class="alert alert-danger hidden" id="login-error">
                    <i class="fas fa-exclamation-circle"></i>
                    <div class="alert-content">
                        <div class="alert-title">Login failed</div>
                        <p class="alert-error-message">Invalid email or password</p>
                    </div>
                </div>
                <div class="form-group">
                    <label for="email" class="form-label">Email Address</label>
                    <input type="email" id="email" class="form-control" placeholder="Enter your email" required>
                </div>
                <div class="form-group">
                    <label for="password" class="form-label">Password</label>
                    <input type="password" id="password" class="form-control" placeholder="Enter your password" required>
                </div>
                <div class="login-actions">
                    <div class="remember-me">
                        <input type="checkbox" id="remember-me" class="form-check-input">
                        <label for="remember-me" class="form-check-label">Remember me</label>
                    </div>
                    <a href="#" class="forgot-password">Forgot password?</a>
                </div>
                <button type="submit" class="btn btn-primary login-btn" id="login-btn">
                    <span id="login-btn-text">Sign In</span>
                    <span class="spinner hidden" id="login-spinner"></span>
                </button>
            </form>
            <div class="login-footer">
                <p>Don't have an account? <a href="#" id="show-signup">Sign up</a></p>
            </div>
        </div>
    `;
    
    // Re-attach event listeners
    document.getElementById('show-signup').addEventListener('click', showSignupForm);
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

// Handle user signup (step 1)
async function handleUserSignup(e) {
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
    
    // Validate password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        showSignupError('Password must contain at least 8 characters, including uppercase, lowercase, number and special character');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showSignupError('Please enter a valid email address');
        return;
    }
    
    // Show loading state
    const signupBtn = document.getElementById('signup-btn');
    const signupBtnText = document.getElementById('signup-btn-text');
    const signupSpinner = document.getElementById('signup-spinner');
    
    signupBtnText.textContent = 'Checking...';
    signupSpinner.classList.remove('hidden');
    signupBtn.disabled = true;
    
    try {
        // Check if email exists (simulate API call)
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
            showSignupError('Email already registered');
            return;
        }
        
        // Proceed to organization details
        const userData = { name, email, password };
        showOrgForm(userData);
        
    } catch (error) {
        console.error('Signup error:', error);
        showSignupError('An error occurred. Please try again.');
    } finally {
        signupBtnText.textContent = 'Continue';
        signupSpinner.classList.add('hidden');
        signupBtn.disabled = false;
    }
}

// Handle organization signup (step 2)
async function handleOrgSignup(userData) {
    const orgName = document.getElementById('org-name').value.trim();
    const orgType = document.getElementById('org-type').value;
    
    if (!orgName || !orgType) {
        showOrgError('Please fill in all required fields');
        return;
    }
    
    // Show loading state
    const completeBtn = document.getElementById('complete-signup');
    const completeBtnText = document.getElementById('complete-btn-text');
    const completeSpinner = document.getElementById('complete-spinner');
    
    completeBtnText.textContent = 'Creating...';
    completeSpinner.classList.remove('hidden');
    completeBtn.disabled = true;
    
    try {
        // Create organization and user (simulate API call)
        const orgData = {
            name: orgName,
            type: orgType,
            size: document.getElementById('org-size').value
        };
        
        const response = await createOrganizationAndUser(userData, orgData);
        
        // Show success message
        showWelcomeMessage(response.user, response.org);
        
    } catch (error) {
        console.error('Organization signup error:', error);
        showOrgError('An error occurred. Please try again.');
    } finally {
        completeBtnText.textContent = 'Complete Signup';
        completeSpinner.classList.add('hidden');
        completeBtn.disabled = false;
    }
}

// Show welcome message after successful signup
function showWelcomeMessage(user, org) {
    loginRight.innerHTML = `
        <div class="login-form">
            <div class="login-logo">
                <h2>Welcome to ReportHub</h2>
                <p>Your account has been created successfully</p>
            </div>
            
            <div class="alert alert-success">
                <i class="fas fa-check-circle"></i>
                <div class="alert-content">
                    <div class="alert-title">Welcome, ${user.name}!</div>
                    <p class="alert-message">You are the admin for ${org.name}.</p>
                </div>
            </div>
            
            <div class="text-center mt-4">
                <p>You can now sign in to your account.</p>
                <button class="btn btn-primary" id="go-to-login">Sign In Now</button>
            </div>
        </div>
    `;
    
    document.getElementById('go-to-login').addEventListener('click', showLoginForm);
    
    // Store org name in localStorage to show on app load
    localStorage.setItem('orgName', org.name);
}

// Show signup error
function showSignupError(message) {
    const errorEl = document.getElementById('signup-error');
    const messageEl = document.getElementById('signup-error-message');
    
    messageEl.textContent = message;
    errorEl.classList.remove('hidden');
    
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
}

// Show org error
function showOrgError(message) {
    const errorEl = document.getElementById('org-error');
    const messageEl = document.getElementById('org-error-message');
    
    messageEl.textContent = message;
    errorEl.classList.remove('hidden');
    
    setTimeout(() => {
        errorEl.classList.add('hidden');
    }, 5000);
}

// Simulate email check API
async function checkEmailExists(email) {
    // In a real app, this would be an API call
    return new Promise(resolve => {
        setTimeout(() => {
            // For demo purposes, assume only admin@reporthub.com exists
            resolve(email === 'admin@reporthub.com');
        }, 800);
    });
}

// Simulate organization/user creation API
async function createOrganizationAndUser(userData, orgData) {
    // In a real app, this would be an API call
    return new Promise(resolve => {
        setTimeout(() => {
            const response = {
                user: {
                    ...userData,
                    id: Math.floor(Math.random() * 1000),
                    role: 'admin'
                },
                org: {
                    ...orgData,
                    id: Math.floor(Math.random() * 1000)
                },
                token: 'simulated-jwt-token'
            };
            resolve(response);
        }, 1500);
    });
}

// Initialize signup functionality
function initSignup() {
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSignupForm();
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initSignup);
