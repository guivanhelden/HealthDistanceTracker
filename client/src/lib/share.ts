/**
 * Funções para compartilhamento de dados e relatórios da aplicação
 */

/**
 * Gera um link de compartilhamento para o mapa e o relatório
 * @param options Opções de compartilhamento
 * @returns URL de compartilhamento
 */
export function gerarLinkCompartilhamento(options: {
  uf?: string;
  cidade?: string;
  mostrarClientes?: boolean;
  mostrarPrestadores?: boolean;
  mostrarRedeAtual?: boolean;
  mostrarBronzeMais?: boolean;
  mostrarProntoSocorro?: boolean;
  distanciaMaxima?: number;
}) {
  // URL base (domínio atual)
  const baseUrl = window.location.origin;
  
  // Criar URL com parâmetros
  const url = new URL('/compartilhado', baseUrl);
  
  // Adicionar parâmetros à URL se fornecidos
  if (options.uf && options.uf !== 'Todos') {
    url.searchParams.append('uf', options.uf);
  }
  
  if (options.cidade && options.cidade !== 'nenhuma') {
    url.searchParams.append('cidade', options.cidade);
  }
  
  // Adicionar os toggles de visualização
  if (options.mostrarClientes !== undefined) {
    url.searchParams.append('clientes', options.mostrarClientes ? '1' : '0');
  }
  
  if (options.mostrarPrestadores !== undefined) {
    url.searchParams.append('prestadores', options.mostrarPrestadores ? '1' : '0');
  }
  
  if (options.mostrarRedeAtual !== undefined) {
    url.searchParams.append('redeAtual', options.mostrarRedeAtual ? '1' : '0');
  }
  
  if (options.mostrarBronzeMais !== undefined) {
    url.searchParams.append('bronzeMais', options.mostrarBronzeMais ? '1' : '0');
  }
  
  if (options.mostrarProntoSocorro !== undefined) {
    url.searchParams.append('prontoSocorro', options.mostrarProntoSocorro ? '1' : '0');
  }
  
  if (options.distanciaMaxima !== undefined) {
    url.searchParams.append('distancia', options.distanciaMaxima.toString());
  }
  
  // Adicionar timestamp para evitar cache
  url.searchParams.append('t', Date.now().toString());
  
  return url.toString();
}

/**
 * Copia o link de compartilhamento para a área de transferência
 * @param options Opções de compartilhamento
 * @returns Promise com o resultado da operação
 */
export async function copiarLinkCompartilhamento(options: Parameters<typeof gerarLinkCompartilhamento>[0]): Promise<boolean> {
  try {
    const link = gerarLinkCompartilhamento(options);
    await navigator.clipboard.writeText(link);
    return true;
  } catch (error) {
    console.error('Erro ao copiar link:', error);
    return false;
  }
} 