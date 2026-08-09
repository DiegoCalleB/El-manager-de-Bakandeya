import { useState, useEffect, useCallback } from 'react';
import { Lead, Rehearsal, Concert, SocialPost, Payment, Message, SocialMetric, User, Fan, Tour, EPKConfig } from '../types';
import { api, ApiError } from '../services/api';

export function useAppData(isLoggedIn: boolean, bandId?: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [rehearsals, setRehearsals] = useState<Rehearsal[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<SocialMetric[]>([]);
  const [bandUsers, setBandUsers] = useState<User[]>([]);
  const [fans, setFans] = useState<Fan[]>([]);
  const [epkConfig, setEpkConfig] = useState<Partial<EPKConfig>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('syncing');

  const dedupeById = <T extends { id?: string }>(arr: T[] = []): T[] => {
    const seen = new Set<string>();
    return arr.filter(item => {
      if (!item) return false;
      if (!item.id) return true;
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const fetchState = useCallback(async (retryCount = 0) => {
    setSyncStatus('syncing');
    try {
      const data = await api.getState();
      setLeads(dedupeById(data.leads || []));
      setRehearsals(dedupeById(data.rehearsals || []));
      setTours(dedupeById(data.tours || []));
      setConcerts(dedupeById(data.concerts || []));
      setPosts(dedupeById(data.posts || []));
      setPayments(dedupeById(data.payments || []));
      setMessages(dedupeById(data.messages || []));
      setMetrics(dedupeById(data.metrics || []));
      setBandUsers(dedupeById(data.users || []));
      setFans(dedupeById(data.fans || []));
      setEpkConfig(data.epkConfig || {});
      setSyncStatus('synced');
    } catch (e) {
      console.warn(`Connecting to server (attempt ${retryCount + 1}):`, e);
      if (retryCount < 2) {
        setTimeout(() => {
          fetchState(retryCount + 1);
        }, 1500);
      } else {
        console.warn('Server offline or starting, using cached state.');
        setSyncStatus('synced');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchState();
    }
  }, [isLoggedIn, bandId, fetchState]);

  // Handle external agent completions
  useEffect(() => {
    const handleAgentCompleted = () => {
      console.log('[useAppData] Agente completado. Refrescando datos...');
      fetchState();
    };
    window.addEventListener('github-agent-completed', handleAgentCompleted);
    return () => {
      window.removeEventListener('github-agent-completed', handleAgentCompleted);
    };
  }, [fetchState]);

  // REST API UPDATE OPERATIONS
  const handleUpdateEpkConfig = async (newConfig: any) => {
    setEpkConfig(newConfig);
    try {
      await api.updateEpkConfig(newConfig);
    } catch (e) {
      console.error('Error updating EPK config:', e);
    }
  };

  const handleUpdateLead = async (id: string, updatedFields: Partial<Lead>, expectedStatus?: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updatedFields } : l));
    try {
      await api.updateLead(id, updatedFields, expectedStatus);
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) {
        alert(e.message);
      } else {
        console.error('Error saving lead updates, reverting:', e);
      }
      fetchState();
    }
  };

  const handleUpdateRehearsal = async (id: string, updatedFields: Partial<Rehearsal>) => {
    setRehearsals(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    try {
      await api.updateRehearsal(id, updatedFields);
    } catch (e) {
      console.error('Error saving rehearsal updates:', e);
      fetchState();
    }
  };

  const handleUpdateConcert = async (id: string, updatedFields: Partial<Concert>) => {
    setConcerts(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    try {
      await api.updateConcert(id, updatedFields);
    } catch (e) {
      console.error('Error saving concert updates:', e);
      fetchState();
    }
  };

  const handleAddLead = async (newLead: Lead) => {
    setLeads(prev => [...prev, newLead]);
    try {
      await api.createLead(newLead);
    } catch (e) {
      console.error('Error adding lead:', e);
      fetchState();
    }
  };

  const handleAddRehearsal = async (reh: Rehearsal) => {
    setRehearsals(prev => [...prev, reh]);
    try {
      await api.createRehearsal(reh);
    } catch (e) {
      console.error('Error adding rehearsal:', e);
      fetchState();
    }
  };

  const handleAddConcert = async (concert: Concert) => {
    setConcerts(prev => [...prev, concert]);
    try {
      await api.createConcert(concert);
    } catch (e) {
      console.error('Error adding concert:', e);
      fetchState();
    }
  };

  const handleAddPost = async (post: SocialPost) => {
    setPosts(prev => [...prev, post]);
    try {
      await api.createPost(post);
    } catch (e) {
      console.error('Error adding social post:', e);
      fetchState();
    }
  };

  const handleUpdatePost = async (id: string, updatedFields: Partial<SocialPost>) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    try {
      await api.updatePost(id, updatedFields);
    } catch (e) {
      console.error('Error updating social post:', e);
      fetchState();
    }
  };

  const handleAddMetric = async (metric: SocialMetric) => {
    setMetrics(prev => [...prev, metric]);
    try {
      await api.createMetric(metric);
    } catch (e) {
      console.error('Error adding metric:', e);
      fetchState();
    }
  };

  const handleUpdateMetric = async (id: string, updatedFields: Partial<SocialMetric>) => {
    setMetrics(prev => prev.map(m => m.id === id ? { ...m, ...updatedFields } : m));
    try {
      await api.updateMetric(id, updatedFields);
    } catch (e) {
      console.error('Error updating metric:', e);
      fetchState();
    }
  };

  const handleDeleteMetric = async (id: string) => {
    setMetrics(prev => prev.filter(m => m.id !== id));
    try {
      await api.deleteMetric(id);
    } catch (e) {
      console.error('Error deleting metric:', e);
      fetchState();
    }
  };

  const handleAddPayment = async (pay: Payment) => {
    setPayments(prev => [...prev, pay]);
    try {
      await api.createPayment(pay);
    } catch (e) {
      console.error('Error adding payment:', e);
      fetchState();
    }
  };

  const handleUpdatePayment = async (id: string, updatedFields: Partial<Payment>) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    try {
      await api.updatePayment(id, updatedFields);
    } catch (e) {
      console.error('Error updating payment:', e);
      fetchState();
    }
  };

  const handleSaveTour = async (tourData: Tour) => {
    const exists = tours.some(t => t.id === tourData.id);
    setTours(prev => {
      const ex = prev.some(t => t.id === tourData.id);
      if (ex) return prev.map(t => t.id === tourData.id ? tourData : t);
      return [...prev, tourData];
    });
    try {
      if (exists) {
        await api.updateTour(tourData.id, tourData);
      } else {
        await api.createTour(tourData);
      }
    } catch (e) {
      console.error('Error saving tour:', e);
      fetchState();
    }
  };

  const handleDeleteTour = async (id: string) => {
    setTours(prev => prev.filter(t => t.id !== id));
    try {
      await api.deleteTour(id);
    } catch (e) {
      console.error('Error deleting tour:', e);
      fetchState();
    }
  };

  const handleAddFan = async (fan: Fan) => {
    setFans(prev => [fan, ...prev]);
    try {
      await api.createFan(fan);
    } catch (e) {
      console.error('Error adding fan:', e);
      fetchState();
    }
  };

  const handleDeleteFan = async (id: string) => {
    setFans(prev => prev.filter(f => f.id !== id));
    try {
      await api.deleteFan(id);
    } catch (e) {
      console.error('Error deleting fan:', e);
      fetchState();
    }
  };

  const handleUpdateIncentive = async (newIncentive: NonNullable<EPKConfig['incentivoFans']>) => {
    setEpkConfig(prev => ({ ...prev, incentivoFans: newIncentive }));
    try {
      await api.updateIncentive(newIncentive);
    } catch (e) {
      console.error('Error updating incentive:', e);
      fetchState();
    }
  };

  return {
    leads,
    rehearsals,
    tours,
    concerts,
    posts,
    payments,
    messages,
    metrics,
    bandUsers,
    fans,
    epkConfig,
    isLoading,
    syncStatus,
    fetchState,
    handleUpdateEpkConfig,
    handleUpdateLead,
    handleUpdateRehearsal,
    handleUpdateConcert,
    handleAddLead,
    handleAddRehearsal,
    handleAddConcert,
    handleAddPost,
    handleUpdatePost,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddPayment,
    handleUpdatePayment,
    handleSaveTour,
    handleDeleteTour,
    handleAddFan,
    handleDeleteFan,
    handleUpdateIncentive
  };
}
