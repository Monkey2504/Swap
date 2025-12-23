
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
      <div className="min-h-screen flex items-center justify-center p-20 text-center bg-slate-50">
        <div className="sncb-card p-12 max-w-lg">
           <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🚫</div>
           <h1 className="text-3xl font-black text-slate-900 uppercase italic">Accès Refusé</h1>
           <p className="mt-4 font-bold text-slate-500">Identifiant admin@admin requis pour accéder à cette zone.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fadeIn p-6 pb-40 font-inter">
      <div className="sncb-card bg-slate-900 text-white p-12 border-none relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sncb-blue/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative z-10 space-y-2">
          <p className="text-sncb-yellow font-black text-[10px] uppercase tracking-[0.4em]">Maintenance Système</p>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Console <span className="text-sncb-yellow">Superviseur</span></h2>
        </div>
        <div className="flex flex-wrap gap-4 relative z-10 mt-10">
          <button onClick={performCheck} className="px-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase border border-white/10 transition-all">Analyser</button>
          <button onClick={() => setShowSql(!showSql)} className="px-8 py-4 bg-sncb-blue hover:bg-sncb-blue-light rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg">Voir SQL de réparation</button>
          <button onClick={resetConfig} className="px-8 py-4 bg-red-600 hover:bg-red-700 rounded-2xl font-black text-[10px] uppercase transition-all">Reset Cache Local</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          {/* Diagnostic Card */}
          <div className="bg-white rounded-[40px] p-10 sncb-card border-none shadow-xl">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 italic">État Cloud SNCB</h3>
            <div className={`p-6 rounded-3xl mb-8 ${diag?.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
              <div className="flex items-center gap-4 mb-3">
                <span className={`w-3 h-3 rounded-full ${diag?.ok ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
                <p className="font-black uppercase text-[11px]">{diag?.type}</p>
              </div>
              <p className="text-xs font-bold leading-relaxed">{diag?.message}</p>
            </div>
            
            {(diag?.type === 'migration_required' || !diag?.ok) && (
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-200 animate-pulse">
                <p className="text-[10px] font-black text-amber-800 uppercase mb-2">Action Requise :</p>
                <p className="text-[10px] font-bold text-amber-700">La structure de données est obsolète ou le cache Supabase bloque les nouvelles colonnes.</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => {
              navigator.clipboard.writeText(SQL_SETUP_SCRIPT);
              addTechLog("Script SQL copié dans le presse-papier", 'info', 'Admin');
              alert("Script SQL copié !\n\n1. Allez sur votre Dashboard Supabase\n2. SQL Editor\n3. New Query\n4. Collez et cliquez sur RUN");
            }} 
            className="w-full py-7 sncb-button-volume font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-4 group"
          >
            📋 Copier Correctif SQL
          </button>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {showSql && (
            <div className="bg-slate-50 rounded-[48px] p-10 border-2 border-dashed border-sncb-blue animate-fadeIn">
              <h3 className="text-[10px] font-black text-sncb-blue uppercase tracking-widest mb-6">Script SQL Manuel</h3>
              <textarea 
                readOnly 
                className="w-full h-64 bg-white border border-slate-200 rounded-3xl p-6 font-mono text-[10px] text-slate-600 focus:outline-none"
                value={SQL_SETUP_SCRIPT}
              />
              <p className="mt-4 text-[9px] font-bold text-slate-400 uppercase">Copiez ce texte et collez-le dans l'éditeur SQL de Supabase.</p>
            </div>
          )}

          <div className="bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl flex flex-col h-[500px]">
            <div className="p-6 bg-slate-800 flex justify-between items-center">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Flux d'événements techniques</span>
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 space-y-4 font-mono text-[11px]">
              {techLogs.length === 0 ? (
                <p className="text-slate-600 italic">Aucun log récent...</p>
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
