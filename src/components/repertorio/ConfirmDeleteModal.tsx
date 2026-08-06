import React from 'react';
import { Trash2 } from 'lucide-react';

export interface ConfirmDeleteData {
  title: string;
  description: string;
  onConfirm: () => void;
}

interface ConfirmDeleteModalProps {
  data: ConfirmDeleteData | null;
  onClose: () => void;
}

export function ConfirmDeleteModal({ data, onClose }: ConfirmDeleteModalProps) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-3">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{data.title}</h3>
            <p className="text-xs text-neutral-300 mt-1.5 leading-relaxed">{data.description}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              const action = data.onConfirm;
              onClose();
              action();
            }}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all cursor-pointer shadow-lg shadow-rose-950/50"
          >
            Sí, Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
