// Admin visibility helper for showing/hiding admin buttons across pages

async function checkAndShowAdminButton() {
  try {
    // Check if user is authenticated
    if (!window.authManager || !window.authManager.isAuthenticated()) {
      return;
    }

    const user = window.authManager.getUser();
    if (!user || !user.email) {
      return;
    }

    // Check admin status
    const response = await fetch(
      `/api/admin/check-status?email=${encodeURIComponent(user.email)}`,
    );
    const data = await response.json();

    if (data.success && data.isAdmin) {
      // Show admin button if it exists
      const adminBtn = document.getElementById("adminBtn");
      if (adminBtn) {
        adminBtn.style.display = "inline-flex";
      }
    }
  } catch (error) {
    console.error("Error checking admin status:", error);
    // Don't show admin button on error
  }
}

// Initialize admin visibility when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // Small delay to ensure auth manager is initialized
  setTimeout(checkAndShowAdminButton, 100);
});

// Also check when auth state changes
if (window.authManager) {
  const originalSignIn = window.authManager.signIn;
  window.authManager.signIn = async function (...args) {
    const result = await originalSignIn.apply(this, args);
    if (result.success) {
      setTimeout(checkAndShowAdminButton, 100);
    }
    return result;
  };
}

// Export function for manual calls
window.checkAndShowAdminButton = checkAndShowAdminButton;
