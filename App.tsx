
import React, { useState, useEffect, useCallback } from 'react';
import { SNCB_DEPOTS, INITIAL_PREFERENCES, MOCK_USER_DUTIES } from './constants';
import { UserProfile, UserPreference } from './types';
import ProfilePage from './pages/ProfilePage';
import PreferencesPage from './pages/PreferencesPage';
import SwapBoard from './pages/SwapBoard';
import LoginPage from './pages/LoginPage';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Définition des rôles/positions dans les dépôts
type AppPage = 'login' | 'profile' | 'preferences' | 'swaps';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>('login');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreference[]>(INITIAL_PREFERENCES);
  const [showYellowBanner, setShowYellowBanner] = useState(true);

  const handleLoginSuccess = useCallback(async (supabaseUser: any) => {
    try {
      let userProfile: UserProfile;

      // Si on est en mode Supabase réel
      if (supabaseUser.id !== 'local-demo' && isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        userProfile = {
          id: supabaseUser.id,
          sncbId: data?.sncb_id || supabaseUser.user_metadata?.sncbId || '78798800',
          firstName: data?.first_name || supabaseUser.user_metadata?.firstName || 'Agent',
          lastName: data?.last_name || supabaseUser.user_metadata?.lastName || 'SNCB',
          email: supabaseUser.email || '',
          phone: data?.phone || '',
          depot: data?.depot || SNCB_DEPOTS[0].name,
          series: data?.series || '702',
          position: data?.position || '12',
          isFloating: data?.is_floating || false,
          currentDuties: data?.duties || MOCK_USER_DUTIES
        };

        // Charger aussi les préférences
        const { data: prefData } = await supabase
          .from('preferences')
          .select('*')
          .eq('user_id', supabaseUser.id);
        
        if (prefData && prefData.length > 0) {
          // Transformer les données DB vers notre type UserPreference
          const mappedPrefs = prefData.map((p: any) => ({
            id: p.id,
            category: p.category,
            label: p.label,
            value: p.value,
            level: p.level,
            priority: p.priority
          }));
          setPreferences(mappedPrefs);
        }
      } else {
        // Mode Démo local
        userProfile = {
          id: 'local-demo',
          sncbId: '78798800',
          firstName: 'Jean',
          lastName: 'Démo',
          email: 'demo@sncb.be',
          phone: '',
          depot: SNCB_DEPOTS[0].name,
          series: '702',
          position: '12',
          isFloating: false,
          currentDuties: MOCK_USER_DUTIES
        };
      }

      setUser(userProfile);
      setCurrentPage('profile');
    } catch (error) {
      console.error('Erreur profil:', error);
      // Fallback démo
      handleLocalLogin();
    }
  }, []);

  const handleLocalLogin = useCallback(() => {
    const demoSession = { user: { id: 'local-demo', email: 'demo@sncb.be' } } as Session;
    setSession(demoSession);
    handleLoginSuccess(demoSession.user);
  }, [handleLoginSuccess]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) handleLoginSuccess(session.user);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleLoginSuccess(session.user);
      } else {
        setUser(null);
        setCurrentPage('login');
      }
    });

    return () => subscription.unsubscribe();
  }, [handleLoginSuccess]);

  const handleLogout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setCurrentPage('login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold tracking-widest">CHARGEMENT...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {showYellowBanner && (
        <div className="bg-yellow-400 text-black py-2 px-4 text-sm font-medium flex justify-between items-center shadow-md z-50">
          <p>✨ Soutenez l'appli ! Contribution annuelle de 5€ suggérée. <span className="underline cursor-pointer ml-2">Contribuer</span></p>
          <button onClick={() => setShowYellowBanner(false)} className="ml-4 font-bold">✕</button>
        </div>
      )}

      {session && (
        <nav className="bg-blue-900 text-white shadow-lg sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-blue-900 font-bold">S</div>
              <span className="font-bold text-xl tracking-tight">SWAP SNCB</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <button onClick={() => setCurrentPage('profile')} className={`px-3 py-2 rounded-lg transition ${currentPage === 'profile' ? 'bg-blue-800 text-yellow-400' : 'hover:bg-blue-800'}`}>Profil</button>
              <button onClick={() => setCurrentPage('preferences')} className={`px-3 py-2 rounded-lg transition ${currentPage === 'preferences' ? 'bg-blue-800 text-yellow-400' : 'hover:bg-blue-800'}`}>Préférences</button>
              <button onClick={() => setCurrentPage('swaps')} className={`px-3 py-2 rounded-lg transition ${currentPage === 'swaps' ? 'bg-blue-800 text-yellow-400' : 'hover:bg-blue-800'}`}>Échanges</button>
              <button onClick={handleLogout} className="px-3 py-2 text-red-300 hover:text-red-100 transition">Quitter</button>
            </div>
          </div>
        </nav>
      )}

      <main className="flex-grow">
        {!session ? (
          <LoginPage onLocalLogin={handleLocalLogin} />
        ) : (
          <div className="p-4 md:p-8">
            {currentPage === 'profile' && <ProfilePage user={user!} setUser={setUser} onNext={() => setCurrentPage('preferences')} />}
            {currentPage === 'preferences' && <PreferencesPage preferences={preferences} setPreferences={setPreferences} onNext={() => setCurrentPage('swaps')} />}
            {currentPage === 'swaps' && <SwapBoard user={user!} preferences={preferences} />}
          </div>
        )}
      </main>

      {session && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-3 text-xs font-bold text-gray-500 z-40">
           <button onClick={() => setCurrentPage('profile')} className={`flex flex-col items-center space-y-1 ${currentPage === 'profile' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">👤</span>
             <span>Profil</span>
           </button>
           <button onClick={() => setCurrentPage('preferences')} className={`flex flex-col items-center space-y-1 ${currentPage === 'preferences' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">🎯</span>
             <span>Préf.</span>
           </button>
           <button onClick={() => setCurrentPage('swaps')} className={`flex flex-col items-center space-y-1 ${currentPage === 'swaps' ? 'text-blue-900' : ''}`}>
             <span className="text-xl">🔀</span>
             <span>Swap</span>
           </button>
        </div>
      )}
    </div>
  );
};

export default App;
