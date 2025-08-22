import React from 'react';
import { Seat as SeatComponent } from './Seat';
import { Seat as SeatType } from '@/contexts/BookingContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CabinProps {
  cabinNumber: number;
  seats: SeatType[];
}

const getCabinInfo = (cabinNumber: number) => {
  switch (cabinNumber) {
    case 1:
      return {
        title: 'Women Only Cabin',
        description: 'Exclusively for women passengers',
        badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
        headerColor: 'text-pink-700'
      };
    case 2:
      return {
        title: 'Priority Cabin',
        description: 'For elderly and disabled passengers',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        headerColor: 'text-blue-700'
      };
    default:
      return {
        title: `Cabin ${cabinNumber}`,
        description: 'General seating',
        badgeColor: 'bg-gray-100 text-gray-800 border-gray-200',
        headerColor: 'text-gray-700'
      };
  }
};

export const Cabin: React.FC<CabinProps> = ({ cabinNumber, seats }) => {
  const cabinInfo = getCabinInfo(cabinNumber);

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row]) {
      acc[seat.row] = [];
    }
    acc[seat.row].push(seat);
    return acc;
  }, {} as Record<number, SeatType[]>);

  // Sort seats within each row by column
  Object.keys(seatsByRow).forEach(row => {
    seatsByRow[Number(row)].sort((a, b) => a.column - b.column);
  });

  const availableSeats = seats.filter(seat => !seat.isBooked).length;
  const totalSeats = seats.length;

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg font-semibold ${cabinInfo.headerColor}`}>
            {cabinInfo.title}
          </CardTitle>
          <Badge variant="outline" className={cabinInfo.badgeColor}>
            {availableSeats}/{totalSeats} available
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{cabinInfo.description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {Object.keys(seatsByRow)
          .sort((a, b) => Number(a) - Number(b))
          .map(row => {
            const rowSeats = seatsByRow[Number(row)];
            const leftSeat = rowSeats.find(seat => seat.column === 1);
            const rightSeat = rowSeats.find(seat => seat.column === 2);

            return (
              <div key={row} className="flex items-center justify-between">
                <div className="w-10 flex justify-center">
                  {leftSeat && <SeatComponent key={leftSeat.id} seat={leftSeat} />}
                </div>

                <div className="text-xs text-gray-500 font-medium px-4">
                  Row {row}
                </div>

                <div className="w-10 flex justify-center">
                  {rightSeat && <SeatComponent key={rightSeat.id} seat={rightSeat} />}
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
};
