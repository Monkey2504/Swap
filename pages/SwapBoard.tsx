import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, UserPreference, SwapOffer, Duty } from '../types';
import { swapService, formatError } from '../lib/api';
import { useDuties } from '../hooks/useDuties';
import { LEGAL_DISCLAIMER } from '../constants';
import { Repeat, Plus, Loader2, Phone, X, Check, Calendar, ArrowRight, AlertTriangle, UserCheck, MessageSquare, Trash2 } from 'lucide-react';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
  onRefreshDuties: () => Promise<void>;
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my-swaps'>('browse');
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [myOffers, setMyOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { duties } = useDuties(user.id);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'browse') {
        const remoteOffers = await swapService.getAvailableSwaps(user.depot, user.id);
        const matched = await swapService.matchSwaps(preferences, remoteOffers);
        setSwaps(matched as SwapOffer[]);
      } else {
        const mine = await swapService.getMyOffersWithRequests(user.id);
        setMyOffers(mine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.id, user.depot, preferences, activeTab]);

  useEffect(() => {
    fetchData();
    const subscription = swapService.subscribeToSwaps(() => fetchData());
    return () => { subscription.unsubscribe(); };
  }, [fetchData]);

  const handlePublish = async (duty: Duty) => {
    setPublishing(true);
    try {
      await swapService.publishForSwap(user, duty);
      setShowPublishModal(false);
      setActiveTab('my-swaps');
    } catch (err) {
      alert(formatError(err));
    } finally {
      setPublishing(false);
    }
  };

  const handleRequest = async (offerId: string) => {
    setActionLoading(offerId);
    try {
      await swapService.sendSwapRequest(offerId, user);
      alert("Votre demande a été envoyée !");
    } catch (err) {
      alert(formatError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptRequest = async (offerId: string, requestId: string) => {
    if (!confirm("Accepter cet échange ? Vos autres demandes sur ce service seront refusées.")) return;
    setActionLoading(requestId);
    try {
      await swapService.acceptSwapRequest(offerId, requestId);
      fetchData();
    } catch (err) {
      alert(formatError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm("Supprimer cette publication ?")) return;
    try {
      await swapService.deleteOffer(id);
      fetchData();
    } catch (err) {
      alert(formatError(err));
    }
  };

  return (
    <div className="space-y-10 animate-slide-up max-w-6xl mx-auto pb-40">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">
            Bourse <span className="text-sncb-blue">SNCB</span>
          </h2>
          <div className="flex items-center gap-4 mt-4">
            <button 
              onClick={() => setActiveTab('browse')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${activeTab === 'browse' ? 'bg-sncb-blue text-white shadow-lg shadow-sncb-blue/20' : 'text-slate-400 hover:text-sncb-blue'}`}
            >
              Voir les Offres
            </button>
            <button 
              onClick={() => setActiveTab('my-swaps')}
              className={`text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full transition-all ${activeTab === 'my-swaps' ? 'bg-sncb-blue text-white shadow-lg shadow-sncb-blue/20' : 'text-slate-400 hover:text-sncb-blue'}`}
            >
              Mes Échanges {myOffers.some(o => o.swap_requests?.some((r: any) => r.status === 'pending')) && '●'}
            </button>
          </div>
        </div>
        <button 
          onClick={() => setShowPublishModal(true)}
          className="w-full md:w-auto bg-sncb-blue text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Plus size={20} /> Publier
        </button>
      </div>

      {activeTab === 'browse' ? (
        <>
          {/* BROWSE OFFERS */}
          {loading ? (
            <div className="py-32 flex flex-col items-center"><Loader2 className="animate-spin text-sncb-blue mb-6" size={48} /></div>
          ) : swaps.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {swaps.map(swap => (
                <div key={swap.id} className="glass-card bg-white p-8 border-gray-100 group shadow-xl relative overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sncb-blue text-white rounded-xl flex items-center justify-center font-black italic">{String(swap.user.firstName?.[0] || 'A')}</div>
                      <div>
                        <h4 className="font-black text-slate-900 leading-tight">{String(swap.user.firstName)} {String(swap.user.lastName)}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Matricule {String(swap.user.sncbId)}</p>
                      </div>
                    </div>
                    <div className="text-[10px] font-black px-3 py-1 bg-blue-50 text-sncb-blue rounded-full">{Number(swap.matchScore || 0)}% MATCH</div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-black text-slate-900">{String(swap.offeredDuty.start_time)} <ArrowRight className="inline mx-2 text-slate-300" size={18} /> {String(swap.offeredDuty.end_time)}</span>
                      <span className="text-[9px] font-black bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-100">{String(swap.offeredDuty.code)}</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      {new Date(swap.offeredDuty.date).toLocaleDateString('fr-BE', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                  </div>

                  <button 
                    onClick={() => handleRequest(swap.id)}
                    disabled={!!actionLoading}
                    className="w-full py-4 bg-sncb-blue text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
                  >
                    {actionLoading === swap.id ? <Loader2 className="animate-spin" size={16} /> : <MessageSquare size={16} />}
                    Postuler pour l'échange
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-40 text-center glass-card bg-white rounded-[40px] flex flex-col items-center">
              <Repeat size={48} className="text-slate-200 mb-6" />
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest italic">Aucune offre pour le moment</h3>
            </div>
          )}
        </>
      ) : (
        /* MY SWAPS MANAGEMENT */
        <div className="space-y-8">
          {myOffers.length > 0 ? (
            myOffers.map(offer => (
              <div key={offer.id} className="glass-card bg-white overflow-hidden border-slate-100 shadow-xl">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-black text-sncb-blue italic">Tour {String(offer.duty_data?.code)}</span>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${offer.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                      {offer.status === 'active' ? 'En ligne' : 'En attente TS'}
                    </span>
                  </div>
                  <button onClick={() => handleDeleteOffer(offer.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
                
                <div className="p-6">
                   <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Demandes reçues ({offer.swap_requests?.length || 0})</h5>
                   <div className="space-y-3">
                     {offer.swap_requests && offer.swap_requests.length > 0 ? (
                       offer.swap_requests.map((req: any) => (
                         <div key={req.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center font-bold text-slate-400">{String(req.requester_name?.[0] || 'A')}</div>
                               <div>
                                 <p className="text-xs font-black text-slate-800">{String(req.requester_name)}</p>
                                 <p className="text-[9px] font-bold text-slate-400 uppercase">Postulé le {new Date(req.created_at).toLocaleDateString()}</p>
                               </div>
                            </div>
                            {req.status === 'pending' ? (
                              <button 
                                onClick={() => handleAcceptRequest(offer.id, req.id)}
                                disabled={!!actionLoading}
                                className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 flex items-center gap-2"
                              >
                                {actionLoading === req.id ? <Loader2 className="animate-spin" size={14} /> : <UserCheck size={14} />}
                                Accepter
                              </button>
                            ) : (
                              <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${req.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-red-400'}`}>
                                {req.status === 'accepted' ? 'Validé' : 'Refusé'}
                              </span>
                            )}
                         </div>
                       ))
                     ) : (
                       <p className="text-[10px] text-slate-400 italic">Aucune demande pour le moment...</p>
                     )}
                   </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl">
              <p className="text-slate-400 font-bold text-xs">Vous n'avez encore rien publié.</p>
            </div>
          )}
        </div>
      )}

      {/* MODALE DE PUBLICATION */}
      {showPublishModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-sncb-blue/60 backdrop-blur-xl" onClick={() => setShowPublishModal(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-2xl font-black text-sncb-blue uppercase italic tracking-tighter">Publier un Service</h3>
              <button onClick={() => setShowPublishModal(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400"><X size={24} /></button>
            </div>
            <div className="flex-grow overflow-y-auto p-8 space-y-4">
              {duties.map(duty => (
                <button 
                  key={duty.id} 
                  disabled={publishing}
                  onClick={() => handlePublish(duty)}
                  className="w-full text-left p-6 bg-white border border-slate-100 rounded-3xl hover:border-sncb-blue hover:shadow-xl transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-slate-50 group-hover:bg-blue-50 rounded-2xl flex items-center justify-center font-black text-sncb-blue italic">{String(duty.code)}</div>
                    <div>
                      <p className="text-xl font-black text-slate-900">{String(duty.start_time)} — {String(duty.end_time)}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(duty.date).toLocaleDateString('fr-BE', { day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                  <Plus size={20} className="text-slate-200 group-hover:text-sncb-blue" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
