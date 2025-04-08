import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { League } from '@shared/schema';
import LeagueItem from './LeagueItem';

interface SportSectionProps {
  sport: string;
  leagues: League[];
  initiallyExpanded?: boolean;
}

export default function SportSection({ sport, leagues, initiallyExpanded = false }: SportSectionProps) {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  
  // Group leagues by category
  const leaguesByCategory = leagues.reduce<Record<string, League[]>>((acc, league) => {
    if (!acc[league.category]) {
      acc[league.category] = [];
    }
    acc[league.category].push(league);
    return acc;
  }, {});

  // Get icon based on sport name
  const getSportIcon = (sport: string) => {
    const sportLower = sport.toLowerCase();
    
    if (sportLower.includes('fútbol') || sportLower.includes('futbol')) return 'fa-futbol';
    if (sportLower.includes('baloncesto') || sportLower.includes('basketball')) return 'fa-basketball-ball';
    if (sportLower.includes('american football')) return 'fa-football-ball';
    if (sportLower.includes('beisbol') || sportLower.includes('baseball')) return 'fa-baseball-ball';
    if (sportLower.includes('hockey')) return 'fa-hockey-puck';
    if (sportLower.includes('rugby')) return 'fa-football-ball';
    if (sportLower.includes('cricket')) return 'fa-cricket';
    if (sportLower.includes('tenis') || sportLower.includes('tennis')) return 'fa-table-tennis';
    // Default icon
    return 'fa-trophy';
  };

  return (
    <div id={sport.toLowerCase().replace(/\s+/g, '-')} className="mb-8">
      <div className="bg-white rounded-md shadow-sm overflow-hidden">
        <div 
          className="bg-primary text-white p-4 flex justify-between items-center cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <h2 className="font-roboto font-medium text-lg flex items-center">
            <i className={`fas ${getSportIcon(sport)} mr-2`}></i> {sport}
          </h2>
          <ChevronDown 
            className={`transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} 
            size={20}
          />
        </div>
        
        {isExpanded && (
          <div className="category-content">
            {Object.entries(leaguesByCategory).map(([category, categoryLeagues]) => (
              <div key={category} className={category !== Object.keys(leaguesByCategory)[Object.keys(leaguesByCategory).length - 1] ? "border-b border-border" : ""}>
                <div className="bg-gray-100 p-3 font-medium font-roboto text-primary">
                  {category}
                </div>
                <div className="divide-y divide-border">
                  {categoryLeagues.map((league) => (
                    <LeagueItem key={league.id} league={league} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
