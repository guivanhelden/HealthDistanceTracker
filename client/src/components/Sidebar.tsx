import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, FileText, Settings, MapPin } from 'lucide-react';

export default function Sidebar() {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div>
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-xl font-semibold">Análise de Distância</h1>
        <p className="text-sm text-slate-400">Cliente-Hospital</p>
      </div>
      
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link href="/">
              <a className={`flex items-center p-2 rounded-md ${isActive('/') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <Home className="h-5 w-5 mr-3" />
                Dashboard
              </a>
            </Link>
          </li>
          <li>
            <Link href="/relatorios">
              <a className={`flex items-center p-2 rounded-md ${isActive('/relatorios') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <FileText className="h-5 w-5 mr-3" />
                Relatórios
              </a>
            </Link>
          </li>
          <li>
            <Link href="/configuracoes">
              <a className={`flex items-center p-2 rounded-md ${isActive('/configuracoes') ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'}`}>
                <Settings className="h-5 w-5 mr-3" />
                Configurações
              </a>
            </Link>
          </li>
          <li className="pt-6">
            <p className="text-xs text-slate-500 uppercase px-2 mb-2">Cidades Principais</p>
            <Link href="/?city=São Paulo">
              <a className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-3"></span>
                São Paulo
              </a>
            </Link>
          </li>
          <li>
            <Link href="/?city=Rio de Janeiro">
              <a className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-3"></span>
                Rio de Janeiro
              </a>
            </Link>
          </li>
          <li>
            <Link href="/?city=Brasília">
              <a className="flex items-center p-2 rounded-md text-slate-300 hover:bg-slate-700">
                <span className="w-2 h-2 rounded-full bg-purple-500 mr-3"></span>
                Brasília
              </a>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
