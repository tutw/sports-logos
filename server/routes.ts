import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { InsertLeague, InsertUpdate, SportCategories, League, InsertChannel, Channel } from "@shared/schema";
import { parse } from "node:path";
import axios from "axios";
import cron from "node-cron";
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

// Seed data from the provided text file
const sportsData = `
Fútbol (Fútbol Asociación)
Internacionales :
FIFA World Cup
UEFA Champions League
UEFA Europa League
Copa América
Copa Libertadores (CONMEBOL)
Copa Sudamericana
AFC Champions League (Asia)
CAF Champions League (África)
Concacaf Champions League (Norteamérica)
Copa Mundial de Clubes de la FIFA
UEFA Nations League
Copa Oro (Concacaf)
Nacionales :
Premier League (Inglaterra)
La Liga (España)
Serie A (Italia)
Bundesliga (Alemania)
Ligue 1 (Francia)
MLS (Estados Unidos/México)
Primera División (Argentina, México, Colombia)
Serie A (Brasil)
Eredivisie (Holanda)
J1 League (Japón)
K League (Corea del Sur)
Super League (Suiza)
Premier Division (Escocia)
Superliga (Rusia)
Liga MX (México)
Saudi Pro League (Arabia Saudita)
Baloncesto
Internacionales :
FIBA Basketball World Cup
EuroBasket
FIBA AmeriCup
FIBA Asia Cup
FIBA Women's World Cup
Olympic Basketball Tournament
Ligas :
NBA (Estados Unidos)
WNBA (Estados Unidos)
EuroLeague (Europa)
EuroCup (Europa)
Australian NBL
Chinese CBA
Greek Basket League
Spanish ACB
Italian Serie A
Turkish Basketball Super League
American Football
Ligas :
NFL (Estados Unidos/Canadá)
CFL (Canadá)
XFL (Estados Unidos)
Competencias :
Super Bowl (NFL)
Grey Cup (CFL)
College Football Playoff (NCAA)
Beisbol
Internacionales :
World Baseball Classic
WBSC Baseball World Cup
Ligas :
MLB (Estados Unidos/Canadá)
Nippon Professional Baseball (Japón)
KBO League (Corea del Sur)
Mexican League
Australian ABL
Hockey sobre Hielo
Ligas :
NHL (Estados Unidos/Canadá)
KHL (Rusia/Europa)
Swedish Hockey League
Czech Extraliga
Competencias :
Stanley Cup (NHL)
IIHF World Championship
Olympics Hockey
Rugby
Internacionales :
Rugby World Cup
Six Nations (Europa)
The Rugby Championship (Argentina, Australia, Sudáfrica, Nueva Zelanda)
World Rugby Sevens Series
Ligas :
Premiership Rugby (Inglaterra)
Super Rugby (Oceanía)
Top 14 (Francia)
Pro14 (Irlanda, Gales, Escocia, Italia)
Cricket
Internacionales :
ICC Cricket World Cup
ICC T20 World Cup
Ashes (Inglaterra vs. Australia)
Border-Gavaskar Trophy (India vs. Australia)
Champions Trophy
Ligas :
Indian Premier League (IPL) (India)
Big Bash League (Australia)
Pakistan Super League (Pakistán)
Bangladesh Premier League (Bangladesh)
County Championship (Inglaterra)
Tenis
Grand Slams :
Australian Open
Roland Garros (Francia)
Wimbledon (Reino Unido)
US Open
Competencias :
ATP Finals
Davis Cup
Fed Cup
WTA Finals
ATP Cup
Masters 1000
Voleibol
Internacionales :
FIVB Volleyball World Cup
FIVB Volleyball Nations League
Olympic Volleyball Tournament
World Championships
Ligas :
Serie A1 (Italia)
V-League (Japón)
Superliga (Brasil)
CEV Champions League (Europa)
Premier Volleyball League (Filipinas)
Balonmano
Internacionales :
World Handball Championships
Olympic Handball Tournament
Ligas :
EHF Champions League (Europa)
Liga ASOBAL (España)
Bundesliga (Alemania)
French Handball League
Motorsports
Internacionales :
Fórmula 1 World Championship
MotoGP
WRC (World Rally Championship)
IndyCar Series (Estados Unidos)
World Endurance Championship (WEC)
NASCAR Cup Series (Estados Unidos)
Formula E (Coches eléctricos)
Golf
Internacionales :
Grand Slam (Masters, US Open, The Open, PGA Championship)
Ryder Cup (Europa vs. USA)
Presidents Cup (América vs. Resto del mundo)
Ligas :
PGA Tour (Estados Unidos)
European Tour
LPGA Tour (Mujeres)
Atletismo
Internacionales :
World Athletics Championships
Olympic Track and Field
Diamond League
World Cross Country Championships
Ligas :
World Athletics Continental Tour
Esports
Ligas :
League of Legends World Championship
The International (Dota 2)
CS:GO Major Series (ESL/BLAST)
Fortnite World Cup
Call of Duty League
Overwatch League
Rainbow Six Siege Pro League
Deportes de Invierno
Internacionales :
Olympic Winter Games
FIFA World Cup (Hockey sobre hielo)
FIS Alpine World Ski Championships
World Cup of Ski Jumping
Ligas :
NHL Stanley Cup (Hockey sobre hielo)
World Cup Biathlon
Natación y Deportes Acuáticos
Internacionales :
FINA World Championships
Olympic Swimming Events
Diving World Series
Ligas :
World Aquatics Championships
Ciclismo
Internacionales :
Tour de France
Giro d'Italia
Vuelta a España
UCI World Tour
Tour Down Under
Tour de Pekín
Boxeo y Artes Marciales
Internacionales :
WBC, WBA, IBF, WBO World Championships
UFC (Ultimate Fighting Championship)
Olympic Boxing/Grappling
Ligas :
Bellator MMA
WWE (Lucha profesional)
Deportes Regionales y Alternativos
Kabaddi (India):
Pro Kabaddi League
Sepak Takraw (Sudeste Asiático):
World Sepak Takraw Championships
Futsal :
FIFA Futsal World Cup
Beach Soccer :
FIFA Beach Soccer World Cup
Rugby League :
NRL (Australia)
Super League (Europa)
Cricket T20 :
T20 Blast (Inglaterra)
Big Bash League (Australia)
Otros Deportes Relevantes
Balonmano Playa :
World Beach Handball Championships
Voleibol Playa :
FIVB Beach Volleyball World Tour
Curling :
World Curling Championships
Esgrima :
Olympic Fencing
Tiro con Arco :
World Archery Championships`;

