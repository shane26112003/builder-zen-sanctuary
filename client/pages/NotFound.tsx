import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Train, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-600 rounded-full mb-6 animate-pulse">
          <Train className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Station Not Found</h2>
        <p className="text-gray-600 mb-8">
          Looks like this metro station doesn't exist on our route map. 
          Let's get you back on track!
        </p>
        
        <div className="space-y-4">
          <Link to="/">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Home className="w-4 h-4 mr-2" />
              Go to Home Station
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>Need help? Contact our metro support team.</p>
        </div>
      </div>
    </div>
  );
}
