# Health Distance Tracker

Aplicativo para análise de distância entre clientes e prestadores de serviços de saúde, permitindo visualizar a distribuição geográfica e gerar relatórios de proximidade.

## Funcionalidades Principais

- 🗺️ **Mapa de Distribuição**: Visualize clientes e prestadores de serviços no mapa com filtros por região.
- 📊 **Análise de Proximidade**: Identifique os prestadores mais próximos de cada cliente.
- 📋 **Relatórios Detalhados**: Gere relatórios por UF e visualize dados de proximidade.
- 🔗 **Compartilhamento**: Gere links para compartilhar mapas e relatórios com configurações personalizadas.
- 🔍 **Filtros Avançados**: Filtre os dados por UF, distância máxima e tipo de visualização.

## Tecnologias Utilizadas

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn UI
- **Mapas**: Mapbox GL JS
- **Dados**: Supabase
- **State Management**: React Query
- **Roteamento**: Wouter

## Recurso de Compartilhamento

A funcionalidade de compartilhamento permite gerar links para compartilhar:

- Mapa de Distribuição: com visualização personalizada de clientes, prestadores e rede atual
- Relatório de Proximidade Cliente-Prestador: dados e estatísticas detalhadas

### Como Compartilhar

1. Clique no botão "Compartilhar" no Dashboard ou na página de Relatórios
2. Configure as opções de visualização:
   - UF (estado)
   - Cidade em foco 
   - Distância máxima
   - Elementos a mostrar (clientes, prestadores, rede atual)
3. Escolha o método de compartilhamento:
   - Copiar link
   - Compartilhar por email
   - Compartilhar por WhatsApp

O link gerado pode ser acessado por qualquer pessoa, mostrando os dados conforme as configurações escolhidas.

## Configuração

Para executar o projeto localmente:

```bash
# Instalar dependências
npm install

# Iniciar ambiente de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Iniciar servidor de produção
npm run start
```

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

- `MAPBOX_TOKEN`: Token de acesso do Mapbox
- `SUPABASE_URL`: URL do seu projeto Supabase
- `SUPABASE_ANON_KEY`: Chave anônima do Supabase

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request 