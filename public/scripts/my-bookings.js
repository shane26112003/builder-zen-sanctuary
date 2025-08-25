// My Bookings Page Functionality
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

    // Initialize page
    initializePage(user);
    loadUserBookings(user.id);

    // Initialize logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('metroUser');
        localStorage.removeItem('userBookings');
        window.location.href = '/index.html';
    });
});

function initializePage(user) {
    // Update user info display
    document.getElementById('userEmail').textContent = user.email;
    
    const userTypeBadge = document.getElementById('userTypeBadge');
    userTypeBadge.textContent = formatUserType(user.userType);
    userTypeBadge.className = `user-type-badge ${user.userType}`;
}

function formatUserType(userType) {
    const typeMap = {
        'general': 'General',
        'women': 'Women',
        'elderly': 'Elderly',
        'disabled': 'Disabled',
        'pregnant': 'Pregnant'
    };
    return typeMap[userType] || 'General';
}

async function loadUserBookings(userId) {
    const loadingState = document.getElementById('loadingState');
    const bookingsContainer = document.getElementById('bookingsContainer');

    try {
        const response = await fetch(`/api/bookings/${userId}`);
        const data = await response.json();

        loadingState.style.display = 'none';

        if (data.success && data.bookings && data.bookings.length > 0) {
            displayBookings(data.bookings);
        } else {
            displayEmptyState();
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        loadingState.style.display = 'none';
        displayErrorState();
    }
}

function displayBookings(bookings) {
    const bookingsContainer = document.getElementById('bookingsContainer');
    
    const bookingsHTML = bookings.map(booking => {
        const seat = booking.metro_seats;
        const bookingDate = new Date(booking.booking_date).toLocaleDateString();
        const isCancelled = booking.status === 'cancelled';
        
        return `
            <div class="booking-card ${isCancelled ? 'cancelled' : ''}">
                <div class="booking-header">
                    <div>
                        <strong>Booking #${booking.id.slice(0, 8)}</strong>
                        <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">
                            ${bookingDate}
                        </div>
                    </div>
                    <div class="booking-status ${booking.status}">
                        ${booking.status === 'confirmed' ? '✓' : '✕'} ${booking.status.toUpperCase()}
                    </div>
                </div>
                <div class="booking-content">
                    <div class="booking-details">
                        <div class="detail-item">
                            <span class="detail-label">Cabin</span>
                            <span class="detail-value">Cabin ${seat.cabin}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Seat</span>
                            <span class="detail-value">Seat ${seat.seat_number}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Position</span>
                            <span class="detail-value">Row ${seat.row_number}, Column ${seat.column_number}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Amount</span>
                            <span class="detail-value">$${parseFloat(booking.amount).toFixed(2)}</span>
                        </div>
                    </div>
                    
                    <div class="booking-actions">
                        <button class="btn btn-info btn-sm" onclick="viewTicket('${booking.id}')">
                            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            View Ticket
                        </button>
                        
                        ${!isCancelled ? `
                            <button class="btn btn-danger btn-sm" onclick="cancelBooking('${booking.id}')" id="cancel-${booking.id}">
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                                Cancel Booking
                            </button>
                        ` : `
                            <span style="font-size: 0.875rem; color: #6b7280; font-style: italic;">
                                Cancelled on ${new Date(booking.cancelled_at || booking.booking_date).toLocaleDateString()}
                            </span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    bookingsContainer.innerHTML = bookingsHTML;
}

function displayEmptyState() {
    const bookingsContainer = document.getElementById('bookingsContainer');
    bookingsContainer.innerHTML = `
        <div class="empty-state">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 style="margin-bottom: 0.5rem;">No Bookings Found</h3>
            <p style="margin-bottom: 1.5rem;">You haven't made any metro seat reservations yet.</p>
            <button class="btn btn-primary" onclick="window.location.href='/booking.html'">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Make Your First Booking
            </button>
        </div>
    `;
}

function displayErrorState() {
    const bookingsContainer = document.getElementById('bookingsContainer');
    bookingsContainer.innerHTML = `
        <div class="empty-state">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="color: #ef4444;">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <h3 style="margin-bottom: 0.5rem;">Error Loading Bookings</h3>
            <p style="margin-bottom: 1.5rem;">There was a problem loading your bookings. Please try again.</p>
            <button class="btn btn-primary" onclick="location.reload()">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Retry
            </button>
        </div>
    `;
}

async function cancelBooking(bookingId) {
    const user = JSON.parse(localStorage.getItem('metroUser'));
    const cancelButton = document.getElementById(`cancel-${bookingId}`);
    
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
        return;
    }

    try {
        // Show loading state
        cancelButton.disabled = true;
        cancelButton.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" class="animate-spin">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Cancelling...
        `;

        const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId: user.id })
        });

        const data = await response.json();

        if (data.success) {
            // Show success message
            showNotification('Booking cancelled successfully!', 'success');
            
            // Reload bookings to reflect changes
            loadUserBookings(user.id);
        } else {
            throw new Error(data.error || 'Failed to cancel booking');
        }
    } catch (error) {
        console.error('Error cancelling booking:', error);
        showNotification(error.message || 'Failed to cancel booking. Please try again.', 'error');
        
        // Reset button state
        cancelButton.disabled = false;
        cancelButton.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Cancel Booking
        `;
    }
}

async function viewTicket(bookingId) {
    const user = JSON.parse(localStorage.getItem('metroUser'));
    
    try {
        const response = await fetch(`/api/bookings/${bookingId}/ticket?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.ticket) {
            displayTicketModal(data.ticket);
        } else {
            throw new Error(data.error || 'Failed to load ticket');
        }
    } catch (error) {
        console.error('Error loading ticket:', error);
        showNotification('Failed to load ticket. Please try again.', 'error');
    }
}

function displayTicketModal(ticket) {
    const ticketContent = document.getElementById('ticketContent');
    const bookingDate = new Date(ticket.bookingDate).toLocaleDateString();
    const validUntil = new Date(ticket.validUntil).toLocaleDateString();
    
    ticketContent.innerHTML = `
        <div class="ticket-header">
            <div class="ticket-title">Metro Ticket</div>
            <div class="ticket-subtitle">MetroReserve System</div>
        </div>
        
        <div class="ticket-details">
            <div class="detail-item">
                <span class="detail-label">Booking ID</span>
                <span class="detail-value">${ticket.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Passenger</span>
                <span class="detail-value">${ticket.passenger.email}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Passenger Type</span>
                <span class="detail-value">${formatUserType(ticket.passenger.type)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Luggage</span>
                <span class="detail-value">${ticket.passenger.hasLuggage ? 'Yes' : 'No'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Cabin</span>
                <span class="detail-value">Cabin ${ticket.seat.cabin}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Seat</span>
                <span class="detail-value">Seat ${ticket.seat.seatNumber}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Position</span>
                <span class="detail-value">Row ${ticket.seat.row}, Col ${ticket.seat.column}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Amount</span>
                <span class="detail-value">$${parseFloat(ticket.amount).toFixed(2)}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Booking Date</span>
                <span class="detail-value">${bookingDate}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">Status</span>
                <span class="detail-value booking-status ${ticket.status}">${ticket.status.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="qr-code-section">
            <div class="qr-placeholder">
                QR Code<br>
                ${ticket.qrCode}
            </div>
            <div style="font-size: 0.75rem; color: #6b7280;">
                Scan at metro station
            </div>
        </div>
        
        <div class="ticket-footer">
            <p>Valid until: ${validUntil}</p>
            <p>Please arrive at the station 10 minutes before departure</p>
            <p>This ticket is non-transferable and must be presented with valid ID</p>
        </div>
    `;
    
    // Show modal
    document.getElementById('ticketModal').style.display = 'flex';
    
    // Store current ticket for printing/sharing
    window.currentTicket = ticket;
}

function closeTicketModal() {
    document.getElementById('ticketModal').style.display = 'none';
    window.currentTicket = null;
}

function printTicket() {
    window.print();
}

function shareTicket() {
    if (!window.currentTicket) return;
    
    const ticket = window.currentTicket;
    const shareText = `Metro Ticket - Cabin ${ticket.seat.cabin}, Seat ${ticket.seat.seatNumber}
Booking: ${ticket.id.slice(0, 8).toUpperCase()}
Amount: $${parseFloat(ticket.amount).toFixed(2)}
Status: ${ticket.status.toUpperCase()}

QR Code: ${ticket.qrCode}

MetroReserve - Secure your journey with us`;

    if (navigator.share) {
        navigator.share({
            title: 'Metro Ticket',
            text: shareText
        }).catch(console.error);
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Ticket details copied to clipboard!', 'success');
        }).catch(() => {
            showNotification('Failed to copy ticket details', 'error');
        });
    } else {
        // Fallback: show text in alert
        alert(shareText);
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 1001;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || colors.info;
    
    notification.textContent = message;
    
    // Add animation keyframes if not already added
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('ticketModal');
    if (event.target === modal) {
        closeTicketModal();
    }
});

// Close modal with escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeTicketModal();
    }
});
