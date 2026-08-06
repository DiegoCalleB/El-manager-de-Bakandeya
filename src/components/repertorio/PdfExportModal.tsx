import React from 'react';
import { Printer, X } from 'lucide-react';
import { Setlist, Song } from '../../types';

interface PdfExportModalProps {
  isOpen: boolean;
  activeSetlist: Setlist | null;
  activeSetlistMetrics: { formattedTime: string; songCount: number };
  songs: Song[];
  isStitchLight: boolean;
  onClose: () => void;
}

export function PdfExportModal({
  isOpen,
  activeSetlist,
  activeSetlistMetrics,
  songs,
  isStitchLight,
  onClose
}: PdfExportModalProps) {
  if (!isOpen || !activeSetlist) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden ${
          isStitchLight ? 'bg-slate-100' : 'bg-neutral-900'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`p-4 flex items-center justify-between border-b ${
            isStitchLight ? 'border-slate-300 bg-white' : 'border-neutral-800 bg-[#121111]'
          }`}
        >
          <div className="flex items-center gap-3">
            <Printer className={`w-5 h-5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`} />
            <h3
              className={`font-display font-black text-lg uppercase tracking-wider ${
                isStitchLight ? 'text-slate-900' : 'text-neutral-100'
              }`}
            >
              Vista Previa - Setlist
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>SETLIST BAKANDEYA - ${activeSetlist.nombre}</title>
                        <style>
                          @page { size: A4 portrait; margin: 1.5cm; }
                          body { font-family: system-ui, -apple-system, sans-serif; background: white; color: black; margin: 0; padding: 0; }
                          .print-container { max-width: 100%; margin: 0 auto; }
                          .header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 4px solid #000; padding-bottom: 1rem; margin-bottom: 1.5rem; }
                          .header h1 { font-size: 32pt; text-transform: uppercase; margin: 0; font-weight: 900; letter-spacing: -1px; }
                          .header p { font-size: 16pt; font-family: monospace; color: #444; margin: 0; }
                          .metrics { font-size: 16pt; font-family: monospace; font-weight: bold; background: #eee; padding: 8px 16px; border-radius: 8px; }
                          .table { width: 100%; border-collapse: collapse; margin-bottom: 2rem; }
                          .table th { text-align: left; padding: 8px 4px; border-bottom: 2px solid #000; font-size: 14pt; text-transform: uppercase; color: #666; font-family: monospace; }
                          .table td { padding: 12px 4px; border-bottom: 1px solid #ccc; font-size: 24pt; font-weight: 800; }
                          .table tr.interludio td { font-style: italic; color: #555; background: #f9f9f9; font-size: 20pt; }
                          .table tr.presentacion td { color: #d97706; background: #fffbeb; font-size: 22pt; }
                          .key-badge { display: inline-block; background: #eee; color: #000; padding: 4px 10px; border-radius: 6px; font-size: 20pt; font-family: monospace; border: 2px solid #ccc; }
                          .duration { font-family: monospace; color: #666; font-size: 18pt; }
                          .notes { display: block; font-size: 14pt; color: #555; font-weight: normal; margin-top: 4px; font-family: monospace; }
                        </style>
                      </head>
                      <body>
                        <div class="print-container" id="pdf-content">
                          <div class="header">
                            <div>
                              <h1>BAKANDEYA</h1>
                              <p>${activeSetlist.nombre} — ${activeSetlistMetrics.formattedTime} (${activeSetlistMetrics.songCount} Temas)</p>
                            </div>
                          </div>
                          
                          <table class="table">
                            <thead>
                              <tr>
                                <th style="width: 50px;">#</th>
                                <th>TEMA</th>
                                <th style="width: 100px;">TONO</th>
                                <th style="width: 80px; text-align: right;">DUR.</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${activeSetlist.items
                                .map((item, index) => {
                                  if (item.tipoItem === 'cancion') {
                                    const s = songs.find(x => x.id === item.songId);
                                    if (!s) return '';
                                    return `
                                      <tr>
                                        <td style="color: #888; font-family: monospace;">${index + 1}</td>
                                        <td>
                                          ${s.titulo}
                                          ${item.notas ? `<span class="notes">${item.notas}</span>` : ''}
                                        </td>
                                        <td>
                                          ${s.tonalidad ? `<span class="key-badge">${s.tonalidad}</span>` : ''}
                                        </td>
                                        <td class="duration" style="text-align: right;">
                                          ${s.duracionMinutos ? s.duracionMinutos + '\'' : ''}
                                        </td>
                                      </tr>
                                    `;
                                  } else {
                                    return `
                                      <tr class="${item.tipoItem}">
                                        <td style="color: #888; font-family: monospace;">${index + 1}</td>
                                        <td colspan="3">
                                          [${item.tipoItem.toUpperCase()}] ${item.notas || 'Bloque'}
                                        </td>
                                      </tr>
                                    `;
                                  }
                                })
                                .join('')}
                            </tbody>
                          </table>
                        </div>
                        <script>
                          window.onload = () => {
                            window.print();
                            setTimeout(() => window.close(), 500);
                          };
                        </script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }
              }}
              className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all shadow flex items-center gap-2 cursor-pointer ${
                isStitchLight
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-[#f2ca50] hover:bg-[#d1b375] text-[#121111]'
              }`}
            >
              <Printer className="w-4 h-4" /> Exportar a PDF / Imprimir
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors active:scale-95 cursor-pointer ${
                isStitchLight
                  ? 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                  : 'hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: A4 Preview Container */}
        <div
          className={`flex-1 overflow-y-auto p-8 flex justify-center ${
            isStitchLight ? 'bg-slate-200' : 'bg-neutral-950'
          }`}
        >
          <div
            className="bg-white text-black p-12 shadow-2xl shrink-0"
            style={{ width: '210mm', minHeight: '297mm' }}
          >
            <div className="flex items-baseline justify-between border-b-4 border-black pb-4 mb-8">
              <div>
                <h1 className="text-[32pt] font-black uppercase tracking-tighter m-0 leading-none">
                  BAKANDEYA
                </h1>
                <p className="text-[16pt] font-mono text-neutral-600 mt-2 m-0">
                  {activeSetlist.nombre} — {activeSetlistMetrics.formattedTime} (
                  {activeSetlistMetrics.songCount} Temas)
                </p>
              </div>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-mono text-[14pt] uppercase text-neutral-500 pb-2 border-b-2 border-black w-12">
                    #
                  </th>
                  <th className="text-left font-mono text-[14pt] uppercase text-neutral-500 pb-2 border-b-2 border-black">
                    TEMA
                  </th>
                  <th className="text-left font-mono text-[14pt] uppercase text-neutral-500 pb-2 border-b-2 border-black w-28">
                    TONO
                  </th>
                  <th className="text-right font-mono text-[14pt] uppercase text-neutral-500 pb-2 border-b-2 border-black w-24">
                    DUR.
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeSetlist.items.map((item, index) => {
                  if (item.tipoItem === 'cancion') {
                    const s = songs.find(x => x.id === item.songId);
                    if (!s) return null;
                    return (
                      <tr key={item.id}>
                        <td className="py-3 border-b border-neutral-300 font-mono text-[18pt] text-neutral-400 font-bold">
                          {index + 1}
                        </td>
                        <td className="py-3 border-b border-neutral-300">
                          <div className="text-[24pt] font-extrabold">{s.titulo}</div>
                          {item.notas && (
                            <div className="font-mono text-[14pt] text-neutral-500 italic mt-1">
                              {item.notas}
                            </div>
                          )}
                        </td>
                        <td className="py-3 border-b border-neutral-300">
                          {s.tonalidad && (
                            <span className="inline-block bg-neutral-100 border-2 border-neutral-300 px-3 py-1 rounded-lg font-mono text-[20pt] font-bold">
                              {s.tonalidad}
                            </span>
                          )}
                        </td>
                        <td className="py-3 border-b border-neutral-300 text-right font-mono text-[18pt] text-neutral-600 font-bold">
                          {s.duracionMinutos ? s.duracionMinutos + '\'' : ''}
                        </td>
                      </tr>
                    );
                  } else {
                    return (
                      <tr
                        key={item.id}
                        className={
                          item.tipoItem === 'presentacion'
                            ? 'bg-amber-50 text-amber-900'
                            : 'bg-neutral-50 text-neutral-600'
                        }
                      >
                        <td className="py-3 border-b border-neutral-200 font-mono text-[18pt] opacity-50 font-bold px-2">
                          {index + 1}
                        </td>
                        <td colSpan={3} className="py-3 border-b border-neutral-200 px-2">
                          <div className="text-[20pt] font-bold italic">
                            [{item.tipoItem.toUpperCase()}] {item.notas || 'Bloque / Interludio'}
                          </div>
                        </td>
                      </tr>
                    );
                  }
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
