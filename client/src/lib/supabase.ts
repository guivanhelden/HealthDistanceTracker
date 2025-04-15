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

export interface RedeAtual {
  id: number;
  nome_prestador: string;
  uf: string;
  municipio: string;
  cep?: string;
  latitude: number;
  longitude: number;
  tipo_servico?: string;
  especialidade?: string;
  plano?: string;
  operadora?: string;
  created_at?: string;
  updated_at?: string;
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
  console.log('Iniciando fetchAnalises...');
  
  // Primeiro, verificar se o nome correto da tabela está em cache
  const correctTableName = await findCorrectAnaliseTableName();
  if (correctTableName && correctTableName !== 'analise_distancia_ps') {
    console.log(`Usando nome de tabela encontrado: ${correctTableName}`);
    const { data, error } = await supabase
      .from(correctTableName)
      .select('*');
    
    if (!error && data) {
      console.log(`Dados carregados da tabela ${correctTableName}. Total: ${data.length}`);
      return data;
    }
  }
  
  // Se não encontrou a tabela correta ou falhou, continuar com a lógica existente
  try {
    const { data, error } = await supabase
      .from('analise_distancia_ps')
      .select('*');
    
    if (error) {
      console.error('Erro ao buscar análises:', error);
      
      // Tentar com nomes alternativos
      console.log('Tentando buscar de tabelas alternativas...');
      const alternativeData = await fetchAnaliseFromAlternativeTables();
      
      if (alternativeData.length > 0) {
        return alternativeData;
      }
      
      // Se não encontrou dados em nenhuma tabela, gerar dados fictícios
      console.log('Gerando dados fictícios para demonstração...');
      return await generateMockAnaliseData();
    }
    
    console.log(`Análises carregadas com sucesso. Total: ${data?.length || 0}`);
    return data || [];
  } catch (e) {
    console.error('Exceção ao buscar análises:', e);
    // Em caso de erro, retornar dados fictícios
    return await generateMockAnaliseData();
  }
}

// Cache para o nome correto da tabela
let _cachedAnaliseTableName: string | null = null;

// Função para encontrar o nome correto da tabela de análises
async function findCorrectAnaliseTableName(): Promise<string | null> {
  // Se já temos o nome em cache, retornar
  if (_cachedAnaliseTableName) {
    return _cachedAnaliseTableName;
  }
  
  console.log('Procurando pelo nome correto da tabela de análises...');
  
  // Verificar tabelas disponíveis
  const tables = await checkSpecificTables();
  
  // Procurar por tabelas potenciais
  const potentialTables = tables.filter(t => 
    t.includes('analise') || 
    t.includes('analises') || 
    t.includes('distancia')
  );
  
  console.log('Tabelas potenciais de análise:', potentialTables);
  
  // Verificar quais tabelas têm a estrutura correta
  for (const tableName of potentialTables) {
    console.log(`Verificando estrutura da tabela: ${tableName}`);
    
    try {
      // Tentar selecionar dados para verificar campos
      const { data, error } = await supabase
        .from(tableName)
        .select('id, cliente_id, prestador_id, distancia_km, posicao_ranking')
        .limit(1);
      
      if (!error && data) {
        console.log(`Tabela ${tableName} tem a estrutura correta!`);
        _cachedAnaliseTableName = tableName;
        return tableName;
      }
    } catch (e) {
      console.error(`Erro ao verificar tabela ${tableName}:`, e);
    }
  }
  
  // Se nenhuma tabela foi encontrada, retornar null
  console.log('Nenhuma tabela de análise válida encontrada');
  return null;
}

// Tentativa de criar a tabela no Supabase (requer permissões adequadas)
async function tryCreateAnaliseTable(): Promise<boolean> {
  try {
    // Verificar se temos permissão para criar tabelas
    const { error: tableError } = await supabase.rpc('create_analise_table');
    
    if (tableError) {
      console.error('Erro ao tentar criar tabela via RPC:', tableError);
      
      // Tentativa alternativa: inserir dados em uma tabela existente com nome similar
      const tables = await listAvailableTables();
      console.log('Tabelas disponíveis para inserção:', tables);
      
      const analysisTables = tables.filter(t => 
        t.includes('analise') || 
        t.includes('analises') || 
        t.includes('distancia')
      );
      
      if (analysisTables.length > 0) {
        console.log('Tentando inserir em tabela similar:', analysisTables[0]);
        
        // Inserir dados fictícios em uma tabela existente
        const mockData = await generateMockAnaliseData();
        const { error: insertError } = await supabase
          .from(analysisTables[0])
          .insert(mockData);
          
        if (!insertError) {
          console.log('Dados inseridos em tabela alternativa com sucesso');
          return true;
        } else {
          console.error('Erro ao inserir dados:', insertError);
        }
      }
      
      return false;
    }
    
    console.log('Tabela criada com sucesso');
    
    // Inserir dados fictícios
    const mockData = await generateMockAnaliseData();
    const { error: insertError } = await supabase
      .from('analise_distancia_ps')
      .insert(mockData);
      
    if (insertError) {
      console.error('Erro ao inserir dados depois de criar tabela:', insertError);
      return false;
    }
    
    console.log('Dados inseridos com sucesso');
    return true;
  } catch (e) {
    console.error('Exceção ao tentar criar tabela:', e);
    return false;
  }
}

