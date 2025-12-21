
import React, { useState, useEffect } from 'react';
import { UserProfile, UserPreference, SwapOffer } from '../types';
import { matchSwaps } from '../services/geminiService';

interface SwapBoardProps {
  user: UserProfile;
  preferences: UserPreference[];
}

const SwapBoard: React.FC<SwapBoardProps> = ({ user, preferences }) => {
  const [activeTab, setActiveTab] = useState<'suggested' | 'requested'>('suggested');
  const [swaps, setSwaps] = useState<SwapOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Request Form State
  const [newReq, setNewReq] = useState({ date: '', type: 'IC', notes: '' });

  useEffect(() => {
    const fetchAndMatch = async () => {
      setLoading(true);
      const mockPool: SwapOffer[] = [
        {
          id: 's1',
          user: { firstName: 'Marc', lastName: 'L.', sncbId: '785002', series: '702' },
          offeredDuty: {
            id: 'm1', code: '2010', type: 'IC', relations: ['24'], compositions: ['M7'],
            destinations: ['Luxembourg'], startTime: '07:30', endTime: '16:00', date: '2024-05-20'
          },
          matchScore: 0,
          matchReasons: [],
          type: 'suggested'
        },
        {
          id: 's2',
          user: { firstName: 'Sophie', lastName: 'V.', sncbId: '792001', series: '710' },
          offeredDuty: {
            id: 'm2', code: '4005', type: 'Omnibus', relations: ['40'], compositions: ['AM96'],
            destinations: ['Manage'], startTime: '05:00', endTime: '12:30', date: '2024-05-21'
          },
          matchScore: 0,
          matchReasons: [],
          type: 'suggested'
        }
      ];

      const matched = await matchSwaps(preferences, mockPool);
      setSwaps(matched);
      setLoading(false);
    };

    fetchAndMatch();
  }, [preferences]);

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Votre demande a été publiée ! L'IA cherche maintenant des correspondances.");
    setShowModal(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 pb-24 animate-fadeIn">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-blue-900 tracking-tight">Espace Echanges</h2>
          <p className="text-gray-500 mt-1">Géré par l'IA SNCB • Dépôt <span className="text-blue-600 font-bold">{user.depot}</span></p>
        </div>
        <div className="flex bg-white rounded-2xl shadow-sm border p-1 w-full md:w-auto">
          <button
            onClick={() => setActiveTab('suggested')}
            className={`flex-grow md:flex-initial px-8 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'suggested' ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Suggestions IA
          </button>
          <button
            onClick={() => setActiveTab('requested')}
            className={`flex-grow md:flex-initial px-8 py-3 rounded-xl font-bold text-sm transition ${activeTab === 'requested' ? 'bg-blue-900 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            Mes Demandes
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-900 border-t-yellow-400 rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-blue-900 font-bold text-lg animate-pulse">L'IA synchronise les Rosters...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === 'suggested' && swaps.map((swap) => (
            <div key={swap.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-1">
              <div className="bg-blue-900 p-5 text-white relative">
                 <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 text-[10px] font-black px-2 py-1 rounded-full shadow-lg uppercase">
                    {swap.matchScore}% Match
                 </div>
                 <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Service {swap.offeredDuty.type}</p>
                 <h3 className="text-3xl font-black">{swap.offeredDuty.code}</h3>
                 <div className="flex items-center text-xs text-blue-100 mt-2">
                   <span className="bg-blue-800 px-2 py-1 rounded mr-2">Comp: {swap.offeredDuty.compositions[0]}</span>
                   <span className="truncate">{swap.offeredDuty.destinations.join(' ➔ ')}</span>
                 </div>
              </div>

              <div className="p-6 flex-grow space-y-6">
                <div className="flex justify-between items-center bg-gray-50 rounded-2xl p-4">
                   <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Départ</p>
                      <p className="font-black text-blue-900 text-xl">{swap.offeredDuty.startTime}</p>
                   </div>
                   <div className="flex-grow mx-4 relative flex items-center justify-center">
                      <div className="w-full h-[2px] bg-gray-200"></div>
                      <div className="absolute bg-white px-2 text-lg">🚆</div>
                   </div>
                   <div className="text-center">
                      <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Arrivée</p>
                      <p className="font-black text-blue-900 text-xl">{swap.offeredDuty.endTime}</p>
                   </div>
                </div>

                <div className="space-y-2">
                   <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Analyse Gemini Intelligence</p>
                   {swap.matchReasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start text-xs text-gray-600 bg-blue-50/50 p-2 rounded-lg border border-blue-50">
                       <span className="mr-2">🔹</span> {reason}
                    </div>
                   ))}
                </div>

                <div className="flex items-center space-x-3 pt-2 border-t border-gray-100">
                   <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center font-black text-blue-900 text-sm shadow-inner">
                      {swap.user.firstName?.[0]}
                   </div>
                   <div>
                      <p className="text-sm font-bold text-gray-900">{swap.user.firstName} {swap.user.lastName}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Série {swap.user.series} • Pos {swap.user.position}</p>
                   </div>
                   <button className="ml-auto text-blue-600 hover:bg-blue-50 p-2 rounded-full transition">
                     💬
                   </button>
                </div>
              </div>

              <div className="p-6 pt-0">
                 <button className="w-full bg-blue-900 text-white font-bold py-4 rounded-2xl hover:bg-yellow-400 hover:text-blue-900 transition-all shadow-md active:scale-95 flex items-center justify-center space-x-2">
                    <span>Proposer mon service</span>
                    <span className="text-lg">🔄</span>
                 </button>
              </div>
            </div>
          ))}

          {activeTab === 'requested' && (
             <div className="col-span-full bg-blue-50/30 rounded-3xl p-12 text-center border-2 border-dashed border-blue-200">
                <div className="text-6xl mb-6">📝</div>
                <h3 className="text-2xl font-bold text-blue-900">Aucune demande en cours</h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">Publiez une demande pour un jour spécifique si vous ne trouvez pas votre bonheur dans les suggestions.</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="mt-8 bg-blue-900 text-white px-8 py-3 rounded-xl font-bold shadow-xl"
                >
                  + Créer ma première demande
                </button>
             </div>
          )}

          {/* New Request Card */}
          {activeTab === 'suggested' && (
            <div 
              onClick={() => setShowModal(true)}
              className="border-4 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center p-10 text-center bg-gray-50 hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all cursor-pointer group"
            >
               <div className="w-20 h-20 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mb-6 text-blue-600 group-hover:scale-110 transition-transform shadow-inner">+</div>
               <h3 className="text-xl font-black text-gray-800 tracking-tight">Demande Spécifique</h3>
               <p className="text-sm text-gray-400 mt-3 font-medium">L'IA cherchera un match pour un besoin ponctuel.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal for New Request */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="bg-blue-900 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-black">Nouvelle Demande de Swap</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl hover:scale-110 transition">✕</button>
            </div>
            <form onSubmit={handleCreateRequest} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Date du service à échanger</label>
                <input 
                  type="date" 
                  className="w-full p-4 rounded-xl border-gray-200 border focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newReq.date}
                  onChange={e => setNewReq({...newReq, date: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Type de service souhaité</label>
                <select 
                  className="w-full p-4 rounded-xl border-gray-200 border focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newReq.type}
                  onChange={e => setNewReq({...newReq, type: e.target.value})}
                >
                  <option>IC (InterCity)</option>
                  <option>Omnibus / L</option>
                  <option>Peu importe</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Notes pour les collègues</label>
                <textarea 
                  className="w-full p-4 rounded-xl border-gray-200 border focus:ring-2 focus:ring-blue-500 outline-none h-32"
                  placeholder="Ex: Besoin d'échanger pour rdv médical le matin..."
                  value={newReq.notes}
                  onChange={e => setNewReq({...newReq, notes: e.target.value})}
                ></textarea>
              </div>
              <button className="w-full bg-yellow-400 text-blue-900 font-black py-4 rounded-2xl shadow-lg hover:bg-yellow-300 transition-all active:scale-95">
                Publier ma demande
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwapBoard;
