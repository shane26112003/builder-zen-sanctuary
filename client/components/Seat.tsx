import React from 'react';
import { Seat as SeatType } from '@/contexts/BookingContext';
import { useBooking } from '@/contexts/BookingContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SeatProps {
  seat: SeatType;
  className?: string;
}

export const Seat: React.FC<SeatProps> = ({ seat, className }) => {
  const { selectSeat, canSelectSeat, getRestrictedMessage } = useBooking();
  
  const isAvailable = canSelectSeat(seat);
  const restrictedMessage = getRestrictedMessage(seat);

  const handleClick = () => {
    if (isAvailable) {
      selectSeat(seat.id);
    }
  };

  const getSeatColor = () => {
    if (seat.isBooked) {
      return 'bg-red-500 text-white cursor-not-allowed';
    }
    
    if (seat.isSelected) {
      return 'bg-green-500 text-white shadow-lg transform scale-105';
    }
    
    if (!isAvailable) {
      return 'bg-gray-300 text-gray-500 cursor-not-allowed';
    }
    
    return 'bg-blue-100 hover:bg-blue-200 text-blue-800 cursor-pointer hover:shadow-md hover:transform hover:scale-105';
  };

  const seatContent = (
    <div
      className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all duration-200 border-2',
        getSeatColor(),
        className
      )}
      onClick={handleClick}
    >
      {seat.seatNumber}
    </div>
  );

  if (restrictedMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {seatContent}
          </TooltipTrigger>
          <TooltipContent>
            <p>{restrictedMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return seatContent;
};
