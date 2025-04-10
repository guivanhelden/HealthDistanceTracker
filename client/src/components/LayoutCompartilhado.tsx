import React, { useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export default function LayoutCompartilhado({ children, pageTitle = "Relatório Compartilhado" }: LayoutProps) {
  // Atualizar o título da página quando o componente for montado
  useEffect(() => {
    // Guardar o título original para restaurar quando o componente for desmontado
    const originalTitle = document.title;
    
    // Atualizar o título
    document.title = `${pageTitle} | Health Distance Tracker`;
    
    // Restaurar o título original quando o componente for desmontado
    return () => {
      document.title = originalTitle;
    };
  }, [pageTitle]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header simples */}
      <header className="bg-white border-b border-slate-200 p-4">
        <div className="container mx-auto max-w-7xl flex items-center">
          <div className="mr-6">
            <img 
              src="https://doc.vhseguros.com.br/files/public_html/LogoVH%2FVAN-HELDEN-cor.png" 
              alt="Van Helden Seguros" 
              className="h-12 w-auto"
            />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">Análise de Distância</h1>
            <p className="text-sm text-slate-500">Cliente-Prestador</p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container mx-auto max-w-7xl p-4">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="border-t border-slate-200 p-4 text-center text-slate-500 text-sm">
        <p>© {new Date().getFullYear()} Health Distance Tracker - Van Helden Seguros</p>
      </footer>
    </div>
  );
} 