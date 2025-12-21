
import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { SNCB_DEPOTS, MOCK_STAFF_LIST } from '../constants';
import { parseRosterImage } from '../services/geminiService';

interface ProfilePageProps {
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  onNext: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, setUser, onNext }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');

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
    setShowConflict(true); // User is overriding source data
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const newDuties = await parseRosterImage(base64String);
        console.log("Extracted Duties:", newDuties);
        setIsUploading(false);
        alert("Planning mis à jour via IA (OCR) !");
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
                    {SNCB_DEPOTS.map(d => <option key={d} value={d}>{d}</option>)}
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
                <span className="mr-2">📸</span> Actualisation Planning IA
              </h3>
              <p className="text-sm text-gray-500 mb-4">Uploadez un screenshot de votre roster (Asup0/Zsup0) pour une mise à jour instantanée.</p>
              
              <div className="space-y-3">
                <label className="block">
                  <span className="sr-only">Choisir une capture d'écran</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-blue-900 file:text-white hover:file:bg-blue-800 cursor-pointer"
                  />
                </label>
                {isUploading && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-bold">Lecture OCR par Gemini...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-xl bg-white">
              <p className="text-xs text-gray-400 font-bold uppercase mb-2">Liens utiles</p>
              <a href="#" className="text-sm text-blue-600 font-medium hover:underline flex items-center">
                🔗 Consulter mon Roster Web (SNCB)
              </a>
            </div>

            <button
              onClick={onNext}
              className="w-full bg-blue-900 text-white font-bold py-4 rounded-2xl hover:bg-blue-800 shadow-xl transform transition hover:-translate-y-1 active:scale-95"
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
