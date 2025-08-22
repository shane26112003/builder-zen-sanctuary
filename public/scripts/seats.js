// Seats Management Module
class SeatsManager {
    constructor() {
        this.seats = [];
        this.selectedSeats = [];
        this.userBookings = [];
        this.user = null;
        this.seatPrice = 25;
        
        this.initializeSeats();
        this.loadUserData();
        this.loadUserBookings();
        this.renderCabins();
        this.bindEvents();
    }

    initializeSeats() {
        this.seats = [];
        let globalSeatId = 1;

        for (let cabin = 1; cabin <= 5; cabin++) {
            let cabinSeatNumber = 1;
            for (let row = 1; row <= 10; row++) {
                for (let column = 1; column <= 2; column++) {
                    this.seats.push({
                        id: `${cabin}-${cabinSeatNumber}`,
                        cabin,
                        seatNumber: cabinSeatNumber,
                        row,
                        column,
                        isBooked: Math.random() > 0.7, // Randomly book some seats for demo
                        bookedBy: Math.random() > 0.7 ? 'other-user' : null,
                        isSelected: false
                    });
                    cabinSeatNumber++;
                    globalSeatId++;
                }
            }
        }
    }

    loadUserData() {
        const storedUser = localStorage.getItem('metroUser');
        if (storedUser) {
            this.user = JSON.parse(storedUser);
        }
    }

    loadUserBookings() {
        const stored = localStorage.getItem('userBookings');
        if (stored && this.user) {
            this.userBookings = JSON.parse(stored);
            
            // Update seats to reflect user bookings
            this.seats.forEach(seat => {
                const userBooking = this.userBookings.find(b => b.id === seat.id);
                if (userBooking) {
                    seat.isBooked = true;
                    seat.bookedBy = this.user.id;
                }
            });
        }
    }

    getCabinInfo(cabinNumber) {
        switch (cabinNumber) {
            case 1:
                return {
                    title: 'Women Only Cabin',
                    description: 'Exclusively for women passengers',
                    type: 'women'
                };
            case 2:
                return {
                    title: 'Priority Cabin',
                    description: 'For pregnant women, women with luggage, disabled, and elderly',
                    type: 'priority'
                };
            default:
                return {
                    title: `Cabin ${cabinNumber}`,
                    description: 'General seating',
                    type: 'general'
                };
        }
    }

    canSelectSeat(seat) {
        if (seat.isBooked) return false;
        if (!this.user) return false;

        // Cabin 1 is women-only
        if (seat.cabin === 1 && this.user.userType !== 'women' && this.user.userType !== 'pregnant') {
            return false;
        }

        // Cabin 2 is for pregnant women, women with luggage, disabled, and elderly
        if (seat.cabin === 2) {
            const allowedForPriorityCabin =
                this.user.userType === 'pregnant' ||
                this.user.userType === 'disabled' ||
                this.user.userType === 'elderly' ||
                (this.user.userType === 'women' && this.user.hasLuggage);

            if (!allowedForPriorityCabin) {
                return false;
            }
        }

        return true;
    }

    getRestrictedMessage(seat) {
        if (seat.isBooked) return 'Seat already booked';
        if (!this.user) return 'Please login first';

        if (seat.cabin === 1 && this.user.userType !== 'women' && this.user.userType !== 'pregnant') {
            return 'Women-only cabin';
        }

        if (seat.cabin === 2) {
            const allowedForPriorityCabin =
                this.user.userType === 'pregnant' ||
                this.user.userType === 'disabled' ||
                this.user.userType === 'elderly' ||
                (this.user.userType === 'women' && this.user.hasLuggage);

            if (!allowedForPriorityCabin) {
                return 'Priority cabin for pregnant women, women with luggage, disabled, and elderly';
            }
        }

        return '';
    }

    selectSeat(seatId) {
        const seat = this.seats.find(s => s.id === seatId);
        if (!seat || !this.canSelectSeat(seat)) return;

        seat.isSelected = !seat.isSelected;
        
        if (seat.isSelected) {
            this.selectedSeats.push(seat);
        } else {
            this.selectedSeats = this.selectedSeats.filter(s => s.id !== seatId);
        }

        this.updateSelectedSeatsDisplay();
        this.renderSeat(seat);
    }

