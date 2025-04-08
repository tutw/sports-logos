import { useState } from 'react';
import { Search, RefreshCcw, Tv, Award } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import LoadingIndicator from '@/components/LoadingIndicator';
import { useSportsData } from '@/hooks/useSportsData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { League, Channel } from "@shared/schema";
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Home() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'leagues' | 'channels'>('leagues');
  
  // Get sports data using the custom hook
  const { 
    leagues, 
    lastUpdated, 
    isLoading: isLoadingLeagues, 
    isUpdating: isUpdatingLeagues, 
    error: leaguesError, 
    refreshImages: refreshLeagueImages 
  } = useSportsData();
  
  // Get channels data
  const {
    data: channels = [],
    isLoading: isLoadingChannels,
    error: channelsError
  } = useQuery<Channel[]>({
    queryKey: ['/api/channels'],
    refetchOnWindowFocus: false,
  });
  
  // Mutation to refresh channel images
  const channelsMutation = useMutation({
    mutationFn: () => apiRequest('/api/channels/refresh', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/channels'] });
      queryClient.invalidateQueries({ queryKey: ['/api/updates/last'] });
      toast({
        title: "Actualización exitosa",
        description: "Las imágenes de los canales se han actualizado",
      });
    },
    onError: (error) => {
      toast({
        title: "Error en la actualización",
        description: "No se pudieron actualizar las imágenes de canales",
        variant: "destructive",
      });
    }
  });
  
  const isLoading = isLoadingLeagues || isLoadingChannels;
  const isUpdating = isUpdatingLeagues || channelsMutation.isPending;
  const error = leaguesError || channelsError;

  // Filter leagues based on search
  const filteredLeagues = leagues.filter(league => 
    searchTerm === '' || 
    league.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    league.sport.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Filter channels based on search
  const filteredChannels = channels.filter(channel =>
    searchTerm === '' || 
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (channel.region && channel.region.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle manual refresh for leagues
  const handleRefreshLeagues = async () => {
    try {
      await refreshLeagueImages();
      toast({
        title: "Actualización exitosa",
        description: "Todas las imágenes de ligas han sido actualizadas.",
      });
    } catch (error) {
      toast({
        title: "Error en la actualización",
        description: "No se pudieron actualizar las imágenes de ligas. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  // Handle manual refresh for channels
  const handleRefreshChannels = async () => {
    try {
      await channelsMutation.mutateAsync();
    } catch (error) {
      // Error is handled in the mutation callbacks
    }
  };
  
  // Handle refresh based on active tab
  const handleRefresh = () => {
    if (activeTab === 'leagues') {
      handleRefreshLeagues();
    } else {
      handleRefreshChannels();
    }
  };

  if (error) {
    console.error("Error in Home component:", error);
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error Loading Data</h1>
            <p className="text-gray-600 mb-4">There was an error loading the sports data. Check the console for details.</p>
            <div className="text-left bg-gray-100 p-4 rounded-md my-4 max-w-lg mx-auto overflow-auto max-h-40">
              <pre className="text-xs text-red-600">{String(error)}</pre>
            </div>
            <button 
              onClick={() => {
                queryClient.invalidateQueries();
                window.location.reload();
              }}
              className="bg-primary text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-4">
        {/* Header con buscador y botón de actualización */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-primary">Sports & TV Logos</h1>
            {lastUpdated && (
              <p className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleString()}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder={activeTab === 'leagues' ? "Search leagues or sports..." : "Search TV channels or regions..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 w-full"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh}
              title={activeTab === 'leagues' ? "Refresh league images" : "Refresh channel images"}
              disabled={isUpdating}
            >
              <RefreshCcw className={`h-4 w-4 ${isUpdating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Tabs para alternar entre ligas y canales */}
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'leagues' | 'channels')}
          className="mb-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="leagues" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              <span>Ligas Deportivas</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center gap-2">
              <Tv className="h-4 w-4" />
              <span>Canales TV</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Contenido de las pestañas */}
          <TabsContent value="leagues" className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingIndicator message="Cargando datos deportivos..." />
              </div>
            ) : isUpdating && activeTab === 'leagues' ? (
              <div className="flex justify-center items-center h-64">
                <LoadingIndicator message="Actualizando imágenes de ligas..." />
              </div>
            ) : (
              <>
                {filteredLeagues.length === 0 ? (
                  <div className="bg-white p-8 rounded-md shadow-sm text-center mt-6">
                    <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
                    <p className="text-gray-500">Intenta ajustar tu búsqueda para encontrar lo que estás buscando.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLeagues.map((league) => (
                      <div 
                        key={league.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden flex items-center"
                      >
                        <div className="w-24 h-24 flex items-center justify-center p-2 bg-gray-50">
                          {league.imageUrl ? (
                            <img 
                              src={league.imageUrl} 
                              alt={`${league.name} logo`} 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                // Si la imagen falla al cargar, reemplazamos con un placeholder
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevenir bucle infinito
                                target.src = `https://via.placeholder.com/200x200?text=${encodeURIComponent(league.name)}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs text-center">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1">
                          <h3 className="font-medium text-primary">{league.name}</h3>
                          <p className="text-sm text-gray-500">{league.sport}</p>
                          {league.category && (
                            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {league.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="channels" className="pt-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingIndicator message="Cargando canales de TV..." />
              </div>
            ) : isUpdating && activeTab === 'channels' ? (
              <div className="flex justify-center items-center h-64">
                <LoadingIndicator message="Actualizando imágenes de canales..." />
              </div>
            ) : (
              <>
                {filteredChannels.length === 0 ? (
                  <div className="bg-white p-8 rounded-md shadow-sm text-center mt-6">
                    <h3 className="text-lg font-medium mb-2">No se encontraron resultados</h3>
                    <p className="text-gray-500">Intenta ajustar tu búsqueda para encontrar lo que estás buscando.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredChannels.map((channel) => (
                      <div 
                        key={channel.id} 
                        className="bg-white rounded-lg shadow-sm overflow-hidden flex items-center"
                      >
                        <div className="w-24 h-24 flex items-center justify-center p-2 bg-gray-50">
                          {channel.imageUrl ? (
                            <img 
                              src={channel.imageUrl} 
                              alt={`${channel.name} logo`} 
                              className="max-w-full max-h-full object-contain"
                              onError={(e) => {
                                // Si la imagen falla al cargar, reemplazamos con un placeholder
                                const target = e.target as HTMLImageElement;
                                target.onerror = null; // Prevenir bucle infinito
                                target.src = `https://via.placeholder.com/200x200?text=${encodeURIComponent(channel.name)}`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs text-center">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-1">
                          <h3 className="font-medium text-primary">{channel.name}</h3>
                          {channel.region && (
                            <span className="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                              {channel.region}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        
        <footer className="mt-8 text-center text-gray-500 text-sm py-6">
          <p>&copy; {new Date().getFullYear()} SportLogos - All logos and images are property of their respective owners</p>
          <p className="mt-1">Data updates automatically every 8 hours</p>
          <div className="mt-4 flex gap-4 justify-center">
            <a 
              href="/api/leagues/logos-xml" 
              target="_blank"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              <Award className="h-5 w-5 mr-2" />
              Lista Logos Ligas
            </a>
            <a 
              href="/api/channels/logos-xml" 
              target="_blank"
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-opacity-90 transition-colors"
            >
              <Tv className="h-5 w-5 mr-2" />
              Lista Logos Canales
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
