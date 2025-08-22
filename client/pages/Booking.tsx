import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import { Cabin } from '@/components/Cabin';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Train, LogOut, User, CreditCard, CheckCircle } from 'lucide-react';

export default function Booking() {
  const { user, logout } = useAuth();
  const { seats, selectedSeats, bookSelectedSeats, userBookings } = useBooking();

  // Group seats by cabin
  const seatsByCabin = seats.reduce((acc, seat) => {
    if (!acc[seat.cabin]) {
      acc[seat.cabin] = [];
    }
    acc[seat.cabin].push(seat);
    return acc;
  }, {} as Record<number, typeof seats>);

  const handleBooking = () => {
    bookSelectedSeats();
  };

  const totalCost = selectedSeats.length * 25; // $25 per seat

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Please log in first</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
                <Train className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MetroReserve</h1>
                <p className="text-sm text-gray-600">Seat Reservation System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">{user.email}</span>
                <Badge variant="outline" className="capitalize">
                  {user.userType === 'general' ? 'General' : user.userType}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main seat selection area */}
          <div className="lg:col-span-3 space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Seats</h2>
              <p className="text-gray-600">Choose from available seats across our metro cabins</p>
            </div>

            {/* Legend */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-100 border-2 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 border-2 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 border-2 rounded"></div>
                    <span>Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-300 border-2 rounded"></div>
                    <span>Restricted</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cabins */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map(cabinNumber => (
                <Cabin
                  key={cabinNumber}
                  cabinNumber={cabinNumber}
                  seats={seatsByCabin[cabinNumber] || []}
                />
              ))}
            </div>
          </div>

          {/* Booking sidebar */}
          <div className="space-y-6">
            {/* Selected seats */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Selected Seats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedSeats.length === 0 ? (
                  <p className="text-gray-500 text-sm">No seats selected</p>
                ) : (
                  <div className="space-y-2">
                    {selectedSeats.map(seat => (
                      <div key={seat.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">
                          Cabin {seat.cabin} - Seat {seat.seatNumber}
                        </span>
                        <span className="text-sm text-green-700">$25</span>
                      </div>
                    ))}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total ({selectedSeats.length} seats)</span>
                      <span>${totalCost}</span>
                    </div>
                    
                    <Button 
                      onClick={handleBooking} 
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={selectedSeats.length === 0}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Book Seats
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* User bookings */}
            {userBookings.length > 0 && (
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Your Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {userBookings.map(seat => (
                      <div key={seat.id} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium">
                          Cabin {seat.cabin} - Seat {seat.seatNumber}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Booked
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User info */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Passenger Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Type</p>
                  <p className="font-medium capitalize">
                    {user.userType === 'general' ? 'General Passenger' : user.userType.replace('_', ' ')}
                  </p>
                </div>
                {user.hasLuggage && (
                  <div>
                    <p className="text-sm text-gray-600">Special Requirements</p>
                    <p className="font-medium">Heavy Luggage</p>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-4">
                  {user.userType === 'women' || user.userType === 'pregnant' 
                    ? 'You have access to the women-only cabin (Cabin 1)'
                    : user.userType === 'elderly' || user.userType === 'disabled'
                    ? 'You have priority access to Cabin 2'
                    : 'You can book seats in Cabins 3, 4, and 5'
                  }
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
