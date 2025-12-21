
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SNCB_DEPOTS, MOCK_STAFF_LIST } from '../constants';
import { parseRosterDocument, ExtractedService } from '../services/geminiService';
import { Duty } from '../types';

interface ProfilePageProps {
  onNext: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNext }) => {
  const { user, updateUserProfile } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [reviewList, setReviewList] = useState<ExtractedService[]>([]);

  if (!user) return null;

  const handleStaffSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fullName = e.target.value;
    setSelectedStaff(fullName);
    const staff = MOCK_STAFF_LIST.find(s => `${s.firstName} ${s.lastName}` === fullName);
    if (staff) {
      updateUserProfile({ 
        firstName: staff.firstName, 
        lastName: staff.lastName,
        series: staff.series,
        position: staff.position
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const services = await parseRosterDocument(base64String, file.type);
        if (services.length > 0) {
          setReviewList(services);
        } else {
          alert("L'IA n'a pas détecté de services valides.");
        }
      } catch (err) {
        alert("Erreur d'analyse IA.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const confirmRoster = () => {
    const finalDuties: Duty[] = reviewList.map((s, idx) => ({
      id: `duty_${idx}_${Date.now()}`,
      code: s.code,
      type: 'IC',
      relations: [],
      compositions: [],
      destinations: Array.from(new Set(s.tasks.map(t => t.location))),
      startTime: s.startTime,
      endTime: s.endTime,
      date: new Date().toISOString().split('T')[0]
    }));
    updateUserProfile({ currentDuties: finalDuties });
    setReviewList([]);
    alert("Planning synchronisé avec votre profil !");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-xl border p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Section 1: Identité */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-blue-900 flex items-center italic">
              <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 not-italic text-sm">1</span>
              MON IDENTITÉ
            </h3>
            
            <div className="space-y-4">
              <select
                className="w-full p-4 rounded-2xl border-2 border-gray-100 focus:border-blue-600 outline-none font-bold bg-gray-50"
                value={selectedStaff}
                onChange={handleStaffSelect}
              >
                <option value="">Sélectionner dans le cadre officiel...</option>
                {MOCK_STAFF_LIST.map(s => (
                  <option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.lastName} {s.firstName}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Série</span>
                  <p className="text-lg font-black text-blue-900">{user.series || '--'}</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <span className="text-[10px] font-black text-blue-400 uppercase">Position</span>
                  <p className="text-lg font-black text-blue-900">{user.position || '--'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Planning */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-blue-900 flex items-center italic">
              <span className="bg-blue-900 text-white w-8 h-8 rounded-lg flex items-center justify-center mr-3 not-italic text-sm">2</span>
              MON ROSTER
            </h3>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="font-black text-xl mb-2">Mise à jour par IA</h4>
                <p className="text-blue-300 text-sm mb-6">Uploadez votre PDF Asup0 ou Zsup0 pour peupler vos services.</p>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="roster-upload"
                />
                <label 
                  htmlFor="roster-upload"
                  className="inline-block bg-yellow-400 text-blue-900 font-black px-8 py-3 rounded-2xl cursor-pointer hover:bg-yellow-300 transition-all active:scale-95 shadow-lg"
                >
                  {isUploading ? 'ANALYSE EN COURS...' : 'CHOISIR LE FICHIER'}
                </label>
              </div>
              <div className="absolute -right-4 -bottom-4 text-8xl opacity-10 transform rotate-12 group-hover:scale-110 transition-transform">🚆</div>
            </div>
          </div>
        </div>

        {/* Revue des services extraits */}
        {reviewList.length > 0 && (
          <div className="mt-12 space-y-6 border-t pt-12 animate-slide-up">
            <div className="flex justify-between items-end">
              <div>
                <h3 className="text-2xl font-black text-blue-900 tracking-tight">Vérification des données</h3>
                <p className="text-gray-500 font-medium">L'IA a détecté {reviewList.length} services. Veuillez vérifier avant de confirmer.</p>
              </div>
              <button 
                onClick={confirmRoster}
                className="bg-green-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-green-700 shadow-xl transition-all"
              >
                CONFIRMER ET ENREGISTRER
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewList.map((service, idx) => (
                <div key={idx} className="border-2 border-gray-100 rounded-3xl p-6 hover:border-blue-200 transition-colors bg-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                      Service {service.code}
                    </span>
                    <span className="text-sm font-black text-gray-400">{service.duration}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">DEP</p>
                      <p className="text-xl font-black text-blue-900">{service.startTime}</p>
                    </div>
                    <div className="px-4 text-gray-200">➔</div>
                    <div className="text-center flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">ARR</p>
                      <p className="text-xl font-black text-blue-900">{service.endTime}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Trajet identifié</p>
                    <div className="flex flex-wrap gap-2">
                      {service.tasks.map((t, i) => (
                        <span key={i} className="text-[10px] bg-gray-50 px-2 py-1 rounded-md font-bold text-gray-600 border border-gray-100">
                          {t.location}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end pr-4">
        <button
          onClick={onNext}
          className="bg-blue-900 text-white font-black px-12 py-5 rounded-2xl hover:bg-blue-800 shadow-2xl transform transition hover:-translate-y-1 active:scale-95 text-lg"
        >
          Accéder aux SWAPS ➔
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
