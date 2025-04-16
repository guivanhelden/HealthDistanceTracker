import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Settings, MapPin } from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div>
      <div className="p-4 border-b border-slate-700">
        <div className="flex justify-center mb-4">
          <img 
            src="https://doc.vhseguros.com.br/files/public_html/LogoVH%2FVAN-HELDEN-cor.png" 
            alt="Van Helden Seguros" 
            className="h-10 w-auto" 
          />
        </div>
        <h1 className="text-xl font-semibold">Análise de Distância</h1>
        <p className="text-sm text-slate-400">Cliente-Prestador</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/">
              <div className={`flex items-center p-2 rounded-md cursor-pointer ${isActive('/') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </div>
            </Link>
          </li>
          <li>
            <Link href="/relatorios">
              <div className={`flex items-center p-2 rounded-md cursor-pointer ${isActive('/relatorios') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <FileText className="h-5 w-5 mr-3" />
                Relatórios
              </div>
            </Link>
          </li>
          <li>
            <Link href="/configuracoes">
              <div className={`flex items-center p-2 rounded-md cursor-pointer ${isActive('/configuracoes') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <Settings className="h-5 w-5 mr-3" />
                Configurações
              </div>
            </Link>
          </li>
          <li className="pt-6">
            <p className="text-xs text-slate-500 uppercase px-2 mb-2">Cidades Principais</p>
            <Link href="/?city=São Paulo">
              <div className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-3"></span>
                São Paulo
              </div>
            </Link>
          </li>
          <li>
            <Link href="/?city=Rio de Janeiro">
              <div className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                Rio de Janeiro
              </div>
            </Link>
          </li>
          <li>
            <Link href="/?city=Brasília">
              <div className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700 cursor-pointer">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-3"></span>
                Brasília
              </div>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
