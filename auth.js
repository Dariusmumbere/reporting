document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const errorElement = document.getElementById('loginError');
            
            try {
                const response = await fetch(`${postgresql://inventory_ihpg_user:EKkxYBPqllVfkTkIDKYRzGZKDX5Vw2ek@dpg-d16jkimmcj7s73c7li80-a/inventory_ihpg}/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
                });
                
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('authToken', data.access_token);
                    
                    // Check if user is admin and redirect accordingly
                    const user = await checkAuth();
                    if (user && user.is_admin) {
                        window.location.href = 'admin.html';
                    } else {
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    const error = await response.json();
                    throw new Error(error.detail || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                errorElement.textContent = error.message;
                errorElement.style.display = 'block';
            }
        });
    }
    
    // Toggle password visibility
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', () => {
            const passwordInput = document.getElementById('password');
            const icon = togglePassword.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    }
});