    bookSelectedSeats() {
        if (!this.user || this.selectedSeats.length === 0) return;

        const seatsToBook = this.selectedSeats.map(seat => ({
            ...seat,
            isBooked: true,
            bookedBy: this.user.id,
            isSelected: false
        }));

        // Update seats
        this.seats.forEach(seat => {
            const bookedSeat = seatsToBook.find(s => s.id === seat.id);
            if (bookedSeat) {
                Object.assign(seat, bookedSeat);
            }
        });

        // Update user bookings
        this.userBookings = [...this.userBookings, ...seatsToBook];
        localStorage.setItem('userBookings', JSON.stringify(this.userBookings));

        // Clear selected seats
        this.selectedSeats = [];

        // Update displays
        this.updateSelectedSeatsDisplay();
        this.updateUserBookingsDisplay();
        this.renderCabins();

        // Show success message
        this.showBookingSuccess();
    }

    showBookingSuccess() {
        const bookBtn = document.getElementById('bookSeatsBtn');
        const originalText = bookBtn.innerHTML;
        
        bookBtn.innerHTML = `
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Booked Successfully!
        `;
        bookBtn.classList.add('booking-success');
        
        setTimeout(() => {
            bookBtn.innerHTML = originalText;
            bookBtn.classList.remove('booking-success');
        }, 2000);
    }

    renderCabins() {
        const cabinsGrid = document.getElementById('cabinsGrid');
        cabinsGrid.innerHTML = '';

        for (let cabinNumber = 1; cabinNumber <= 5; cabinNumber++) {
            const cabinSeats = this.seats.filter(seat => seat.cabin === cabinNumber);
            const cabinInfo = this.getCabinInfo(cabinNumber);
            const availableSeats = cabinSeats.filter(seat => !seat.isBooked).length;
            const totalSeats = cabinSeats.length;

            const cabinElement = document.createElement('div');
            cabinElement.className = 'cabin-card';
            cabinElement.innerHTML = `
                <div class="cabin-header">
                    <div class="cabin-header-top">
                        <h3 class="cabin-title ${cabinInfo.type}">${cabinInfo.title}</h3>
                        <span class="availability-badge ${cabinInfo.type}">
                            ${availableSeats}/${totalSeats} available
                        </span>
                    </div>
                    <p class="cabin-description">${cabinInfo.description}</p>
                </div>
                <div class="cabin-content">
                    <div class="seat-grid" id="cabin-${cabinNumber}-grid">
                        ${this.renderCabinSeats(cabinSeats)}
                    </div>
                </div>
            `;

            cabinsGrid.appendChild(cabinElement);
        }
    }

    renderCabinSeats(cabinSeats) {
        // Group seats by row
        const seatsByRow = {};
        cabinSeats.forEach(seat => {
            if (!seatsByRow[seat.row]) {
                seatsByRow[seat.row] = [];
            }
            seatsByRow[seat.row].push(seat);
        });

        let html = '';
        for (let row = 1; row <= 10; row++) {
            const rowSeats = seatsByRow[row] || [];
            const leftSeat = rowSeats.find(seat => seat.column === 1);
            const rightSeat = rowSeats.find(seat => seat.column === 2);

            html += `
                <div class="seat-row">
                    <div class="seat-column">
                        ${leftSeat ? this.renderSeatHTML(leftSeat) : ''}
                    </div>
                    <div class="row-label">Row ${row}</div>
                    <div class="seat-column">
                        ${rightSeat ? this.renderSeatHTML(rightSeat) : ''}
                    </div>
                </div>
            `;
        }

        return html;
    }

    renderSeatHTML(seat) {
        const canSelect = this.canSelectSeat(seat);
        const restrictedMessage = this.getRestrictedMessage(seat);
        
        let seatClass = 'seat ';
        if (seat.isBooked) {
            seatClass += 'booked';
        } else if (seat.isSelected) {
            seatClass += 'selected';
        } else if (!canSelect) {
            seatClass += 'restricted';
        } else {
            seatClass += 'available';
        }

        const title = restrictedMessage || `Seat ${seat.seatNumber}`;

        return `
            <div class="${seatClass}" 
                 data-seat-id="${seat.id}" 
                 title="${title}"
                 onclick="seatsManager.selectSeat('${seat.id}')">
                ${seat.seatNumber}
            </div>
        `;
    }

