import { League, InsertLeague, Update, InsertUpdate, Channel, InsertChannel } from "@shared/schema";

export interface IStorage {
  // League operations
  getAllLeagues(): Promise<League[]>;
  getLeaguesBySport(sport: string): Promise<League[]>;
  getLeagueById(id: number): Promise<League | undefined>;
  updateLeagueImage(id: number, imageUrl: string): Promise<League | undefined>;
  createLeague(league: InsertLeague): Promise<League>;
  
  // Channel operations
  getAllChannels(): Promise<Channel[]>;
  getChannelsByRegion(region: string): Promise<Channel[]>;
  getChannelById(id: number): Promise<Channel | undefined>;
  updateChannelImage(id: number, imageUrl: string): Promise<Channel | undefined>;
  createChannel(channel: InsertChannel): Promise<Channel>;
  
  // Update operations
  getLastUpdate(): Promise<Update | undefined>;
  setLastUpdate(update: InsertUpdate): Promise<Update>;
  
  // Data management
  clearAllData(): void;
}

export class MemStorage implements IStorage {
  private leagues: Map<number, League>;
  private channels: Map<number, Channel>;
  private updates: Map<number, Update>;
  currentLeagueId: number;
  currentChannelId: number;
  currentUpdateId: number;

  constructor() {
    this.leagues = new Map();
    this.channels = new Map();
    this.updates = new Map();
    this.currentLeagueId = 1;
    this.currentChannelId = 1;
    this.currentUpdateId = 1;
  }

  async getAllLeagues(): Promise<League[]> {
    return Array.from(this.leagues.values());
  }

  async getLeaguesBySport(sport: string): Promise<League[]> {
    return Array.from(this.leagues.values()).filter(
      (league) => league.sport === sport
    );
  }

  async getLeagueById(id: number): Promise<League | undefined> {
    return this.leagues.get(id);
  }

  async updateLeagueImage(id: number, imageUrl: string): Promise<League | undefined> {
    const league = this.leagues.get(id);
    if (!league) return undefined;

    const updatedLeague: League = {
      ...league,
      imageUrl,
      lastUpdated: new Date(),
    };

    this.leagues.set(id, updatedLeague);
    return updatedLeague;
  }

  async createLeague(insertLeague: InsertLeague): Promise<League> {
    const id = this.currentLeagueId++;
    const league: League = { 
      ...insertLeague, 
      id,
      imageUrl: insertLeague.imageUrl || null,
      lastUpdated: insertLeague.lastUpdated || new Date()
    };
    
    this.leagues.set(id, league);
    return league;
  }

  // Channel operations
  async getAllChannels(): Promise<Channel[]> {
    return Array.from(this.channels.values());
  }

  async getChannelsByRegion(region: string): Promise<Channel[]> {
    return Array.from(this.channels.values()).filter(
      (channel) => channel.region === region
    );
  }

  async getChannelById(id: number): Promise<Channel | undefined> {
    return this.channels.get(id);
  }

  async updateChannelImage(id: number, imageUrl: string): Promise<Channel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;

    const updatedChannel: Channel = {
      ...channel,
      imageUrl,
      lastUpdated: new Date(),
    };

    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }

  async createChannel(insertChannel: InsertChannel): Promise<Channel> {
    const id = this.currentChannelId++;
    const channel: Channel = { 
      id,
      name: insertChannel.name,
      region: insertChannel.region || null,
      category: insertChannel.category || "Sports",
      imageUrl: insertChannel.imageUrl || null,
      lastUpdated: insertChannel.lastUpdated || new Date()
    };
    
    this.channels.set(id, channel);
    return channel;
  }

  async getLastUpdate(): Promise<Update | undefined> {
    // Return the most recent update
    const updates = Array.from(this.updates.values());
    if (updates.length === 0) return undefined;
    
    return updates.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    )[0];
  }

  async setLastUpdate(insertUpdate: InsertUpdate): Promise<Update> {
    const id = this.currentUpdateId++;
    const update: Update = { ...insertUpdate, id };
    this.updates.set(id, update);
    return update;
  }
  
  clearAllData(): void {
    // Reset all collections
    this.leagues.clear();
    this.channels.clear();
    this.updates.clear();
    this.currentLeagueId = 1;
    this.currentChannelId = 1;
    this.currentUpdateId = 1;
  }
}

export const storage = new MemStorage();
