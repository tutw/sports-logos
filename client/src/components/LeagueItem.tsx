import { useState } from 'react';
import { League } from '@shared/schema';
import { formatDistanceToNow } from 'date-fns';

interface LeagueItemProps {
  league: League;
}

export default function LeagueItem({ league }: LeagueItemProps) {
  const [imageError, setImageError] = useState(false);
  
  // Format the last updated time as "X hours/minutes ago"
  const formattedLastUpdated = league.lastUpdated 
    ? formatDistanceToNow(new Date(league.lastUpdated), { addSuffix: true }) 
    : 'never updated';
  
  // Determine the status indicator color
  const getStatusColor = () => {
    if (!league.lastUpdated) return 'bg-gray-500'; // Never updated
    
    const hours = (Date.now() - new Date(league.lastUpdated).getTime()) / (1000 * 60 * 60);
    if (hours < 4) return 'bg-green-500'; // Recently updated
    if (hours < 8) return 'bg-yellow-500'; // Getting old
    return 'bg-red-500'; // Needs update
  };

  return (
    <div className="p-4 flex flex-col md:flex-row md:items-center hover:bg-gray-50">
      <div className="md:w-1/2 mb-3 md:mb-0">
        <h3 className="font-medium">{league.name}</h3>
      </div>
      <div className="md:w-1/2 flex items-center">
        <div className="w-16 h-16 bg-gray-100 rounded-md mr-4 flex items-center justify-center overflow-hidden">
          {!imageError && league.imageUrl ? (
            <img 
              src={league.imageUrl} 
              alt={`${league.name} logo`} 
              className="object-contain w-full h-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="text-gray-400 text-center text-xs p-1">
              <i className="fas fa-image text-xl mb-1"></i>
              <div>No image</div>
            </div>
          )}
        </div>
        <div className="text-sm text-gray-600 flex-1">
          <div className="flex items-center mb-1">
            <span className={`inline-block w-2 h-2 rounded-full ${getStatusColor()} mr-2`}></span>
            <span>Updated {formattedLastUpdated}</span>
          </div>
          {!imageError && league.imageUrl && (
            <a 
              href={league.imageUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-[#E74C3C] hover:underline text-xs"
            >
              View full resolution
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
