import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Lead, LeadStatus } from '../../types';
import { VenueDetailPanel } from './VenueDetailPanel';
import { X, Building2 } from 'lucide-react';

interface MobileBottomSheetProps {
  selectedLead: Lead | null;
  onClose: () => void;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  getStatusBadgeClass: (status: LeadStatus | string) => string;
  getStatusLabel: (status: LeadStatus | string) => string;
  getStatusDotColor: (status: LeadStatus | string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  normalizeType: (type?: string) => string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  sectionTab: 'salas' | 'medios' | 'grupos';
  isStitchLight?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  selectedLead,
  onClose,
  onUpdateLead,
  getStatusBadgeClass,
  getStatusLabel,
  getStatusDotColor,
  normalizeStatus,
  normalizeType,
  autoDetectVenueAddress,
  sectionTab,
  isStitchLight = false
}) => {
  useEffect(() => {
    if (selectedLead) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedLead]);

  if (!selectedLead) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] lg:hidden flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-150">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity cursor-pointer z-[999998]"
      />

      {/* Sheet Drawer Container */}
      <div
        className="relative z-[999999] w-full sm:max-w-2xl max-h-[90vh] sm:max-h-[85vh] bg-[#121110] border-t-2 sm:border-2 border-[#f2ca50] rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col text-zinc-100 overflow-hidden"
      >
        {/* Header Bar */}
        <div className="w-full flex justify-between items-center pb-3 border-b border-zinc-800 mb-3 shrink-0">
          <div className="flex items-center gap-2 truncate pr-2">
            <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold truncate">
              Ficha: {selectedLead.nombre_sala}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/50 transition-colors cursor-pointer shadow-md text-xs font-bold shrink-0 gap-1"
            title="Cerrar ficha"
          >
            <X className="w-4 h-4" />
            <span>Cerrar</span>
          </button>
        </div>

        {/* Content Panel - Scrollable container */}
        <div className="flex-1 overflow-y-auto pr-1">
          <VenueDetailPanel
            selectedLead={selectedLead}
            onClose={onClose}
            onUpdateLead={onUpdateLead}
            getStatusBadgeClass={getStatusBadgeClass}
            getStatusLabel={getStatusLabel}
            getStatusDotColor={getStatusDotColor}
            normalizeStatus={normalizeStatus}
            normalizeType={normalizeType}
            autoDetectVenueAddress={autoDetectVenueAddress}
            sectionTab={sectionTab}
            isStitchLight={isStitchLight}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};


