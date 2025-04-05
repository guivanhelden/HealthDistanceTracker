import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText } from 'lucide-react';
import { AnaliseDistancia } from '@/lib/supabase';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportTableProps {
  data: {
    cliente: {
      id: number;
      nome: string;
      uf: string;
      iniciais?: string;
    };
    prestadores: {
      id: number;
      nome: string;
      local: string;
      distancia: number;
      ranking: number;
    }[];
  }[];
  isLoading: boolean;
  onShowDetails: (clienteId: number, prestadorId: number) => void;
}

export default function ReportTable({ data, isLoading, onShowDetails }: ReportTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const visibleData = data.slice(startIdx, startIdx + rowsPerPage);

  const exportToPdf = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('Relatório de Proximidade Cliente-Prestador', 14, 22);
    
    // Create table data
    const tableData = data.flatMap(item => {
      // Get the two closest providers for each client
      return item.prestadores.map(prestador => [
        item.cliente.nome,
        item.cliente.uf,
        prestador.ranking === 1 ? prestador.nome : '',
        prestador.ranking === 1 ? `${prestador.distancia.toFixed(1)} km` : '',
        prestador.ranking === 2 ? prestador.nome : '',
        prestador.ranking === 2 ? `${prestador.distancia.toFixed(1)} km` : '',
      ]);
    });
    
    // Add table
    (doc as any).autoTable({
      startY: 30,
      head: [['Cliente', 'UF', 'Prestador #1', 'Distância', 'Prestador #2', 'Distância']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [37, 99, 235] }
    });
    
    // Save the PDF
    doc.save('relatorio-proximidade.pdf');
  };

  const exportToCsv = () => {
    // Create CSV content
    const headers = ['Cliente', 'UF', 'Prestador #1', 'Distância (km)', 'Prestador #2', 'Distância (km)'];
    
    const csvRows = [headers];
    
    data.forEach(item => {
      const row = [
        item.cliente.nome,
        item.cliente.uf,
        item.prestadores[0]?.nome || '',
        item.prestadores[0]?.distancia.toFixed(1) || '',
        item.prestadores[1]?.nome || '',
        item.prestadores[1]?.distancia.toFixed(1) || ''
      ];
      csvRows.push(row);
    });
    
    // Convert to CSV string
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'relatorio-proximidade.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-semibold text-slate-700">Relatório de Proximidade Cliente-Prestador</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center" 
            onClick={exportToPdf}
          >
            <FileText className="h-4 w-4 mr-1" />
            Exportar PDF
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center"
            onClick={exportToCsv}
          >
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>UF</TableHead>
              <TableHead>Prestador #1</TableHead>
              <TableHead>Distância</TableHead>
              <TableHead>Prestador #2</TableHead>
              <TableHead>Distância</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">Carregando dados...</p>
                </TableCell>
              </TableRow>
            ) : visibleData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Nenhum dado disponível
                </TableCell>
              </TableRow>
            ) : (
              visibleData.map((item) => (
                <TableRow key={item.cliente.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                        {item.cliente.iniciais || item.cliente.nome.substring(0, 2)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{item.cliente.nome}</div>
                        <div className="text-sm text-slate-500">ID: {item.cliente.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{item.cliente.uf}</div>
                  </TableCell>
                  {item.prestadores[0] && (
                    <>
                      <TableCell>
                        <div className="text-sm text-slate-900">{item.prestadores[0].nome}</div>
                        <div className="text-xs text-slate-500">{item.prestadores[0].local}</div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {item.prestadores[0].distancia.toFixed(1)} km
                        </span>
                      </TableCell>
                    </>
                  )}
                  {item.prestadores[1] && (
                    <>
                      <TableCell>
                        <div className="text-sm text-slate-900">{item.prestadores[1].nome}</div>
                        <div className="text-xs text-slate-500">{item.prestadores[1].local}</div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {item.prestadores[1].distancia.toFixed(1)} km
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <button 
                      className="text-primary hover:text-blue-700 text-sm"
                      onClick={() => onShowDetails(item.cliente.id, item.prestadores[0]?.id || 0)}
                    >
                      Detalhes
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-700">
            Mostrando <span className="font-medium">{startIdx + 1}</span> a <span className="font-medium">{Math.min(startIdx + rowsPerPage, data.length)}</span> de <span className="font-medium">{data.length}</span> resultados
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
