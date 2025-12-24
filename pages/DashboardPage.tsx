import React from 'react';
import { Duty } from '../types';

interface DashboardPageProps {
  duties: Duty[];
}

const DashboardPage: React.FC<DashboardPageProps> = ({ duties }) => {
  return (
    <div className="space-y-10">
      <div className="glass-card p-10 flex items-center justify-between relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-purple/5 to-transparent"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black italic mb-2">
            Tableau de Bord<br />SwapACT
          </h2>
          <p className="text-slate-400 text-sm max-w-md">
            Bienvenue sur votre espace personnel. Consultez vos services et échanges.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Mes Services
          </h3>
          <div className="space-y-4">
            {duties.length > 0 ? (
              duties.slice(0, 3).map(duty => (
                <div key={duty.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                  <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center text-accent-purple font-black">
                    {duty.code}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{duty.startTime} - {duty.endTime}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-black">
                      {new Date(duty.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">Aucun service importé.</p>
            )}
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Statistiques
          </h3>
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-2xl font-black text-accent-purple">{duties.length}</p>
              <p className="text-xs text-slate-400">Services ce mois</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-8 space-y-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">
            Actions Rapides
          </h3>
          <div className="space-y-3">
            <button className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-medium transition-colors">
              Importer mon planning
            </button>
            <button className="w-full py-3 bg-accent-purple/10 hover:bg-accent-purple/20 text-accent-purple rounded-xl text-sm font-medium transition-colors">
              Chercher un échange
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;