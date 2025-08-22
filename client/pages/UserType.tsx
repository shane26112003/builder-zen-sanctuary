import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { UserCheck, Baby, Wheelchair, Users, Luggage, ArrowRight } from 'lucide-react';

type UserTypeOption = 'general' | 'women' | 'elderly' | 'disabled' | 'pregnant';

const userTypeOptions = [
  {
    id: 'general' as UserTypeOption,
    title: 'General Passenger',
    description: 'Regular passenger with no special requirements',
    icon: UserCheck,
    color: 'text-gray-600'
  },
  {
    id: 'women' as UserTypeOption,
    title: 'Woman Passenger',
    description: 'Access to women-only cabin (Cabin 1)',
    icon: Users,
    color: 'text-pink-600'
  },
  {
    id: 'elderly' as UserTypeOption,
    title: 'Elderly Person',
    description: 'Senior citizen with priority seating',
    icon: UserCheck,
    color: 'text-orange-600'
  },
  {
    id: 'disabled' as UserTypeOption,
    title: 'Person with Disability',
    description: 'Special assistance and accessible seating',
    icon: Wheelchair,
    color: 'text-blue-600'
  },
  {
    id: 'pregnant' as UserTypeOption,
    title: 'Pregnant Woman',
    description: 'Expectant mother with priority access',
    icon: Baby,
    color: 'text-purple-600'
  }
];

export default function UserType() {
  const [selectedType, setSelectedType] = useState<UserTypeOption>('general');
  const [hasLuggage, setHasLuggage] = useState(false);
  const { updateUserType } = useAuth();
  const navigate = useNavigate();

  const handleContinue = () => {
    updateUserType(selectedType, hasLuggage);
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about yourself</h1>
          <p className="text-gray-600">This helps us provide you with the best seating options</p>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader>
            <CardTitle className="text-xl">Passenger Information</CardTitle>
            <CardDescription>
              Select your category to access appropriate cabin reservations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedType} onValueChange={(value) => setSelectedType(value as UserTypeOption)}>
              <div className="grid gap-4">
                {userTypeOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.id} className="flex items-center space-x-3">
                      <RadioGroupItem value={option.id} id={option.id} />
                      <Label
                        htmlFor={option.id}
                        className="flex items-center space-x-3 cursor-pointer flex-1 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <IconComponent className={`w-6 h-6 ${option.color}`} />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{option.title}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </RadioGroup>

            <div className="border-t pt-6">
              <div className="flex items-center space-x-3">
                <Checkbox 
                  id="luggage" 
                  checked={hasLuggage}
                  onCheckedChange={setHasLuggage}
                />
                <Label htmlFor="luggage" className="flex items-center space-x-2 cursor-pointer">
                  <Luggage className="w-5 h-5 text-gray-600" />
                  <span>I am carrying heavy luggage</span>
                </Label>
              </div>
              <p className="text-sm text-gray-600 mt-2 ml-6">
                This will help us recommend seats with more storage space
              </p>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleContinue} className="bg-blue-600 hover:bg-blue-700 px-8">
                Continue to Seat Selection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Card className="p-4">
            <h3 className="font-semibold text-pink-600 mb-2">Women-Only Cabin</h3>
            <p className="text-gray-600">Cabin 1 is exclusively reserved for women passengers for enhanced comfort and security.</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-blue-600 mb-2">Priority Cabins</h3>
            <p className="text-gray-600">Cabin 2 offers priority seating for elderly passengers and persons with disabilities.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
