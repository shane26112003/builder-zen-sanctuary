// Authentication Module
class AuthManager {
    constructor() {
        this.user = null;
        this.loadUser();
    }

    loadUser() {
        const storedUser = localStorage.getItem('metroUser');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
    }

    login(email, password) {
        return new Promise((resolve) => {
            // Simple demo authentication
            setTimeout(() => {
                if (password.length >= 6) {
                    const userData = {
                        id: Date.now().toString(),
                        email: email,
                        userType: 'general',
                        hasLuggage: false
                    };
                    
                    this.user = userData;
                    localStorage.setItem('metroUser', JSON.stringify(userData));
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 500); // Simulate API delay
        });
    }

    logout() {
        this.user = null;
        localStorage.removeItem('metroUser');
        localStorage.removeItem('userBookings');
    }

    updateUserType(userType, hasLuggage) {
        if (this.user) {
            this.user.userType = userType;
            this.user.hasLuggage = hasLuggage;
            localStorage.setItem('metroUser', JSON.stringify(this.user));
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
