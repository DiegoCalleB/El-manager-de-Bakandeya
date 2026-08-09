import React, { useEffect, useState } from 'react';
import { Lead, LeadStatus } from '../../types';
import { VenueDetailPanel } from './VenueDetailPanel';
import { X, ChevronDown } from 'lucide-react';

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
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState<number>(0);

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

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY !== null) {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 0) {
        setCurrentY(deltaY);
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentY > 120) {
      onClose();
    }
    setStartY(null);
    setCurrentY(0);
  };

  return (
    <div className="fixed inset-0 z-50 sm:hidden flex flex-col justify-end">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      />

      {/* Sliding Sheet Drawer */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateY(${currentY}px)` }}
        className="relative w-full max-h-[88vh] bg-[#121110] border-t-2 border-[#f2ca50] rounded-t-3xl p-4 overflow-y-auto shadow-2xl transition-transform duration-100 ease-out pb-10"
      >
        {/* Grab Handle Bar for tactile swipe down */}
        <div className="w-full flex justify-center pb-2 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 rounded-full bg-zinc-600/80 hover:bg-amber-400 transition-colors" />
        </div>

        {/* Content Panel */}
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
  );
};