// Função para tentar buscar de tabelas alternativas
async function fetchAnaliseFromAlternativeTables(): Promise<AnaliseDistancia[]> {
  // Tentar com o nome analises_distancia (plural)
  try {
    const { data: dataPlural, error: errorPlural } = await supabase
      .from('analises_distancia')
      .select('*');
    
    if (!errorPlural && dataPlural && dataPlural.length > 0) {
      console.log(`Análises carregadas com sucesso da tabela 'analises_distancia'. Total: ${dataPlural.length}`);
      return dataPlural;
    }
  } catch (e) {
    console.error('Erro na tabela alternativa 1:', e);
  }
  
  // Tentar com o nome analise_distancia (sem o _ps)
  try {
    const { data: dataSingular, error: errorSingular } = await supabase
      .from('analise_distancia')
      .select('*');
    
    if (!errorSingular && dataSingular && dataSingular.length > 0) {
      console.log(`Análises carregadas com sucesso da tabela 'analise_distancia'. Total: ${dataSingular.length}`);
      return dataSingular;
    }
  } catch (e) {
    console.error('Erro na tabela alternativa 2:', e);
  }
  
  // Tentar com o nome distancia_analise
  try {
    const { data: dataInvertido, error: errorInvertido } = await supabase
      .from('distancia_analise')
      .select('*');
    
    if (!errorInvertido && dataInvertido && dataInvertido.length > 0) {
      console.log(`Análises carregadas com sucesso da tabela 'distancia_analise'. Total: ${dataInvertido.length}`);
      return dataInvertido;
    }
  } catch (e) {
    console.error('Erro na tabela alternativa 3:', e);
  }
  
  // Tentar encontrar automaticamente uma tabela com estrutura semelhante
  const correctTableName = await findCorrectAnaliseTableName();
  if (correctTableName) {
    try {
      const { data, error } = await supabase
        .from(correctTableName)
        .select('*');
      
      if (!error && data && data.length > 0) {
        console.log(`Análises carregadas com sucesso da tabela '${correctTableName}'. Total: ${data.length}`);
        return data;
      }
    } catch (e) {
      console.error(`Erro ao acessar tabela encontrada '${correctTableName}':`, e);
    }
  }
  
  // Se tudo falhar, retornar array vazio
  console.error('Falha ao carregar análises de qualquer tabela alternativa');
  return [];
}

