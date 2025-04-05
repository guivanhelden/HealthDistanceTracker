import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://prkpjleyzzdnqxhgmnbp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya3BqbGV5enpkbnF4aGdtbmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTgxODMsImV4cCI6MjA1Nzc5NDE4M30.LXp4NFhDvicu_bmvP0ibfcsr_wPAVIBpKWN82Y25IDQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Cliente {
  id: number;
  nome: string;
  uf: string;
  cep?: string;
  cliente_latitude?: number;
  cliente_longitude?: number;
  idade?: number;
  sexo?: string;
  plano?: any;
}

export interface Prestador {
  id: number;
  nome_prestador: string;
  uf: string;
  municipio: string;
  cep?: string;
  prestador_latitude?: number;
  prestador_longitude?: number;
  tipo_servico?: string;
  especialidades?: string[];
  planos?: string[];
}

export interface AnaliseDistancia {
  id: number;
  cliente_id: number;
  prestador_id: number;
  distancia_km: number;
  posicao_ranking: number;
  data_analise?: string;
  cliente_nome?: string;
  cliente_cep?: string;
  cliente_uf?: string;
  prestador_nome?: string;
  prestador_cep?: string;
  prestador_uf?: string;
  cliente_latitude?: number;
  cliente_longitude?: number;
  prestador_latitude?: number;
  prestador_longitude?: number;
  planos?: string;
  especialidade?: string;
}

export interface Estatisticas {
  totalClientes: number;
  totalPrestadores: number;
  avgDistance: number;
  totalAnalyses: number;
}

/**
 * Fetches data directly from Supabase (alternative to API routes)
 */

export async function fetchClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('base_rubayia_cpf')
    .select('*');
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchClientesByUf(uf: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('base_rubayia_cpf')
    .select('*')
    .eq('uf', uf);
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchPrestadores(): Promise<Prestador[]> {
  const { data, error } = await supabase
    .from('rede_bronze_amil_resumida')
    .select('*');
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchPrestadoresByUf(uf: string): Promise<Prestador[]> {
  const { data, error } = await supabase
    .from('rede_bronze_amil_resumida')
    .select('*')
    .eq('uf', uf);
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchAnalisesByClienteId(clienteId: number): Promise<AnaliseDistancia[]> {
  const { data, error } = await supabase
    .from('analise_distancia_ps')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('posicao_ranking', { ascending: true });
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchAnalises(): Promise<AnaliseDistancia[]> {
  const { data, error } = await supabase
    .from('analise_distancia_ps')
    .select('*');
  
  if (error) throw new Error(error.message);
  return data || [];
}
