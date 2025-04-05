import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    mapbox: {
      token: import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZ3VpdmFuaGVsZGVuIiwiYSI6ImNtOGRpOHA0dTA2eXYybnB1cGZpdXE5amoifQ.AaT1j9pOdFhZwKS-H2Xfcw'
    },
    google: {
      apiKey: import.meta.env.VITE_GOOGLE_API_KEY || 'AIzaSyCUkiOKvorfH6hVfw7Z1uiVQkKPv-XVt7w',
      useHaversine: false
    },
    supabase: {
      url: import.meta.env.VITE_SUPABASE_URL || 'https://prkpjleyzzdnqxhgmnbp.supabase.co',
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBya3BqbGV5enpkbnF4aGdtbmJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIyMTgxODMsImV4cCI6MjA1Nzc5NDE4M30.LXp4NFhDvicu_bmvP0ibfcsr_wPAVIBpKWN82Y25IDQ'
    },
    general: {
      circleRadius: 7,
      maxDistanceAnalysis: 20,
      refreshInterval: 30
    }
  });

  // Calculate all distances mutation
  const calculateAllMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/calculate/all');
    },
    onSuccess: (data) => {
      toast({
        title: "Processamento concluído",
        description: `Cálculo em massa finalizado: ${data.results?.success || 0} sucessos, ${data.results?.failed || 0} falhas.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Erro no processamento",
        description: `Ocorreu um erro: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (section: string, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const saveSettings = (section: string) => {
    toast({
      title: "Configurações salvas",
      description: `As configurações de ${section} foram salvas com sucesso.`,
    });
  };

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Configurações</h2>
        <p className="text-slate-500">Configure as APIs e parâmetros do sistema</p>
      </div>

      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">Chaves de API</TabsTrigger>
          <TabsTrigger value="analysis">Análise de Distância</TabsTrigger>
          <TabsTrigger value="map">Configurações de Mapa</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
        </TabsList>
        
        {/* API Keys Tab */}
        <TabsContent value="api">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Google Maps API</CardTitle>
                <CardDescription>Configure as chaves de API do Google Maps</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="google-api-key">API Key</Label>
                  <Input 
                    id="google-api-key" 
                    value={settings.google.apiKey} 
                    onChange={(e) => handleInputChange('google', 'apiKey', e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Utilizada para Geocoding e Distance Matrix</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="haversine" 
                    checked={settings.google.useHaversine}
                    onCheckedChange={(checked) => handleInputChange('google', 'useHaversine', checked)}
                  />
                  <Label htmlFor="haversine">Usar Haversine como fallback</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => saveSettings('Google Maps API')}>Salvar Configurações</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Mapbox</CardTitle>
                <CardDescription>Configure a chave de API do Mapbox</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="mapbox-token">Access Token</Label>
                  <Input 
                    id="mapbox-token" 
                    value={settings.mapbox.token} 
                    onChange={(e) => handleInputChange('mapbox', 'token', e.target.value)}
                  />
                  <p className="text-xs text-slate-500">Utilizado para a renderização de mapas</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => saveSettings('Mapbox')}>Salvar Configurações</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* Analysis Settings Tab */}
        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Distância</CardTitle>
              <CardDescription>Configure parâmetros para análise de distância</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="circle-radius">Raio do Círculo (km)</Label>
                  <Input 
                    id="circle-radius" 
                    type="number" 
                    value={settings.general.circleRadius} 
                    onChange={(e) => handleInputChange('general', 'circleRadius', Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">Raio de cobertura exibido no mapa</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-distance">Distância Máxima de Análise (km)</Label>
                  <Input 
                    id="max-distance" 
                    type="number" 
                    value={settings.general.maxDistanceAnalysis} 
                    onChange={(e) => handleInputChange('general', 'maxDistanceAnalysis', Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-500">Distância máxima considerada na análise</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Operações de Dados</h3>
                <div className="flex flex-col md:flex-row gap-4">
                  <Button 
                    onClick={() => calculateAllMutation.mutate()}
                    disabled={calculateAllMutation.isPending}
                  >
                    {calculateAllMutation.isPending ? "Processando..." : "Calcular Todas as Distâncias"}
                  </Button>
                  <Button variant="outline">Limpar Dados de Análise</Button>
                </div>
                {calculateAllMutation.isPending && (
                  <p className="text-sm text-slate-500 mt-2">Calculando distâncias para todos os clientes. Isso pode levar alguns minutos...</p>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => saveSettings('Análise de Distância')}>Salvar Configurações</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Map Settings Tab */}
        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Mapa</CardTitle>
              <CardDescription>Ajuste as configurações de visualização do mapa</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Estilo do Mapa</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="streets-v11">Streets</option>
                    <option value="light-v10">Light</option>
                    <option value="dark-v10">Dark</option>
                    <option value="satellite-v9">Satellite</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="default-zoom">Zoom Padrão</Label>
                  <Input id="default-zoom" type="number" defaultValue={10} min={1} max={20} />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch id="3d-buildings" />
                  <Label htmlFor="3d-buildings">Mostrar Edifícios 3D</Label>
                </div>
              </div>
              
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-2">Cidades Principais</h3>
                <p className="text-sm text-slate-500 mb-4">Defina as coordenadas das cidades principais</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input defaultValue="São Paulo" disabled />
                    </div>
                    <div>
                      <Label>Latitude</Label>
                      <Input defaultValue="-23.5505" />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input defaultValue="-46.6333" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input defaultValue="Rio de Janeiro" disabled />
                    </div>
                    <div>
                      <Label>Latitude</Label>
                      <Input defaultValue="-22.9068" />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input defaultValue="-43.1729" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Cidade</Label>
                      <Input defaultValue="Brasília" disabled />
                    </div>
                    <div>
                      <Label>Latitude</Label>
                      <Input defaultValue="-15.7801" />
                    </div>
                    <div>
                      <Label>Longitude</Label>
                      <Input defaultValue="-47.9292" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => saveSettings('Mapa')}>Salvar Configurações</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Database Settings Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Banco de Dados (Supabase)</CardTitle>
              <CardDescription>Configure a conexão com o banco de dados</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supabase-url">URL</Label>
                <Input 
                  id="supabase-url" 
                  value={settings.supabase.url} 
                  onChange={(e) => handleInputChange('supabase', 'url', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supabase-key">Anon Key</Label>
                <Input 
                  id="supabase-key" 
                  value={settings.supabase.anonKey} 
                  onChange={(e) => handleInputChange('supabase', 'anonKey', e.target.value)}
                />
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-4">Tabelas</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">base_rubayia_cpf</p>
                      <p className="text-xs text-slate-500">Tabela de clientes</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-700">Conectado</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">rede_bronze_amil_resumida</p>
                      <p className="text-xs text-slate-500">Tabela de prestadores</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-700">Conectado</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                    <div>
                      <p className="font-medium">analise_distancia_ps</p>
                      <p className="text-xs text-slate-500">Tabela de análise de distância</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-slate-700">Conectado</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => saveSettings('Banco de Dados')}>Salvar Configurações</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