// Función para parsear los canales de TV del archivo CSV
function parseChannels(data: string): InsertChannel[] {
  const lines = data.trim().split('\n');
  const channels: InsertChannel[] = [];
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Extraer el nombre del canal y la región (país)
    let name = trimmedLine;
    let region = 'Global';
    
    // Si el nombre incluye un país/región entre paréntesis o después de un espacio seguido de un paréntesis
    if (name.includes('(')) {
      const parts = name.split('(');
      name = parts[0].trim();
      region = parts[1].replace(')', '').trim();
    } else if (name.includes(' ')) {
      // Muchos canales tienen el formato "Nombre País", intentamos extraer el país
      const parts = name.split(' ');
      const lastWord = parts[parts.length - 1];
      
      // Lista de países/regiones comunes
      const commonRegions = ['USA', 'UK', 'Spain', 'France', 'Italy', 'Germany', 'Mexico', 'Brazil', 
                             'Argentina', 'Australia', 'Canada', 'Portugal', 'Russia', 'China', 'Japan',
                             'India', 'Israel', 'Bulgaria', 'Poland', 'Denmark', 'Greece', 'Romania',
                             'Netherlands', 'Turkey', 'Qatar', 'UAE', 'Croatia', 'Serbia', 'BiH'];
      
      if (commonRegions.includes(lastWord)) {
        region = lastWord;
        name = parts.slice(0, parts.length - 1).join(' ');
      }
    }
    
    channels.push({
      name,
      region,
      category: 'Sports TV',
      imageUrl: '',
      lastUpdated: new Date()
    });
  });
  
  return channels;
}

