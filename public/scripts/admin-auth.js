// Admin authentication methods for admin dashboard

// Check if user has admin access
async function checkAdminAuth() {
  try {
    // First check if user is logged in
    if (!window.authManager || !window.authManager.isAuthenticated()) {
      redirectToLogin();
      return false;
    }

    const user = window.authManager.getUser();
    if (!user || !user.email) {
      redirectToLogin();
      return false;
    }

    // Check admin status with backend
    const response = await fetch(`/api/admin/check-status?email=${encodeURIComponent(user.email)}`);
    const data = await response.json();

    if (!data.success || !data.isAdmin) {
      showAdminAccessDenied();
      return false;
    }

    // Store admin email for API calls
    window.adminEmail = user.email;
    return true;
  } catch (error) {
    console.error("Admin auth check error:", error);
    showAdminAccessDenied();
    return false;
  }
}

// Redirect to login page
function redirectToLogin() {
  window.location.href = "/public/index.html";
}

// Show admin access denied message
function showAdminAccessDenied() {
  document.body.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--gray-50);
      font-family: Inter, sans-serif;
    ">
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: var(--shadow-lg);
        text-align: center;
        max-width: 400px;
      ">
        <div style="
          width: 64px;
          height: 64px;
          background: #fef2f2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        ">
          <svg width="32" height="32" fill="#dc2626" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h2 style="color: #dc2626; margin-bottom: 0.5rem;">Access Denied</h2>
        <p style="color: #6b7280; margin-bottom: 1.5rem;">
          You don't have administrator privileges to access this page.
        </p>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem;">
          Admin access is granted to emails containing "admin" or "manager".
        </p>
        <a href="/public/index.html" style="
          display: inline-block;
          background: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          text-decoration: none;
          font-weight: 500;
        ">Back to Login</a>
      </div>
    </div>
  `;
}

// Handle admin logout
function handleAdminLogout() {
  if (window.authManager) {
    window.authManager.signOut();
  }
  window.location.href = "/public/index.html";
}

// Add admin email to API calls for authorization
function addAdminAuth(url, options = {}) {
  const separator = url.includes('?') ? '&' : '?';
  const authUrl = `${url}${separator}adminEmail=${encodeURIComponent(window.adminEmail || '')}`;
  
  return {
    url: authUrl,
    options: {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer admin-${window.adminEmail || 'unknown'}`
      }
    }
  };
}

// Export functions for use in admin dashboard
window.checkAdminAuth = checkAdminAuth;
window.handleAdminLogout = handleAdminLogout;
window.addAdminAuth = addAdminAuth;
