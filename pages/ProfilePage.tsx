
import React, { useState } from 'react';
import { UserProfile, Duty } from '../types';
import { SNCB_DEPOTS, MOCK_STAFF_LIST } from '../constants';
import { parseRosterDocument } from '../services/geminiService';

interface ProfilePageProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onNext: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser, onNext }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [extractedDuties, setExtractedDuties] = useState<Partial<Duty>[]>([]);

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fullName = e.target.value;
    setSelectedStaff(fullName);
    const staff = MOCK_STAFF_LIST.find(s => `${s.firstName} ${s.lastName}` === fullName);
    if (staff) {
      setUser(prev => prev ? { 
        ...prev, 
        firstName: staff.firstName, 
        lastName: staff.lastName,
        series: staff.series,
        position: staff.position
      } : null);
    }
  };

  const handleManualSeriesChange = (field: 'series' | 'position', value: string) => {
    setUser(prev => prev ? { ...prev, [field]: value } : null);
    setShowConflict(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setExtractedDuties([]); // Reset previous extractions
      const mimeType = file.type;
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const newDuties = await parseRosterDocument(base64String, mimeType);
          console.log("Extracted Duties from document:", newDuties);
          
          if (newDuties && newDuties.length > 0) {
            setExtractedDuties(newDuties);
            // On met à jour les duties de l'utilisateur avec les nouvelles données
            // Note: On garde les types existants pour la cohérence
            const fullDuties = newDuties.map(d => ({
              ...d,
              id: `ext_${Math.random().toString(36).substr(2, 9)}`,
              type: 'IC' // Par défaut, l'utilisateur pourra affiner en page suivante
            } as Duty));
            
            setUser(prev => prev ? { ...prev, currentDuties: fullDuties } : null);
          } else {
            alert("Aucun service n'a pu être extrait. Vérifiez que le document est bien un roster SNCB.");
          }
        } catch (err) {
          alert("Erreur lors de l'analyse du document.");
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center">
          <span className="mr-2">👤</span> Édition du Profil
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">Choisir mon nom dans le cadre</label>
              <select
                className="w-full p-3 rounded-xl border-gray-200 border focus:ring-2 focus:ring-blue-500 outline-none"
                value={selectedStaff}
                onChange={handleStaffSelect}
              >
                <option value="">Sélectionnez votre nom...</option>
                {MOCK_STAFF_LIST.map(s => (
                  <option key={`${s.firstName}${s.lastName}`} value={`${s.firstName} ${s.lastName}`}>
                    {s.lastName} {s.firstName}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide mb-4">Informations de Service</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Dépôt d'attache</label>
                  <select
                    className="w-full p-2.5 rounded-lg border-gray-200 border focus:ring-2 focus:ring-blue-500"
                    value={user.depot}
                    onChange={(e) => setUser(prev => prev ? { ...prev, depot: e.target.value } : null)}
                  >
                    {SNCB_DEPOTS.map(d => <option key={d.code} value={d.name}>{d.name}</option>)}
                  </select>
                </div>

                <div className="flex space-x-4">
                  <div className="flex-grow">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Série</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border-gray-200 border"
                      value={user.series}
                      onChange={(e) => handleManualSeriesChange('series', e.target.value)}
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Place</label>
                    <input
                      type="text"
                      className="w-full p-2.5 rounded-lg border-gray-200 border"
                      value={user.position}
                      onChange={(e) => handleManualSeriesChange('position', e.target.value)}
                    />
                  </div>
                </div>

                {showConflict && (
                  <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg text-xs font-medium border border-yellow-200 flex items-start animate-bounce">
                    <span className="mr-2">⚠️</span>
                    <div>
                      <p className="font-bold">Données différentes du fichier cadre.</p>
                      <p>Voulez-vous confirmer ce changement ? Le fichier source sera actualisé.</p>
                      <button 
                        onClick={() => setShowConflict(false)} 
                        className="mt-2 bg-yellow-600 text-white px-3 py-1 rounded-md font-bold"
                      >
                        Confirmer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-gray-200">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center">
                <span className="mr-2">📄</span> Actualisation Planning IA
              </h3>
              <p className="text-sm text-gray-500 mb-4">Uploadez votre roster <strong>(PDF, JPG ou PNG)</strong> pour une mise à jour instantanée.</p>
              
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">Choisir un fichier</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                  />
                </label>
                {isUploading && (
                  <div className="flex items-center space-x-2 text-blue-600 p-2 bg-blue-50 rounded-lg">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold">Analyse Intelligence Artificielle en cours...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Zone de prévisualisation des données extraites */}
            {extractedDuties.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm animate-slide-up">
                <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase text-gray-400">Services identifiés ({extractedDuties.length})</span>
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">Vérifié par Gemini</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-gray-50">
                  {extractedDuties.map((duty, idx) => (
                    <div key={idx} className="p-3 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-black text-blue-900 text-sm">#{duty.code}</span>
                        <span className="text-[10px] font-bold text-gray-500">{duty.startTime} - {duty.endTime}</span>
                      </div>
                      <div className="flex items-center text-[10px] text-gray-400 italic">
                        <span className="mr-1">📍</span>
                        <span className="truncate">{duty.destinations?.join(' ➔ ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 border rounded-xl bg-white">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">Liens utiles</p>
              <a href="#" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                🔗 Consulter mon Roster Web (SNCB)
              </a>
            </div>

            <button
              onClick={onNext}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-800 shadow-xl transform transition hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isUploading}
            >
              Étape Suivante
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
