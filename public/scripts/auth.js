// Authentication Module with Database Integration
class AuthManager {
  constructor() {
    this.user = null;
    this.loadUser();
  }

  loadUser() {
    const storedUser = localStorage.getItem("metroUser");
    if (storedUser) {
      this.user = JSON.parse(storedUser);
    }
  }

  async login(email, password) {
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
        // Convert database user format to frontend format
        this.user = {
          id: data.user.id,
          email: data.user.email,
          userType: data.user.user_type,
          hasLuggage: data.user.has_luggage,
        };

        localStorage.setItem("metroUser", JSON.stringify(this.user));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  }

  logout() {
    this.user = null;
    localStorage.removeItem("metroUser");
    localStorage.removeItem("userBookings");
  }

  async updateUserType(userType, hasLuggage) {
    if (!this.user) return false;

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
        return true;
      }

      return false;
    } catch (error) {
      console.error("Update user type error:", error);
      return false;
    }
  }

  isAuthenticated() {
    return this.user !== null;
  }

  getUser() {
    return this.user;
  }
}

// Global auth manager instance
window.authManager = new AuthManager();
