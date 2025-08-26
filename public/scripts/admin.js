// Admin Dashboard JavaScript
class AdminDashboard {
  constructor() {
    this.stats = {};
    this.passengers = [];
    this.recentBookings = [];
    this.cabinOccupancy = [];
    this.adminEmail = null;

    this.init();
  }

  async init() {
    // Check authorization first
    if (!(await this.checkAdminAuth())) {
      return;
    }

    this.bindEvents();
    await this.loadAllData();
    this.startAutoRefresh();
  }

  bindEvents() {
    // Refresh button
    document.getElementById("refreshDataBtn").addEventListener("click", () => {
      this.loadAllData();
    });

    // Search functionality
    document.getElementById("searchBtn").addEventListener("click", () => {
      this.searchPassengers();
    });

    // Enter key on search input
    document.getElementById("searchInput").addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.searchPassengers();
      }
    });

    // User type filter change
    document.getElementById("userTypeFilter").addEventListener("change", () => {
      this.searchPassengers();
    });

    // Export button
    document
      .getElementById("exportPassengersBtn")
      .addEventListener("click", () => {
        this.exportPassengerData();
      });

    // Logout button
    document.getElementById("logoutBtn").addEventListener("click", () => {
      this.handleLogout();
    });
  }

  async loadAllData() {
    try {
      // Show loading state
      this.showLoading();

      // Load all data in parallel
      const [statsResponse, passengersResponse, bookingsResponse] =
        await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/passengers"),
          fetch("/api/admin/recent-bookings"),
        ]);

      const statsData = await statsResponse.json();
      const passengersData = await passengersResponse.json();
      const bookingsData = await bookingsResponse.json();

      if (statsData.success) {
        this.stats = statsData.stats;
        this.updateStatsDisplay();
        this.updateCabinOccupancy(statsData.stats.cabin_occupancy);
      }

      if (passengersData.success) {
        this.passengers = passengersData.passengers;
        this.updatePassengersTable();
      }

      if (bookingsData.success) {
        this.recentBookings = bookingsData.recent_bookings;
        this.updateRecentBookings();
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
      this.showError("Failed to load dashboard data");
    }
  }

  updateStatsDisplay() {
    document.getElementById("totalPassengers").textContent =
      this.stats.unique_passengers;
    document.getElementById("totalBookings").textContent =
      this.stats.total_bookings;
    document.getElementById("totalRevenue").textContent =
      `$${this.stats.total_revenue.toFixed(2)}`;
    document.getElementById("bookingsToday").textContent =
      this.stats.bookings_today;
  }

  updateCabinOccupancy(cabinData) {
    const cabinStats = document.getElementById("cabinStats");

    const cabinNames = {
      1: "Women Only Cabin",
      2: "Priority Cabin",
      3: "General Cabin 3",
      4: "General Cabin 4",
      5: "General Cabin 5",
    };

    cabinStats.innerHTML = cabinData
      .map((cabin) => {
        const occupancyRate = parseFloat(cabin.occupancy_rate) || 0;
        const fillColor =
          occupancyRate > 80
            ? "#ef4444"
            : occupancyRate > 60
              ? "#f59e0b"
              : "#10b981";

        return `
                <div class="cabin-stat-item">
                    <div class="cabin-info">
                        <h4>${cabinNames[cabin.cabin] || `Cabin ${cabin.cabin}`}</h4>
                        <p>${cabin.booked_seats}/${cabin.total_seats} seats booked</p>
                    </div>
                    <div>
                        <div class="occupancy-bar">
                            <div class="occupancy-fill" style="width: ${occupancyRate}%; background-color: ${fillColor};"></div>
                        </div>
                        <div class="occupancy-text">${occupancyRate}%</div>
                    </div>
                </div>
            `;
      })
      .join("");
  }

  updatePassengersTable() {
    const tableBody = document.getElementById("passengersTableBody");

    if (this.passengers.length === 0) {
      tableBody.innerHTML =
        '<tr><td colspan="6" class="loading-row">No passengers found</td></tr>';
      return;
    }

    tableBody.innerHTML = this.passengers
      .map(
        (passenger) => `
            <tr>
                <td>${passenger.email}</td>
                <td>
                    <span class="user-type-badge ${passenger.user_type}">
                        ${passenger.user_type}
                    </span>
                </td>
                <td>
                    <span class="luggage-indicator ${passenger.has_luggage ? "has-luggage" : "no-luggage"}">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l6 0"/>
                        </svg>
                        ${passenger.has_luggage ? "Yes" : "No"}
                    </span>
                </td>
                <td>${passenger.total_bookings}</td>
                <td>$${passenger.total_spent.toFixed(2)}</td>
                <td>${new Date(passenger.created_at).toLocaleDateString()}</td>
            </tr>
        `,
      )
      .join("");
  }

  updateRecentBookings() {
    const recentBookings = document.getElementById("recentBookings");

    if (this.recentBookings.length === 0) {
      recentBookings.innerHTML =
        '<div class="loading-message">No recent bookings</div>';
      return;
    }

    recentBookings.innerHTML = this.recentBookings
      .slice(0, 10)
      .map(
        (booking) => `
            <div class="booking-item">
                <div class="booking-info">
                    <h5>${booking.email}</h5>
                    <p>Cabin ${booking.cabin}, Seat ${booking.seat_number} • ${booking.user_type}</p>
                    <p>${new Date(booking.booking_date).toLocaleString()}</p>
                </div>
                <div class="booking-amount">$${parseFloat(booking.amount).toFixed(2)}</div>
            </div>
        `,
      )
      .join("");
  }

  async searchPassengers() {
    const query = document.getElementById("searchInput").value.trim();
    const userType = document.getElementById("userTypeFilter").value;

    try {
      const params = new URLSearchParams();
      if (query) params.append("query", query);
      if (userType !== "all") params.append("userType", userType);

      const response = await fetch(`/api/admin/search?${params}`);
      const data = await response.json();

      if (data.success) {
        this.passengers = data.passengers;
        this.updatePassengersTable();
      } else {
        this.showError("Failed to search passengers");
      }
    } catch (error) {
      console.error("Search error:", error);
      this.showError("Search failed");
    }
  }

  exportPassengerData() {
    if (this.passengers.length === 0) {
      this.showError("No passenger data to export");
      return;
    }

    // Convert to CSV
    const headers = [
      "Email",
      "User Type",
      "Has Luggage",
      "Total Bookings",
      "Total Spent",
      "Joined Date",
    ];
    const csvContent = [
      headers.join(","),
      ...this.passengers.map((passenger) =>
        [
          passenger.email,
          passenger.user_type,
          passenger.has_luggage ? "Yes" : "No",
          passenger.total_bookings,
          passenger.total_spent.toFixed(2),
          new Date(passenger.created_at).toLocaleDateString(),
        ].join(","),
      ),
    ].join("\\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metro-passengers-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    this.showSuccess("Passenger data exported successfully");
  }

  showLoading() {
    document.getElementById("passengersTableBody").innerHTML =
      '<tr><td colspan="6" class="loading-row"><span class="loading-spinner"></span> Loading passengers...</td></tr>';

    document.getElementById("recentBookings").innerHTML =
      '<div class="loading-message"><span class="loading-spinner"></span> Loading recent bookings...</div>';
  }

  showSuccess(message) {
    this.showMessage(message, "success");
  }

  showError(message) {
    this.showMessage(message, "error");
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll(".message");
    existingMessages.forEach((msg) => msg.remove());

    // Create new message
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;

    // Insert at top of admin container
    const adminContainer = document.querySelector(".admin-container");
    adminContainer.insertBefore(messageDiv, adminContainer.firstChild);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 5000);
  }

  startAutoRefresh() {
    // Refresh data every 30 seconds
    setInterval(() => {
      this.loadAllData();
    }, 30000);
  }
}

// Initialize admin dashboard when page loads
document.addEventListener("DOMContentLoaded", function () {
  new AdminDashboard();
});
