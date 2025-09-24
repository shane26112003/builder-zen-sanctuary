// Booking Page Main Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const storedUser = localStorage.getItem('metroUser');
    if (!storedUser) {
        window.location.href = '/index.html';
        return;
    }

    const user = JSON.parse(storedUser);
    
    // Redirect to user type selection if not completed
    if (user.userType === 'general') {
        window.location.href = '/user-type.html';
        return;
    }

    // Initialize logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('metroUser');
        localStorage.removeItem('userBookings');
        window.location.href = '/index.html';
    });

    // Add page animations
    document.body.classList.add('fade-in');
});
