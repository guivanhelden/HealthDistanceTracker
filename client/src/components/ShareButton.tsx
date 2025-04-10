import React, { useState } from 'react';
import { Share2, Check, Copy, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { copiarLinkCompartilhamento, gerarLinkCompartilhamento } from '@/lib/share';
import { CITY_COORDINATES } from '@/lib/mapbox';

interface ShareButtonProps {
  uf?: string;
  cidade?: string;
  mostrarClientes?: boolean;
  mostrarPrestadores?: boolean;
  mostrarRedeAtual?: boolean;
  distanciaMaxima?: number;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export default function ShareButton({ 
  uf = 'Todos',
  cidade,
  mostrarClientes = true,
  mostrarPrestadores = true,
  mostrarRedeAtual = true,
  distanciaMaxima = 15,
  variant = 'default',
  size = 'default'
}: ShareButtonProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [shareOptions, setShareOptions] = useState({
    uf,
    cidade,
    mostrarClientes,
    mostrarPrestadores,
    mostrarRedeAtual,
    distanciaMaxima
  });
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Lista de cidades disponíveis (baseada no componente MapView)
  const cidades = Object.keys(CITY_COORDINATES);

  // Gerar o link baseado nas opções atuais
  const gerarLink = () => {
    const link = gerarLinkCompartilhamento(shareOptions);
    setGeneratedLink(link);
  };

  // Copiar o link para a área de transferência
  const copiarLink = async () => {
    const sucesso = await copiarLinkCompartilhamento(shareOptions);
    
    if (sucesso) {
      setCopied(true);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
      
      // Reset the copied state after a delay
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link.",
        variant: "destructive",
      });
    }
  };

  // Compartilhar diretamente em várias plataformas
  const shareViaEmail = () => {
    const link = gerarLinkCompartilhamento(shareOptions);
    const subject = "Relatório de Proximidade e Mapa de Distribuição";
    const body = `Olá,\n\nSeguem os dados de proximidade entre clientes e prestadores de saúde:\n\n${link}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const shareViaWhatsApp = () => {
    const link = gerarLinkCompartilhamento(shareOptions);
    const text = `Relatório de Proximidade e Mapa de Distribuição: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Compartilhar Relatórios</DialogTitle>
            <DialogDescription>
              Gere um link para compartilhar o Mapa de Distribuição e o Relatório de Proximidade.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="uf" className="text-right">
                UF
              </Label>
              <Select 
                value={shareOptions.uf || 'Todos'} 
                onValueChange={(value) => setShareOptions(prev => ({...prev, uf: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  <SelectItem value="SP">São Paulo</SelectItem>
                  <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  <SelectItem value="DF">Distrito Federal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="cidade" className="text-right">
                Cidade
              </Label>
              <Select 
                value={shareOptions.cidade || 'nenhuma'} 
                onValueChange={(value) => setShareOptions(prev => ({...prev, cidade: value === 'nenhuma' ? undefined : value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione a cidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nenhuma">Todas</SelectItem>
                  {cidades.map(cidade => (
                    <SelectItem key={cidade} value={cidade}>{cidade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="distancia" className="text-right">
                Distância Máx.
              </Label>
              <Input
                id="distancia"
                type="number"
                value={shareOptions.distanciaMaxima}
                onChange={(e) => setShareOptions(prev => ({...prev, distanciaMaxima: Number(e.target.value)}))}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Mostrar
              </Label>
              <div className="col-span-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="clientes" 
                    checked={shareOptions.mostrarClientes}
                    onCheckedChange={(checked) => setShareOptions(prev => ({...prev, mostrarClientes: checked}))}
                  />
                  <Label htmlFor="clientes">Clientes</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="prestadores" 
                    checked={shareOptions.mostrarPrestadores}
                    onCheckedChange={(checked) => setShareOptions(prev => ({...prev, mostrarPrestadores: checked}))}
                  />
                  <Label htmlFor="prestadores">Prestadores</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="redeAtual" 
                    checked={shareOptions.mostrarRedeAtual}
                    onCheckedChange={(checked) => setShareOptions(prev => ({...prev, mostrarRedeAtual: checked}))}
                  />
                  <Label htmlFor="redeAtual">Rede Atual</Label>
                </div>
              </div>
            </div>

            {generatedLink && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="link" className="text-right">
                  Link
                </Label>
                <div className="col-span-3 flex">
                  <Input
                    id="link"
                    value={generatedLink}
                    readOnly
                    className="rounded-r-none"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={copiarLink}
                    className="rounded-l-none border-l-0"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={gerarLink}
              className="sm:mr-auto"
            >
              Gerar Link
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartilhar via
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Compartilhar via</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={shareViaEmail}>
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={shareViaWhatsApp}>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copiarLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button type="submit" onClick={copiarLink}>
              <Link className="mr-2 h-4 w-4" />
              Copiar Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 