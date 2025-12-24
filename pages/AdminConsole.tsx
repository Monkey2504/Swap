
import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { runDiagnostic, resetConfig, SQL_SETUP_SCRIPT } from '../lib/supabase';
import { profileService } from '../lib/api';

const AdminConsole: React.FC = () => {
  const { techLogs, addTechLog, user } = useApp();
  const [diag, setDiag] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({ users: 0 });
  const [showSql, setShowSql] = useState(false);

  const performCheck = async () => {
    setIsLoading(true);
    const result = await runDiagnostic();
    setDiag(result);
    
    try {
      const users = await profileService.getAllProfiles();
      setStats({ users: users?.length || 0 });
    } catch (e) {}
    
    setIsLoading(false);
    addTechLog(`Diagnostic: ${result.message}`, result.ok ? 'info' : 'error', 'Admin');
  };

  useEffect(() => {
    performCheck();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-20 text-center bg-premium-dark">
        <div className="glass-card p-12 max-w-lg border-white/5">
           <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🚫</div>
           <h1 className="text-3xl font-black text-white uppercase italic">Espace Réservé</h1>
           <p className="mt-4 font-bold text-slate-500 text-sm">Cet espace est réservé aux initiateurs du projet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn p-6 pb-40 font-inter">
      <div className="glass-card bg-slate-900/40 p-12 border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-purple/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <p className="text-accent-purple font-black text-[10px] uppercase tracking-[0.4em]">Gestion Communautaire</p>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Console <span className="text-accent-purple">Technique</span></h2>
        </div>
        <div className="flex flex-wrap gap-4 relative z-10 mt-10">
          <button onClick={performCheck} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase border border-white/10 transition-all">Lancer Diagnostic</button>
          <button onClick={() => setShowSql(!showSql)} className="px-8 py-4 bg-accent-purple hover:bg-accent-purple-light rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg">Structure SQL</button>
          <button onClick={resetConfig} className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-[10px] uppercase transition-all">Nettoyer Cache</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          <div className="glass-card p-10 border-white/5 shadow-xl">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8 italic">Statut Serveur</h3>
            <div className={`p-6 rounded-3xl mb-8 ${diag?.ok ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <div className="flex items-center gap-4 mb-3">
                <span className={`w-3 h-3 rounded-full ${diag?.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                <p className="font-black uppercase text-[11px]">{diag?.type}</p>
              </div>
              <p className="text-xs font-bold leading-relaxed">{diag?.message}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card bg-slate-900/60 rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-[500px] border-white/5">
            <div className="p-6 bg-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Logs de maintenance</span>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 space-y-4 font-mono text-[11px]">
              {techLogs.length === 0 ? (
                <p className="text-slate-600 italic">En attente d'événements...</p>
              ) : (
                techLogs.map((log, i) => (
                  <div key={i} className="flex gap-4 border-b border-white/5 pb-3">
                    <span className="text-slate-600 shrink-0">{log.timestamp.split('T')[1].substring(0, 8)}</span>
                    <span className={`shrink-0 font-black uppercase px-2 rounded ${
                      log.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminConsole;