// Function to parse sports data
function parseSportsData(data: string) {
  const lines = data.trim().split('\n');
  let currentSport = "";
  let currentCategory = "";
  const leagues: InsertLeague[] = [];
  
  // List of all main sports in the data
  const mainSports = [
    "Fútbol (Fútbol Asociación)",
    "Baloncesto",
    "American Football",
    "Beisbol",
    "Hockey sobre Hielo",
    "Rugby",
    "Cricket",
    "Tenis",
    "Voleibol",
    "Balonmano",
    "Motorsports",
    "Golf",
    "Atletismo",
    "Esports",
    "Deportes de Invierno",
    "Natación y Deportes Acuáticos",
    "Ciclismo",
    "Boxeo y Artes Marciales",
    "Deportes Regionales y Alternativos",
    "Otros Deportes Relevantes"
  ];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Check if this is a sport heading (main sport category)
    if (mainSports.includes(trimmedLine)) {
      currentSport = trimmedLine;
      currentCategory = "";
    } 
    // Check if this is a category (ends with :)
    else if (trimmedLine.endsWith(' :')) {
      currentCategory = trimmedLine.slice(0, -2);
    } 
    // Otherwise it's a league, but only add if we have both sport and category
    else if (currentSport && currentCategory) {
      leagues.push({
        name: trimmedLine,
        sport: currentSport,
        category: currentCategory,
        imageUrl: "",
        lastUpdated: new Date()
      });
    }
  }

  return leagues;
}



// Class to manage and rotate between different search engines
class ImageSearchManager {
  private static instance: ImageSearchManager;
  private searchEngines: string[] = ['google', 'yandex', 'duckduckgo', 'ecosia', 'yahoo', 'brave'];
  private currentEngineIndex: number = 0;
  private requestCounts: Map<string, number> = new Map();
  private lastRotation: number = Date.now();
  private rotationInterval: number = 30000; // 30 segundos entre rotaciones

  private constructor() {
    // Shuffle search engines to start with a random one
    this.shuffleEngines();
    this.searchEngines.forEach(engine => this.requestCounts.set(engine, 0));
  }

  public static getInstance(): ImageSearchManager {
    if (!ImageSearchManager.instance) {
      ImageSearchManager.instance = new ImageSearchManager();
    }
    return ImageSearchManager.instance;
  }

  private shuffleEngines(): void {
    // Fisher-Yates shuffle algorithm
    for (let i = this.searchEngines.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.searchEngines[i], this.searchEngines[j]] = [this.searchEngines[j], this.searchEngines[i]];
    }
  }

  public forceRotation(): void {
    this.currentEngineIndex = (this.currentEngineIndex + 1) % this.searchEngines.length;
    this.lastRotation = Date.now();
    this.requestCounts.set(this.searchEngines[this.currentEngineIndex], 0);
    console.log(`Forced rotation to search engine: ${this.searchEngines[this.currentEngineIndex]}`);
  }

  public getCurrentEngine(): string {
    const now = Date.now();
    // Rotate engine if it's been too long or we've made too many requests
    if (
      now - this.lastRotation > this.rotationInterval || 
      (this.requestCounts.get(this.searchEngines[this.currentEngineIndex]) || 0) > 5
    ) {
      this.forceRotation();
    }
    
    // Increment request count
    const engine = this.searchEngines[this.currentEngineIndex];
    this.requestCounts.set(engine, (this.requestCounts.get(engine) || 0) + 1);
    
    return engine;
  }
}

// Function to search for an image using multiple search engines
async function searchImage(query: string): Promise<string> {
  try {
    console.log(`Searching for image: ${query}`);
    
    // Mapeo especial para ligas con problemas conocidos de imagen
    const specialImageMappings: Record<string, string> = {
      "Bundesliga (Alemania)": "https://upload.wikimedia.org/wikipedia/en/thumb/d/df/Bundesliga_logo_%282017%29.svg/1200px-Bundesliga_logo_%282017%29.svg.png",
      "Fórmula 1 World Championship": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/2560px-F1.svg.png"
    };
    
    // Si tenemos un mapeo especial para esta consulta exacta, usarlo directamente
    if (specialImageMappings[query]) {
      console.log(`Using special image mapping for ${query}`);
      return specialImageMappings[query];
    }
    
    // Construir la consulta básica
    const searchQuery = `${query} logo official svg`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    // Obtener el motor de búsqueda a utilizar
    const searchEngine = ImageSearchManager.getInstance().getCurrentEngine();
    console.log(`Using search engine: ${searchEngine} for query: ${query}`);
    
    // Intentar obtener imagen usando el motor seleccionado
    let imageUrl = await searchWithEngine(searchEngine, encodedQuery);
    
    // Si el motor actual falló, probar con los demás motores
    if (!imageUrl) {
      for (const engine of ['google', 'yandex', 'duckduckgo', 'ecosia', 'yahoo', 'brave']) {
        if (engine !== searchEngine) {
          console.log(`Trying alternative search engine: ${engine}`);
          imageUrl = await searchWithEngine(engine, encodedQuery);
          if (imageUrl) break;
        }
      }
    }
    
    if (!imageUrl) {
      // Si no encontramos nada con ningún motor, usamos una URL de placeholder
      imageUrl = `https://via.placeholder.com/300x150?text=${encodeURIComponent(query)}`;
    }
    
    console.log(`Found image URL: ${imageUrl}`);
    return imageUrl;
  } catch (error: any) {
    console.error(`Error searching for image for ${query}:`, error?.message || 'Unknown error');
    
    // Como último recurso, usamos un servicio de placeholder
    console.log("Using placeholder image as fallback");
    return `https://via.placeholder.com/300x200?text=${encodeURIComponent(query)}`;
  }
}

