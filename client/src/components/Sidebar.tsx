import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Trophy, Menu } from 'lucide-react';

interface SidebarProps {
  sports: string[];
  lastUpdated: Date | null;
  activeSport: string;
  onSelectSport: (sport: string) => void;
}

export default function Sidebar({ sports, lastUpdated, activeSport, onSelectSport }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on mount and when window resizes
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Close mobile menu if screen size changes to desktop
  useEffect(() => {
    if (!isMobile && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [isMobile, mobileMenuOpen]);

  // Get sport icon based on name
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
    if (sportLower.includes('voleibol') || sportLower.includes('volleyball')) return 'fa-volleyball-ball';
    if (sportLower.includes('balonmano') || sportLower.includes('handball')) return 'fa-hand-paper';
    if (sportLower.includes('motorsports')) return 'fa-car-side';
    if (sportLower.includes('golf')) return 'fa-golf-ball';
    if (sportLower.includes('atletismo') || sportLower.includes('athletics')) return 'fa-running';
    if (sportLower.includes('esports')) return 'fa-gamepad';
    if (sportLower.includes('invierno') || sportLower.includes('winter')) return 'fa-snowflake';
    if (sportLower.includes('natación') || sportLower.includes('swimming')) return 'fa-swimmer';
    if (sportLower.includes('ciclismo') || sportLower.includes('cycling')) return 'fa-bicycle';
    if (sportLower.includes('boxeo') || sportLower.includes('boxing')) return 'fa-boxing-glove';
    
    // Default icon
    return 'fa-running';
  };

  const formattedDate = lastUpdated 
    ? format(new Date(lastUpdated), 'MMMM d, yyyy - HH:mm')
    : 'Not yet updated';

  return (
    <aside className="bg-primary text-white w-full md:w-64 md:min-h-screen md:fixed">
      <div className="p-4 flex justify-between items-center md:block">
        <div className="flex items-center space-x-2">
          <Trophy className="text-[#E74C3C] h-6 w-6" />
          <h1 className="font-roboto font-bold text-xl">SportLogos</h1>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      
      <div className={`${isMobile && !mobileMenuOpen ? 'hidden' : ''} md:block p-4`}>
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-2">Last updated:</p>
          <p className="text-sm">{formattedDate}</p>
          <p className="text-xs text-gray-400 mt-1">Updates every 8 hours</p>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-400 uppercase font-bold mb-2">Sports</p>
          
          {/* All Sports option */}
          <div 
            className={`block py-2 px-4 rounded cursor-pointer ${activeSport === 'All Sports' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
            onClick={() => {
              onSelectSport('All Sports');
              if (isMobile) setMobileMenuOpen(false);
            }}
          >
            <i className="fas fa-list mr-2"></i> All Sports
          </div>
          
          {/* Map all sports */}
          {sports.map((sport) => (
            <div
              key={sport}
              className={`block py-2 px-4 rounded cursor-pointer ${activeSport === sport ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              onClick={() => {
                onSelectSport(sport);
                if (isMobile) setMobileMenuOpen(false);
              }}
            >
              <i className={`fas ${getSportIcon(sport)} mr-2`}></i> {sport}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
