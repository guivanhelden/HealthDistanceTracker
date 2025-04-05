import { createClient } from '@supabase/supabase-js';
import { 
  Cliente, 
  Prestador, 
  AnaliseDistancia, 
  InsertAnaliseDistancia,
  User, 
  InsertUser 
} from '@shared/schema';

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://prkpjleyzzdnqxhgmnbp.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya3BqbGV5enpkbnF4aGdtbmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTgxODMsImV4cCI6MjA1Nzc5NDE4M30.LXp4NFhDvicu_bmvP0ibfcsr_wPAVIBpKWN82Y25IDQ';

export interface IStorage {
  // User methods (keeping the existing ones)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Cliente methods
  getClientes(): Promise<Cliente[]>;
  getClienteById(id: number): Promise<Cliente | undefined>;
  getClientesByUf(uf: string): Promise<Cliente[]>;

  // Prestador methods
  getPrestadores(): Promise<Prestador[]>;
  getPrestadorById(id: number): Promise<Prestador | undefined>;
  getPrestadoresByUf(uf: string): Promise<Prestador[]>;

  // Análise methods
  getAnalises(): Promise<AnaliseDistancia[]>;
  getAnaliseById(id: number): Promise<AnaliseDistancia | undefined>;
  getAnalisesByClienteId(clienteId: number): Promise<AnaliseDistancia[]>;
  createAnalise(analise: InsertAnaliseDistancia): Promise<AnaliseDistancia>;
  getTopPrestadoresByClienteId(clienteId: number, limit: number): Promise<AnaliseDistancia[]>;
}

export class SupabaseStorage implements IStorage {
  private supabase;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);
  }

  // User methods (keeping the existing functionality)
  async getUser(id: number): Promise<User | undefined> {
    const { data } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    return data || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    return data || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .insert([insertUser])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as User;
  }

  // Cliente methods
  async getClientes(): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('base_rubayia_cpf')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data as Cliente[];
  }

  async getClienteById(id: number): Promise<Cliente | undefined> {
    const { data, error } = await this.supabase
      .from('base_rubayia_cpf')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Cliente || undefined;
  }

  async getClientesByUf(uf: string): Promise<Cliente[]> {
    const { data, error } = await this.supabase
      .from('base_rubayia_cpf')
      .select('*')
      .eq('uf', uf);
    
    if (error) throw new Error(error.message);
    return data as Cliente[];
  }

  // Prestador methods
  async getPrestadores(): Promise<Prestador[]> {
    const { data, error } = await this.supabase
      .from('rede_bronze_amil_resumida')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data as Prestador[];
  }

  async getPrestadorById(id: number): Promise<Prestador | undefined> {
    const { data, error } = await this.supabase
      .from('rede_bronze_amil_resumida')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as Prestador || undefined;
  }

  async getPrestadoresByUf(uf: string): Promise<Prestador[]> {
    const { data, error } = await this.supabase
      .from('rede_bronze_amil_resumida')
      .select('*')
      .eq('uf', uf);
    
    if (error) throw new Error(error.message);
    return data as Prestador[];
  }

  // Análise methods
  async getAnalises(): Promise<AnaliseDistancia[]> {
    const { data, error } = await this.supabase
      .from('analise_distancia_ps')
      .select('*');
    
    if (error) throw new Error(error.message);
    return data as AnaliseDistancia[];
  }

  async getAnaliseById(id: number): Promise<AnaliseDistancia | undefined> {
    const { data, error } = await this.supabase
      .from('analise_distancia_ps')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data as AnaliseDistancia || undefined;
  }

  async getAnalisesByClienteId(clienteId: number): Promise<AnaliseDistancia[]> {
    const { data, error } = await this.supabase
      .from('analise_distancia_ps')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('posicao_ranking', { ascending: true });
    
    if (error) throw new Error(error.message);
    return data as AnaliseDistancia[];
  }

  async createAnalise(analise: InsertAnaliseDistancia): Promise<AnaliseDistancia> {
    const { data, error } = await this.supabase
      .from('analise_distancia_ps')
      .insert([analise])
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data as AnaliseDistancia;
  }

  async getTopPrestadoresByClienteId(clienteId: number, limit: number): Promise<AnaliseDistancia[]> {
    const { data, error } = await this.supabase
      .from('analise_distancia_ps')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('posicao_ranking', { ascending: true })
      .limit(limit);
    
    if (error) throw new Error(error.message);
    return data as AnaliseDistancia[];
  }
}

// Memory storage for fallback or testing
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clientes: Map<number, Cliente>;
  private prestadores: Map<number, Prestador>;
  private analises: Map<number, AnaliseDistancia>;
  currentId: number;
  currentAnaliseId: number;

  constructor() {
    this.users = new Map();
    this.clientes = new Map();
    this.prestadores = new Map();
    this.analises = new Map();
    this.currentId = 1;
    this.currentAnaliseId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Cliente methods
  async getClientes(): Promise<Cliente[]> {
    return Array.from(this.clientes.values());
  }

  async getClienteById(id: number): Promise<Cliente | undefined> {
    return this.clientes.get(id);
  }

  async getClientesByUf(uf: string): Promise<Cliente[]> {
    return Array.from(this.clientes.values()).filter(cliente => cliente.uf === uf);
  }

  // Prestador methods
  async getPrestadores(): Promise<Prestador[]> {
    return Array.from(this.prestadores.values());
  }

  async getPrestadorById(id: number): Promise<Prestador | undefined> {
    return this.prestadores.get(id);
  }

  async getPrestadoresByUf(uf: string): Promise<Prestador[]> {
    return Array.from(this.prestadores.values()).filter(prestador => prestador.uf === uf);
  }

  // Análise methods
  async getAnalises(): Promise<AnaliseDistancia[]> {
    return Array.from(this.analises.values());
  }

  async getAnaliseById(id: number): Promise<AnaliseDistancia | undefined> {
    return this.analises.get(id);
  }

  async getAnalisesByClienteId(clienteId: number): Promise<AnaliseDistancia[]> {
    return Array.from(this.analises.values())
      .filter(analise => analise.cliente_id === clienteId)
      .sort((a, b) => a.posicao_ranking - b.posicao_ranking);
  }

  async createAnalise(analise: InsertAnaliseDistancia): Promise<AnaliseDistancia> {
    const id = this.currentAnaliseId++;
    const newAnalise: AnaliseDistancia = { ...analise, id, data_analise: new Date().toISOString() };
    this.analises.set(id, newAnalise);
    return newAnalise;
  }

  async getTopPrestadoresByClienteId(clienteId: number, limit: number): Promise<AnaliseDistancia[]> {
    return Array.from(this.analises.values())
      .filter(analise => analise.cliente_id === clienteId)
      .sort((a, b) => a.posicao_ranking - b.posicao_ranking)
      .slice(0, limit);
  }
}

// Choose which storage implementation to use
export const storage = new SupabaseStorage();
