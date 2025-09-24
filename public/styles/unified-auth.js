// Unified Authentication System for MetroReserve
class MetroAuthManager {
  constructor() {
    this.user = null;
    this.session = null;
    this.loadUser();
  }

  loadUser() {
    const storedUser = localStorage.getItem("metroUser");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  async signIn(email, password) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = {
          id: data.user.id,
          email: data.user.email,
          userType: data.user.user_type,
          hasLuggage: data.user.has_luggage,
        };

        localStorage.setItem("metroUser", JSON.stringify(this.user));
        return { success: true, user: this.user };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  async signUp(email, password) {
    try {
      // For now, sign up is the same as sign in (creates user if doesn't exist)
      return await this.signIn(email, password);
    } catch (error) {
      console.error("Sign up error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  async updateUserType(userType, hasLuggage) {
    if (!this.user) return { success: false, error: "Not authenticated" };

    try {
      const response = await fetch("/api/auth/update-user-type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: this.user.id,
          userType: userType,
          hasLuggage: hasLuggage,
        }),
      });

      const data = await response.json();

      if (data.success && data.user) {
        this.user = {
          id: data.user.id,
          email: data.user.email,
          userType: data.user.user_type,
          hasLuggage: data.user.has_luggage,
        };

        localStorage.setItem("metroUser", JSON.stringify(this.user));
        return { success: true, user: this.user };
      }

      return { success: false, error: data.error || "Update failed" };
    } catch (error) {
      console.error("Update user type error:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  }

  signOut() {
    this.user = null;
    this.session = null;
    localStorage.removeItem("metroUser");
    localStorage.removeItem("userBookings");
    return { success: true };
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }

  redirectBasedOnUser() {
    if (this.user) {
      // Check if user has selected user type
      if (!this.user.userType || this.user.userType === "general") {
        window.location.href = "/user-type.html";
      } else {
        window.location.href = "/booking.html";
      }
    }
  }
}

// Export for global use
window.MetroAuthManager = MetroAuthManager;
