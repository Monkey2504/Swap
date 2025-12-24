
import React from 'react';
import { Duty } from '../types';
// Fixed: Added missing 'Star' import from lucide-react
import { Calendar, Repeat, Cloud, Plus, MapPin, Search, Star } from 'lucide-react';

interface DashboardPageProps {
  duties: Duty[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties }) => {
  const nextDuty = duties[0];

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
      {/* Hero Section */}
      <div className="glass-card p-10 flex items-center justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent"></div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-4xl font-black italic tracking-tight text-white leading-tight">
            Échanges Recommandés<br />pour Vous
          </h2>
          <p className="text-white/40 text-sm max-w-sm font-medium leading-relaxed">
            Notre IA a analysé 45 nouveaux tours de service. Voici les meilleures opportunités pour votre planning.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-6 bg-white/5 p-6 rounded-[32px] border border-white/10">
          <div className="relative w-24 h-24">
            <div className="match-score-circle w-full h-full">
               <div className="inner-score-bg font-black text-3xl italic">92</div>
            </div>
          </div>
          <div>
            <p className="text-sm font-black italic">Score de Match Global</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Préférences respectées</p>
          </div>
        </div>
      </div>

      {/* Grid d'analyse */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Analyse Instantanée */}
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Analyse Roster Instantanée</h3>
          <div className="bg-white/5 rounded-3xl p-8 border border-dashed border-white/10 flex flex-col items-center justify-center text-center gap-4 group cursor-pointer hover:border-purple-500/50 transition-colors">
            <div className="relative">
              <Cloud size={40} className="text-purple-400" />
              <div className="absolute -top-1 -right-1 bg-white/10 rounded-full p-1 border border-white/20">
                <Plus size={12} />
              </div>
            </div>
            <p className="text-xs text-white/40 font-medium">Déposez votre PDF/Photo ici</p>
          </div>
          <div className="space-y-2">
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
               <div className="h-full w-2/3 bg-purple-500 animate-pulse"></div>
            </div>
            <p className="text-[10px] font-bold text-purple-400 animate-pulse">Scanning...</p>
          </div>
        </div>

        {/* Prochain Service */}
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Votre Prochain Service</h3>
          <div className="space-y-6 pt-4">
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                 <Repeat size={24} className="text-white/40" />
               </div>
               <div>
                 <p className="font-black italic text-lg uppercase tracking-tight">ACT {nextDuty?.code || '702'}</p>
                 <p className="text-sm text-white/60">Bruxelles-Midi</p>
                 <p className="text-xs font-bold text-purple-400 mt-1">Départ: {nextDuty?.startTime || '06:35'}</p>
               </div>
            </div>
          </div>
        </div>

        {/* Offres Populaires */}
        <div className="glass-card p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60">Offres Populaires</h3>
            <Search size={16} className="text-white/30" />
          </div>
          <div className="space-y-4">
             <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400">
                  <Star size={16} fill="currentColor" />
                </div>
                <div>
                   <p className="text-xs font-black italic uppercase">L 802</p>
                   <p className="text-[10px] text-white/40">Est vers Liège</p>
                </div>
             </div>
             <p className="text-[9px] text-white/20 font-medium text-center italic">Basé sur vos types de trains préférés</p>
          </div>
        </div>
      </div>

      {/* Tableau des Échanges */}
      <div className="glass-card p-8 space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black italic uppercase tracking-tight">Tableau d'Échanges Disponibles</h3>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/40 uppercase">Type</div>
            <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/5 text-[10px] font-bold text-white/40 uppercase">Dépôt</div>
          </div>
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white/[0.02] hover:bg-white/[0.05] rounded-3xl border border-white/[0.03] transition-all">
               <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-500/30">
                    <img src={`https://i.pravatar.cc/100?u=${i}`} alt="Avatar" />
                 </div>
                 <div>
                    <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-0.5">Service Proposé</p>
                    <p className="text-sm font-bold italic">ACT 7101 Bruxelles-Midi (14:30 - 22:00)</p>
                 </div>
               </div>
               <div className="flex items-center gap-6">
                 <div className="px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 italic">Match Score: 85</span>
                 </div>
               </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-4">
          <button className="fab-create px-8 py-4 rounded-3xl flex items-center gap-3 font-black text-xs uppercase tracking-[0.2em] hover:scale-105 transition-transform active:scale-95">
             <Plus size={20} />
             Créer une Offre
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