// Helper function to search with a specific engine
async function searchWithEngine(engine: string, encodedQuery: string): Promise<string> {
  try {
    let url: string;
    let imageUrl = '';
    
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    
    // Manejo especial para DuckDuckGo que tiene una API JSON
    if (engine === 'duckduckgo') {
      try {
        const response = await axios.get(`https://duckduckgo.com/i.js?q=${encodedQuery}`, {
          headers: { 'User-Agent': userAgent }
        });
        
        if (response.data && response.data.results && response.data.results.length > 0) {
          return response.data.results[0].image;
        }
        return '';
      } catch (error) {
        console.log(`DuckDuckGo search failed: ${error}`);
        return '';
      }
    }
    
    // Configurar URL según el motor de búsqueda
    switch (engine) {
      case 'google':
        url = `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
        break;
      case 'yandex':
        url = `https://yandex.com/images/search?text=${encodedQuery}`;
        break;
      case 'ecosia':
        url = `https://www.ecosia.org/images?q=${encodedQuery}`;
        break;
      case 'yahoo':
        url = `https://images.search.yahoo.com/search/images?p=${encodedQuery}`;
        break;
      case 'brave':
        url = `https://search.brave.com/images?q=${encodedQuery}`;
        break;
      default:
        url = `https://www.google.com/search?q=${encodedQuery}&tbm=isch`;
    }
    
    // Hacer la petición HTTP
    const response = await axios.get(url, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      timeout: 10000,
      validateStatus: function (status) {
        // Acepta cualquier código de estado para poder manejar 429 explícitamente
        return true;
      }
    });
    
    // Detectar explícitamente error 429
    if (response.status === 429) {
      console.log(`Error 429 (Too Many Requests) from ${engine}. Switching to another search engine.`);
      // Forzar la rotación inmediata del motor de búsqueda
      if (engine === ImageSearchManager.getInstance().getCurrentEngine()) {
        ImageSearchManager.getInstance().forceRotation();
      }
      return '';
    }
    
    // Si recibimos algún otro error, registrarlo y devolver cadena vacía
    if (response.status !== 200) {
      console.log(`Received status ${response.status} from ${engine}. Switching to another search engine.`);
      return '';
    }
    
    // Cargar el HTML en cheerio
    const $ = cheerio.load(response.data);
    
    // Extraer las URLs de las imágenes - diferentes selectores según el motor
    // Primero probamos con elementos img estándar
    $('img').each((i, elem) => {
      const src = $(elem).attr('src');
      if (src && src.startsWith('http') && 
          !src.includes('google') && !src.includes('bing') && 
          !src.includes('yandex') && !src.includes('yahoo') && 
          !src.includes('ecosia') && !src.includes('brave') && 
          !src.includes('duckduckgo') && !imageUrl) {
        imageUrl = src;
        return false; // Detenemos el bucle después de encontrar la primera imagen válida
      }
    });
    
    // Si no encontramos nada, buscar en data-src
    if (!imageUrl) {
      $('[data-src]').each((i, elem) => {
        const src = $(elem).attr('data-src');
        if (src && src.startsWith('http') && !imageUrl) {
          imageUrl = src;
          return false;
        }
      });
    }
    
    // Si no encontramos nada, buscar en srcset
    if (!imageUrl) {
      $('[srcset]').each((i, elem) => {
        const srcset = $(elem).attr('srcset');
        if (srcset) {
          const parts = srcset.split(',');
          for (const part of parts) {
            const url = part.trim().split(' ')[0];
            if (url && url.startsWith('http')) {
              imageUrl = url;
              break;
            }
          }
          if (imageUrl) return false;
        }
      });
    }
    
    // Si no encontramos nada en elementos directos, buscar en scripts (útil para Google, Bing)
    if (!imageUrl) {
      const scriptContent = $('script').text();
      
      // Buscar URLs de imágenes en el contenido de los scripts
      const patterns = [
        /\["(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|svg))"/g,
        /"contentUrl":\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|svg))"/g,
        /"url":\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|svg))"/g,
        /"thumbnailUrl":\s*"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|svg))"/g
      ];
      
      for (const pattern of patterns) {
        const matches = scriptContent.match(pattern);
        if (matches && matches.length > 0) {
          // Extraer la URL de la primera coincidencia
          const match = matches[0].match(/"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|gif|svg))"/);
          if (match && match[1]) {
            imageUrl = match[1];
            break;
          }
        }
      }
    }
    
    return imageUrl;
  } catch (error: any) {
    console.log(`Error searching with ${engine}: ${error?.message || 'Unknown error'}`);
    // Si el error es 429, rotar el motor de búsqueda
    if (error.response && error.response.status === 429) {
      console.log(`Error 429 (Too Many Requests) from ${engine} in catch. Switching to another search engine.`);
      if (engine === ImageSearchManager.getInstance().getCurrentEngine()) {
        ImageSearchManager.getInstance().forceRotation();
      }
    }
    return '';
  }
}

