// Legacy auth.js - now imports the unified auth system
// This file is kept for backward compatibility

// Import the unified auth system
if (typeof MetroAuthManager === "undefined") {
  console.warn(
    "MetroAuthManager not loaded. Please include unified-auth.js first.",
  );
}

// Create global instance using the unified system
if (typeof MetroAuthManager !== "undefined") {
  window.authManager = new MetroAuthManager();
} else {
  // Fallback minimal auth manager if unified system fails to load
  window.authManager = {
    user: null,
    isAuthenticated: () => false,
    getUser: () => null,
    signOut: () => ({ success: true }),
    signIn: () => ({ success: false, error: "Auth system not available" }),
    signUp: () => ({ success: false, error: "Auth system not available" }),
    updateUserType: () => ({
      success: false,
      error: "Auth system not available",
    }),
  };
}