    renderSeat(seat) {
        const seatElement = document.querySelector(`[data-seat-id="${seat.id}"]`);
        if (seatElement) {
            const canSelect = this.canSelectSeat(seat);
            
            seatElement.className = 'seat ';
            if (seat.isBooked) {
                seatElement.className += 'booked';
            } else if (seat.isSelected) {
                seatElement.className += 'selected';
            } else if (!canSelect) {
                seatElement.className += 'restricted';
            } else {
                seatElement.className += 'available';
            }
        }
    }

    updateSelectedSeatsDisplay() {
        const selectedSeatsList = document.getElementById('selectedSeatsList');
        const bookingTotal = document.getElementById('bookingTotal');
        const seatCount = document.getElementById('seatCount');
        const totalAmount = document.getElementById('totalAmount');

        if (this.selectedSeats.length === 0) {
            selectedSeatsList.innerHTML = '<p class="no-selection">No seats selected</p>';
            bookingTotal.style.display = 'none';
        } else {
            let html = '';
            this.selectedSeats.forEach(seat => {
                html += `
                    <div class="selected-seat-item">
                        <span class="seat-label">Cabin ${seat.cabin} - Seat ${seat.seatNumber}</span>
                        <span class="seat-price">$${this.seatPrice}</span>
                    </div>
                `;
            });
            selectedSeatsList.innerHTML = html;
            
            seatCount.textContent = this.selectedSeats.length;
            totalAmount.textContent = this.selectedSeats.length * this.seatPrice;
            bookingTotal.style.display = 'block';
        }
    }

    updateUserBookingsDisplay() {
        const userBookingsCard = document.getElementById('userBookingsCard');
        const userBookingsList = document.getElementById('userBookingsList');

        if (this.userBookings.length === 0) {
            userBookingsCard.style.display = 'none';
        } else {
            let html = '';
            this.userBookings.forEach(seat => {
                html += `
                    <div class="booking-item">
                        <span class="seat-label">Cabin ${seat.cabin} - Seat ${seat.seatNumber}</span>
                        <span class="booking-badge">Booked</span>
                    </div>
                `;
            });
            userBookingsList.innerHTML = html;
            userBookingsCard.style.display = 'block';
        }
    }

    bindEvents() {
        const bookSeatsBtn = document.getElementById('bookSeatsBtn');
        if (bookSeatsBtn) {
            bookSeatsBtn.addEventListener('click', () => this.bookSelectedSeats());
        }
    }

    updateUserInfo() {
        if (!this.user) return;

        document.getElementById('userEmail').textContent = this.user.email;
        
        const userTypeBadge = document.getElementById('userTypeBadge');
        const passengerType = document.getElementById('passengerType');
        const luggageInfo = document.getElementById('luggageInfo');
        const accessInfo = document.getElementById('accessInfo');

        const typeText = this.user.userType === 'general' ? 'General' : 
                        this.user.userType.charAt(0).toUpperCase() + this.user.userType.slice(1);
        
        userTypeBadge.textContent = typeText;
        passengerType.textContent = this.user.userType === 'general' ? 'General Passenger' : 
                                   typeText.replace('_', ' ') + ' Passenger';

        if (this.user.hasLuggage) {
            luggageInfo.style.display = 'block';
        }

        let accessText = '';
        if (this.user.userType === 'women' || this.user.userType === 'pregnant') {
            if (this.user.hasLuggage) {
                accessText = 'You have access to women-only cabin (Cabin 1) and priority cabin (Cabin 2)';
            } else {
                accessText = 'You have access to the women-only cabin (Cabin 1)';
            }
        } else if (this.user.userType === 'elderly' || this.user.userType === 'disabled') {
            accessText = 'You have priority access to Cabin 2';
        } else {
            accessText = 'You can book seats in Cabins 3, 4, and 5';
        }
        accessInfo.querySelector('p').textContent = accessText;
    }
}

// Initialize seats manager when page loads
let seatsManager;
document.addEventListener('DOMContentLoaded', function() {
    seatsManager = new SeatsManager();
    seatsManager.updateUserInfo();
    seatsManager.updateSelectedSeatsDisplay();
    seatsManager.updateUserBookingsDisplay();
});
