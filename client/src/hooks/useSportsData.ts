import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { League } from '@shared/schema';
import { queryClient, apiRequest } from '@/lib/queryClient';

export function useSportsData() {
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch all leagues
  const { 
    data: leagues = [], 
    isLoading, 
    error 
  } = useQuery<League[]>({
    queryKey: ['/api/leagues'],
  });

  // Fetch last update time
  const { 
    data: lastUpdateData,
  } = useQuery<{ lastUpdated: string }>({
    queryKey: ['/api/updates/last'],
  });

  // Extract unique sports from leagues
  const sportsMap: {[key: string]: boolean} = {};
  leagues.forEach(league => {
    if (league.sport) {
      sportsMap[league.sport] = true;
    }
  });
  const sports = Object.keys(sportsMap);

  // Parse last updated date
  const lastUpdated = lastUpdateData?.lastUpdated 
    ? new Date(lastUpdateData.lastUpdated) 
    : null;

  // Mutation for manually refreshing images
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsUpdating(true);
      return await apiRequest('/api/updates/refresh', { method: 'POST' });
    },
    onSuccess: () => {
      // Invalidate queries to reload data
      queryClient.invalidateQueries({ queryKey: ['/api/leagues'] });
      queryClient.invalidateQueries({ queryKey: ['/api/updates/last'] });
    },
    onSettled: () => {
      setIsUpdating(false);
    }
  });

  // Function to trigger manual refresh
  const refreshImages = async () => {
    return refreshMutation.mutateAsync();
  };

  return {
    leagues,
    sports,
    lastUpdated,
    isLoading,
    isUpdating: isUpdating || refreshMutation.isPending,
    error,
    refreshImages,
  };
}