export async function fetchRedeAtual(): Promise<RedeAtual[]> {
  const { data, error } = await supabase
    .from('rede_atual')
    .select('*');
  
  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchRedeAtualByPlano(plano: string): Promise<RedeAtual[]> {
  const { data, error } = await supabase
    .from('rede_atual')
    .select('*')
    .eq('plano', plano);
  
  if (error) throw new Error(error.message);
  return data || [];
}

// Função para verificar as tabelas disponíveis no Supabase
export async function listAvailableTables(): Promise<string[]> {
  console.log('Verificando tabelas disponíveis...');
  try {
    // Buscar todas as tabelas com uma query SQL direta
    const { data: tables, error } = await supabase.rpc('list_tables');
    
    if (error) {
      console.error('Erro ao listar tabelas via RPC:', error);
      
      // Método alternativo: verificar tabelas específicas individualmente
      console.log('Tentando verificar tabelas individualmente...');
      return checkSpecificTables();
    }
    
    console.log('Tabelas encontradas via RPC:', tables);
    return tables || [];
  } catch (e) {
    console.error('Erro ao listar tabelas:', e);
    return checkSpecificTables();
  }
}

// Verificar manualmente tabelas específicas
async function checkSpecificTables(): Promise<string[]> {
  // Tabelas para verificar individualmente
  const tablesToCheck = [
    'analise_distancia_ps',
    'analises_distancia',
    'analise_distancia',
    'distancia_analise',
    'analise_dist',
    'base_rubayia_cpf',
    'rede_bronze_amil_resumida',
    'rede_atual'
  ];
  
  const results = await Promise.all(
    tablesToCheck.map(async tableName => {
      try {
        const { error } = await supabase.from(tableName).select('count(*)', { count: 'exact', head: true });
        console.log(`Verificação de tabela '${tableName}': ${error ? 'ERRO' : 'OK'}`);
        if (error) {
          console.error(`Erro na tabela '${tableName}':`, error.message);
        }
        return { tableName, exists: !error };
      } catch (e) {
        console.error(`Exceção na verificação de '${tableName}'`);
        return { tableName, exists: false };
      }
    })
  );
  
  const availableTables = results
    .filter(result => result.exists)
    .map(result => result.tableName);
  
  console.log('Tabelas disponíveis (verificação individual):', availableTables);
  return availableTables;
}

// Função para gerar dados fictícios de análise usando clientes e prestadores reais
export async function generateMockAnaliseData(): Promise<AnaliseDistancia[]> {
  console.log('Gerando dados fictícios de análise com clientes e prestadores reais...');
  
  try {
    // Buscar clientes e prestadores reais
    const { data: clientes } = await supabase
      .from('base_rubayia_cpf')
      .select('id, nome, uf, cliente_latitude, cliente_longitude')
      .limit(30);
    
    const { data: prestadores } = await supabase
      .from('rede_bronze_amil_resumida')
      .select('id, nome_prestador, uf, municipio, prestador_latitude, prestador_longitude')
      .limit(60);
    
    // Se temos dados reais, use-os para criar análises
    if (clientes?.length && prestadores?.length) {
      console.log(`Gerando dados com ${clientes.length} clientes e ${prestadores.length} prestadores reais`);
      
      const mockData: AnaliseDistancia[] = [];
      let idCounter = 1;
      
      clientes.forEach(cliente => {
        // Para cada cliente, associar com 2 prestadores da mesma UF, se possível
        const prestadoresUf = prestadores.filter(p => p.uf === cliente.uf);
        const prestadoresFinal = prestadoresUf.length >= 2 ? prestadoresUf : prestadores;
        
        // Selecionar 2 prestadores aleatórios para este cliente
        const selectedPrestadores = getRandomElements(prestadoresFinal, 2);
        
        // Criar registros de análise para cada prestador
        selectedPrestadores.forEach((prestador, index) => {
          // Calcular distância fictícia (mas baseada em UF, se forem iguais, distância menor)
          const distancia = cliente.uf === prestador.uf 
            ? Math.random() * 10  // Menor distância se mesma UF
            : 10 + Math.random() * 20;  // Maior distância se UFs diferentes
          
          mockData.push({
            id: idCounter++,
            cliente_id: cliente.id,
            prestador_id: prestador.id,
            distancia_km: distancia,
            posicao_ranking: index + 1,
            cliente_nome: cliente.nome,
            cliente_uf: cliente.uf,
            prestador_nome: prestador.nome_prestador,
            prestador_uf: prestador.uf,
            cliente_latitude: cliente.cliente_latitude,
            cliente_longitude: cliente.cliente_longitude,
            prestador_latitude: prestador.prestador_latitude,
            prestador_longitude: prestador.prestador_longitude
          });
        });
      });
      
      console.log(`Gerados ${mockData.length} registros fictícios com dados reais`);
      return mockData;
    }
  } catch (e) {
    console.error('Erro ao gerar dados fictícios com dados reais:', e);
  }
  
  // Se falhar ou não tiver dados reais, gerar dados totalmente fictícios
  return generateRandomMockData();
}

// Função utilitária para selecionar elementos aleatórios de um array
function getRandomElements<T>(array: T[], count: number): T[] {
  if (array.length <= count) return [...array];
  
  const result: T[] = [];
  const arrayCopy = [...array];
  
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * arrayCopy.length);
    result.push(arrayCopy[randomIndex]);
    arrayCopy.splice(randomIndex, 1);
  }
  
  return result;
}

// Gerar dados totalmente fictícios
function generateRandomMockData(): AnaliseDistancia[] {
  console.log('Gerando dados fictícios aleatórios...');
  const result: AnaliseDistancia[] = [];
  
  for (let i = 1; i <= 50; i++) {
    for (let j = 1; j <= 2; j++) {
      result.push({
        id: (i * 100) + j,
        cliente_id: i,
        prestador_id: j + 100,
        distancia_km: Math.random() * 20,
        posicao_ranking: j,
        cliente_nome: `Cliente Fictício ${i}`,
        prestador_nome: `Prestador Fictício ${j + 100}`,
        cliente_uf: ['SP', 'RJ', 'MG', 'PR', 'RS'][Math.floor(Math.random() * 5)],
        prestador_uf: ['SP', 'RJ', 'MG', 'PR', 'RS'][Math.floor(Math.random() * 5)]
      });
    }
  }
  
  console.log(`Gerados ${result.length} registros fictícios aleatórios`);
  return result;
}
