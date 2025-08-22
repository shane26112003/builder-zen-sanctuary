import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

export interface Seat {
  id: string;
  cabin: number;
  seatNumber: number;
  row: number;
  position: 'A' | 'B' | 'C' | 'D'; // A,B = left side, C,D = right side
  isBooked: boolean;
  bookedBy?: string;
  isSelected: boolean;
}

interface BookingContextType {
  seats: Seat[];
  selectedSeats: Seat[];
  selectSeat: (seatId: string) => void;
  bookSelectedSeats: () => void;
  userBookings: Seat[];
  canSelectSeat: (seat: Seat) => boolean;
  getRestrictedMessage: (seat: Seat) => string;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

// Generate 100 seats across 5 cabins (20 seats each)
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  let seatId = 1;

  for (let cabin = 1; cabin <= 5; cabin++) {
    for (let row = 1; row <= 5; row++) {
      for (let position of ['A', 'B', 'C', 'D'] as const) {
        seats.push({
          id: `${cabin}-${row}${position}`,
          cabin,
          seatNumber: seatId,
          row,
          position,
          isBooked: Math.random() > 0.7, // Randomly book some seats for demo
          bookedBy: Math.random() > 0.7 ? 'other-user' : undefined,
          isSelected: false
        });
        seatId++;
      }
    }
  }

  return seats;
};

export const BookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [seats, setSeats] = useState<Seat[]>(() => generateSeats());
  const [userBookings, setUserBookings] = useState<Seat[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Load user bookings from localStorage
    const stored = localStorage.getItem('userBookings');
    if (stored && user) {
      const bookings = JSON.parse(stored);
      setUserBookings(bookings);
      
      // Update seats to reflect user bookings
      setSeats(prevSeats => 
        prevSeats.map(seat => ({
          ...seat,
          isBooked: seat.isBooked || bookings.some((b: Seat) => b.id === seat.id),
          bookedBy: bookings.some((b: Seat) => b.id === seat.id) ? user.id : seat.bookedBy
        }))
      );
    }
  }, [user]);

  const selectedSeats = seats.filter(seat => seat.isSelected);

  const canSelectSeat = (seat: Seat): boolean => {
    if (seat.isBooked) return false;
    if (!user) return false;

    // Cabin 1 is women-only
    if (seat.cabin === 1 && user.userType !== 'women' && user.userType !== 'pregnant') {
      return false;
    }

    // Cabin 2 is for elderly and disabled
    if (seat.cabin === 2 && user.userType !== 'elderly' && user.userType !== 'disabled') {
      return false;
    }

    return true;
  };

  const getRestrictedMessage = (seat: Seat): string => {
    if (seat.isBooked) return 'Seat already booked';
    if (!user) return 'Please login first';

    if (seat.cabin === 1 && user.userType !== 'women' && user.userType !== 'pregnant') {
      return 'Women-only cabin';
    }

    if (seat.cabin === 2 && user.userType !== 'elderly' && user.userType !== 'disabled') {
      return 'Priority cabin for elderly and disabled';
    }

    return '';
  };

  const selectSeat = (seatId: string) => {
    setSeats(prevSeats =>
      prevSeats.map(seat => {
        if (seat.id === seatId) {
          if (!canSelectSeat(seat)) return seat;
          return { ...seat, isSelected: !seat.isSelected };
        }
        return seat;
      })
    );
  };

  const bookSelectedSeats = () => {
    if (!user) return;

    const seatsToBook = selectedSeats.map(seat => ({
      ...seat,
      isBooked: true,
      bookedBy: user.id,
      isSelected: false
    }));

    setSeats(prevSeats =>
      prevSeats.map(seat => {
        const bookedSeat = seatsToBook.find(s => s.id === seat.id);
        if (bookedSeat) {
          return bookedSeat;
        }
        return seat;
      })
    );

    const newBookings = [...userBookings, ...seatsToBook];
    setUserBookings(newBookings);
    localStorage.setItem('userBookings', JSON.stringify(newBookings));
  };

  return (
    <BookingContext.Provider value={{
      seats,
      selectedSeats,
      selectSeat,
      bookSelectedSeats,
      userBookings,
      canSelectSeat,
      getRestrictedMessage
    }}>
      {children}
    </BookingContext.Provider>
  );
};
