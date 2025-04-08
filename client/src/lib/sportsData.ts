import { League } from '@shared/schema';

// Group leagues by sport
export function groupBySport(leagues: League[]): Record<string, League[]> {
  return leagues.reduce<Record<string, League[]>>((acc, league) => {
    if (!acc[league.sport]) {
      acc[league.sport] = [];
    }
    acc[league.sport].push(league);
    return acc;
  }, {});
}

// Group leagues by category
export function groupByCategory(leagues: League[]): Record<string, League[]> {
  return leagues.reduce<Record<string, League[]>>((acc, league) => {
    if (!acc[league.category]) {
      acc[league.category] = [];
    }
    acc[league.category].push(league);
    return acc;
  }, {});
}

// Parse sports data from the text file
export function parseSportsData(data: string) {
  const lines = data.trim().split('\n');
  let currentSport = "";
  let currentCategory = "";
  const leagues: Array<{ 
    name: string;
    sport: string;
    category: string;
  }> = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this is a sport heading (contains no colon)
    if (!trimmedLine.includes(':') && !trimmedLine.endsWith(' :')) {
      currentSport = trimmedLine;
      currentCategory = "";
    } 
    // Check if this is a category (ends with colon)
    else if (trimmedLine.endsWith(' :')) {
      currentCategory = trimmedLine.slice(0, -2);
    } 
    // Otherwise it's a league
    else if (currentSport && currentCategory) {
      leagues.push({
        name: trimmedLine,
        sport: currentSport,
        category: currentCategory,
      });
    }
  }

  return leagues;
}