// Función para comprobar si una URL de imagen es accesible
async function isImageAccessible(url: string): Promise<boolean> {
  if (!url || url.includes('placeholder.com')) return false;
  
  // Lista de dominios conocidos con problemas
  const problematicDomains = [
    'vectorportal.com'
  ];
  
  // Si la URL contiene un dominio problemático, considerarla inaccesible
  if (problematicDomains.some(domain => url.includes(domain))) {
    console.log(`URL contains problematic domain: ${url}`);
    return false;
  }
  
  try {
    const response = await axios.head(url, {
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    return response.status === 200;
  } catch (error) {
    console.log(`Image URL ${url} is not accessible`);
    return false;
  }
}

// Function to update all league images
async function updateAllLeagueImages() {
  console.log("Updating all league images...");
  try {
    const leagues = await storage.getAllLeagues();
    
    // Procesar todas las ligas, sin limitar
    for (const league of leagues) {
      try {
        // Comprobar si la imagen actual es accesible
        const needsUpdate = !league.imageUrl || !(await isImageAccessible(league.imageUrl));
        
        // Si no tiene imagen o la imagen actual no es accesible, buscar una nueva
        if (needsUpdate) {
          console.log(`Searching new image for ${league.name} (current: ${league.imageUrl || 'none'})`);
          const imageUrl = await searchImage(league.name);
          if (imageUrl) {
            await storage.updateLeagueImage(league.id, imageUrl);
          }
        }
      } catch (error: any) {
        console.error(`Error updating image for ${league.name}:`, error?.message || 'Unknown error');
      }
    }
    
    // Set the last update time
    await storage.setLastUpdate({ lastUpdated: new Date() });
    console.log("All league images updated successfully");
  } catch (error: any) {
    console.error("Error updating league images:", error?.message || 'Unknown error');
  }
}

// Function to update all channel images
async function updateAllChannelImages() {
  console.log("Updating all TV channel images...");
  try {
    const channels = await storage.getAllChannels();
    
    // Procesar todos los canales
    for (const channel of channels) {
      try {
        // Comprobar si la imagen actual es accesible
        const needsUpdate = !channel.imageUrl || !(await isImageAccessible(channel.imageUrl));
        
        // Si no tiene imagen o la imagen actual no es accesible, buscar una nueva
        if (needsUpdate) {
          console.log(`Searching new image for ${channel.name} (current: ${channel.imageUrl || 'none'})`);
          const imageUrl = await searchImage(`${channel.name} tv channel logo`);
          if (imageUrl) {
            await storage.updateChannelImage(channel.id, imageUrl);
          }
        }
      } catch (error: any) {
        console.error(`Error updating image for ${channel.name}:`, error?.message || 'Unknown error');
      }
    }
    
    // Set the last update time
    await storage.setLastUpdate({ lastUpdated: new Date() });
    console.log("All channel images updated successfully");
  } catch (error: any) {
    console.error("Error updating channel images:", error?.message || 'Unknown error');
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize data
  const seedLeagues = parseSportsData(sportsData);
  
  // Leer el archivo CSV de canales
  let channelsData = '';
  try {
    channelsData = fs.readFileSync(path.join(process.cwd(), 'attached_assets/CANALES.csv'), 'utf8');
    console.log("Archivo de canales cargado correctamente");
  } catch (error) {
    console.error("Error al cargar el archivo de canales:", error);
    channelsData = '';
  }
  
  // Parsear los canales del CSV
  const seedChannels = channelsData ? parseChannels(channelsData) : [];
  
  // Force re-initialize the data to include all new sports
  console.log("Initializing database with complete sports data...");
  
  // Clear existing data (re-initialize mem storage)
  storage.clearAllData();
  
  // Create all leagues from scratch
  for (const league of seedLeagues) {
    await storage.createLeague(league);
  }
  
  // Create all channels from CSV
  if (seedChannels.length > 0) {
    console.log(`Cargando ${seedChannels.length} canales de TV`);
    for (const channel of seedChannels) {
      await storage.createChannel(channel);
    }
  }
  
  // Set initial update time
  await storage.setLastUpdate({ lastUpdated: new Date() });
  
  // Initial image update - hacerlo de forma asíncrona después de que el servidor esté corriendo
  // para no retrasar el inicio del servidor
  setTimeout(() => {
    // Actualizar imágenes de ligas
    updateAllLeagueImages()
      .then(() => console.log("Imagen inicial de ligas actualizada de forma asíncrona"))
      .catch(err => console.error("Error en actualización asíncrona de imágenes de ligas:", err));
    
    // Actualizar imágenes de canales después
    if (seedChannels.length > 0) {
      setTimeout(() => {
        updateAllChannelImages()
          .then(() => console.log("Imagen inicial de canales actualizada de forma asíncrona"))
          .catch(err => console.error("Error en actualización asíncrona de imágenes de canales:", err));
      }, 10000); // Esperar 10 segundos después de actualizar ligas para no sobrecargar
    }
  }, 5000);

  // Schedule update every 8 hours
  cron.schedule('0 */8 * * *', async () => {
    console.log('Running scheduled update of league images');
    await updateAllLeagueImages();
  });

  // API Routes
  
  // Get all leagues
  app.get('/api/leagues', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const leagues = await storage.getAllLeagues();
      res.json(leagues);
    } catch (error) {
      console.error('Error fetching leagues:', error);
      res.status(500).json({ message: 'Error fetching leagues' });
    }
  });

  // Get leagues by sport
  app.get('/api/leagues/sport/:sport', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const sport = decodeURIComponent(req.params.sport);
      const leagues = await storage.getLeaguesBySport(sport);
      res.json(leagues);
    } catch (error) {
      console.error('Error fetching leagues by sport:', error);
      res.status(500).json({ message: 'Error fetching leagues by sport' });
    }
  });

  // Get last update time
  app.get('/api/updates/last', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const lastUpdate = await storage.getLastUpdate();
      res.json(lastUpdate || { lastUpdated: new Date() });
    } catch (error) {
      console.error('Error fetching last update time:', error);
      res.status(500).json({ message: 'Error fetching last update time' });
    }
  });

  // Trigger manual update
  app.post('/api/updates/refresh', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      await updateAllLeagueImages();
      const lastUpdate = await storage.getLastUpdate();
      res.json(lastUpdate);
    } catch (error) {
      console.error('Error updating league images:', error);
      res.status(500).json({ message: 'Error updating league images' });
    }
  });
  
  // Endpoint especial para actualizar una liga específica por nombre
  app.post('/api/league/refresh-image', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'League name is required' });
      }
      
      const leagues = await storage.getAllLeagues();
      const matchingLeagues = leagues.filter(league => 
        league.name.toLowerCase().includes(name.toLowerCase())
      );
      
      if (matchingLeagues.length === 0) {
        return res.status(404).json({ message: 'League not found' });
      }
      
      const results = [];
      for (const league of matchingLeagues) {
        console.log(`Manually refreshing image for ${league.name} (ID: ${league.id})`);
        const imageUrl = await searchImage(league.name);
        if (imageUrl) {
          const updated = await storage.updateLeagueImage(league.id, imageUrl);
          results.push({
            id: league.id,
            name: league.name,
            oldImageUrl: league.imageUrl,
            newImageUrl: imageUrl,
            success: !!updated
          });
        }
      }
      
      res.json({ updated: results });
    } catch (error) {
      console.error('Error updating league image:', error);
      res.status(500).json({ message: 'Error updating league image' });
    }
  });
  
  // API endpoints para los canales de TV
  app.get('/api/channels', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const channels = await storage.getAllChannels();
      res.json(channels);
    } catch (error) {
      console.error('Error fetching channels:', error);
      res.status(500).json({ message: 'Error fetching channels' });
    }
  });

  // Get channels by region
  app.get('/api/channels/region/:region', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      const region = decodeURIComponent(req.params.region);
      const channels = await storage.getChannelsByRegion(region);
      res.json(channels);
    } catch (error) {
      console.error('Error fetching channels by region:', error);
      res.status(500).json({ message: 'Error fetching channels by region' });
    }
  });

  // Trigger manual update of channels
  app.post('/api/channels/refresh', async (req, res) => {
    try {
      res.setHeader('Content-Type', 'application/json');
      await updateAllChannelImages();
      const lastUpdate = await storage.getLastUpdate();
      res.json(lastUpdate);
    } catch (error) {
      console.error('Error updating channel images:', error);
      res.status(500).json({ message: 'Error updating channel images' });
    }
  });

  // Endpoint para obtener listado de ligas con sus URLs de logo en formato XML
  app.get('/api/leagues/logos-xml', async (req, res) => {
    try {
      const leagues = await storage.getAllLeagues();
      
      // Ordenar ligas por deporte y luego por nombre
      leagues.sort((a, b) => {
        if (a.sport !== b.sport) {
          return a.sport.localeCompare(b.sport);
        }
        return a.name.localeCompare(b.name);
      });
      
      // Generar XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sports>\n';
      
      // Agrupar por deporte
      const sportGroups: Record<string, League[]> = {};
      
      leagues.forEach(league => {
        if (!sportGroups[league.sport]) {
          sportGroups[league.sport] = [];
        }
        sportGroups[league.sport].push(league);
      });
      
      // Generar XML por deporte
      Object.entries(sportGroups).forEach(([sport, sportLeagues]) => {
        xml += `  <sport name="${escapeXml(sport)}">\n`;
        
        sportLeagues.forEach(league => {
          if (league.imageUrl) {
            xml += `    <league name="${escapeXml(league.name)}" category="${escapeXml(league.category || '')}">\n`;
            xml += `      <logo_url>${escapeXml(league.imageUrl)}</logo_url>\n`;
            xml += `    </league>\n`;
          }
        });
        
        xml += `  </sport>\n`;
      });
      
      xml += '</sports>';
      
      // Establecer headers para mostrar como texto plano
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      
      res.send(xml);
    } catch (error) {
      console.error('Error generating leagues logos XML:', error);
      res.status(500).json({ message: 'Error generating logos XML' });
    }
  });
  
  // Endpoint para obtener listado de canales con sus URLs de logo en formato XML
  app.get('/api/channels/logos-xml', async (req, res) => {
    try {
      const channels = await storage.getAllChannels();
      
      // Ordenar canales por región
      channels.sort((a, b) => {
        if (a.region !== b.region) {
          return a.region ? a.region.localeCompare(b.region || '') : -1;
        }
        return a.name.localeCompare(b.name);
      });
      
      // Generar XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<tv_channels>\n';
      
      // Agrupar por región
      const regionGroups: Record<string, Channel[]> = {};
      
      channels.forEach(channel => {
        const region = channel.region || 'Global';
        if (!regionGroups[region]) {
          regionGroups[region] = [];
        }
        regionGroups[region].push(channel);
      });
      
      // Generar XML por región
      Object.entries(regionGroups).forEach(([region, regionChannels]) => {
        xml += `  <region name="${escapeXml(region)}">\n`;
        
        regionChannels.forEach(channel => {
          if (channel.imageUrl) {
            xml += `    <channel name="${escapeXml(channel.name)}">\n`;
            xml += `      <logo_url>${escapeXml(channel.imageUrl)}</logo_url>\n`;
            xml += `    </channel>\n`;
          }
        });
        
        xml += `  </region>\n`;
      });
      
      xml += '</tv_channels>';
      
      // Establecer headers para mostrar como texto plano
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      
      res.send(xml);
    } catch (error) {
      console.error('Error generating channels logos XML:', error);
      res.status(500).json({ message: 'Error generating channel logos XML' });
    }
  });
  
  // Función para escapar caracteres especiales en XML
  function escapeXml(unsafe: string): string {
    return unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
