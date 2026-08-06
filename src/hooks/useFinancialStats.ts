import { useMemo } from 'react';
import { Payment, Concert } from '../types';
import { calculateFinancialSummary } from '../utils/financeUtils';

export function useFinancialStats(payments: Payment[], concerts: Concert[] = []) {
  return useMemo(() => {
    return calculateFinancialSummary(payments);
  }, [payments, concerts]);
}
