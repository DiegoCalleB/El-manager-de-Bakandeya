import { useState, useMemo } from 'react';
import { Lead } from '../types';
import { calculateBookingMetrics, filterLeads, calculateLeadScore } from '../utils/bookingUtils';

export function useBookingPipeline(leads: Lead[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [typeFilter, setTypeFilter] = useState('todos');

  const metrics = useMemo(() => {
    return calculateBookingMetrics(leads);
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return filterLeads(leads, searchQuery, statusFilter, typeFilter);
  }, [leads, searchQuery, statusFilter, typeFilter]);

  const scoredLeads = useMemo(() => {
    return filteredLeads.map(lead => ({
      ...lead,
      qualityScore: calculateLeadScore(lead)
    }));
  }, [filteredLeads]);

  return {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    typeFilter,
    setTypeFilter,
    metrics,
    filteredLeads: scoredLeads,
  };
}
