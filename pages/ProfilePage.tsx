
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { SNCB_DEPOTS, MOCK_STAFF_LIST, generateId, NOMENCLATURE, Station } from '../constants';
import { parseRosterDocument } from '../services/geminiService';
import { Duty } from '../types';

interface ProfilePageProps {
  onNext: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNext }) => {
  const { user, updateUserProfile, saveProfileToDB, publishDutyForSwap, isSaving, rgpdConsent, setRgpdConsent, setError } = useApp();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualDuty, setManualDuty] = useState<Partial<Duty>>({
    code: '',
    type: 'IC',
    startTime: '',
    endTime: '',
    destinations: [],
    date: new Date().toISOString().split('T')[0]
  });
  const [stationInput, setStationInput] = useState('');
  const [suggestedStations, setSuggestedStations] = useState<Station[]>([]);

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
        position: staff.position,
        sncbId: staff.sncbId,
        depot: staff.depot
      });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rgpdConsent) {
      setError("Consentement requis.");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = (reader.result as string).split(',')[1];
      try {
        const services = await parseRosterDocument(base64String, file.type);
        if (services.length > 0) {
          const newDuties: Duty[] = services.map(s => ({
            id: generateId('duty'),
            code: s.code,
            type: 'IC',
            relations: [],
            compositions: [],
            destinations: Array.from(new Set(s.tasks.map(t => t.location))),
            startTime: s.startTime,
            endTime: s.endTime,
            date: new Date().toISOString().split('T')[0]
          }));
          updateUserProfile({ currentDuties: [...user.currentDuties, ...newDuties] });
        }
      } catch (err) {
        setError("Analyse échouée.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn p-4 pb-24">
      <div className="bg-white rounded-[40px] shadow-2xl border-4 border-gray-50 p-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-sncb-blue italic tracking-tighter uppercase">01. Mon Profil ACT</h3>
            <div className="space-y-5">
              <select
                className="w-full p-5 rounded-3xl border-4 border-gray-50 focus:border-sncb-blue outline-none font-black text-sncb-blue bg-gray-50"
                value={selectedStaff}
                onChange={handleStaffSelect}
              >
                <option value="">Sélectionner votre nom (Cadre Personnel)...</option>
                {MOCK_STAFF_LIST.map(s => (
                  <option key={s.id} value={`${s.firstName} ${s.lastName}`}>{s.lastName.toUpperCase()} {s.firstName}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-5">
                <div className="p-6 bg-sncb-blue text-white rounded-[32px] shadow-xl">
                  <span className="text-[10px] font-black opacity-60 uppercase">Dépôt</span>
                  <p className="text-xl font-black">{user.depot || '--'}</p>
                </div>
                <div className="p-6 bg-sncb-yellow text-sncb-blue rounded-[32px] shadow-xl">
                  <span className="text-[10px] font-black opacity-60 uppercase">Série</span>
                  <p className="text-xl font-black">{user.series || '--'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <h3 className="text-2xl font-black text-sncb-blue italic tracking-tighter uppercase">02. Import Planning</h3>
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden group">
              <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" id="roster-upload" />
              <label htmlFor="roster-upload" className="inline-flex items-center bg-sncb-yellow text-sncb-blue font-black px-8 py-4 rounded-2xl cursor-pointer hover:scale-105 transition-all">
                {isUploading ? "ANALYSE..." : "SCANNER ROSTER (PDF)"}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t-4 border-gray-50 pt-10">
          <h3 className="text-2xl font-black text-sncb-blue uppercase mb-8">Mes services enregistrés</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {user.currentDuties.map(duty => (
              <div key={duty.id} className="bg-gray-50 p-6 rounded-[32px] border-2 border-transparent hover:border-sncb-blue transition-all flex justify-between items-center">
                <div>
                  <p className="font-black text-sncb-blue text-xl">{duty.code}</p>
                  <p className="text-[10px] font-bold text-gray-400">{duty.startTime} - {duty.endTime}</p>
                </div>
                <button 
                  onClick={() => publishDutyForSwap(duty.id)}
                  className="bg-white text-sncb-blue border-2 border-sncb-blue font-black px-4 py-2 rounded-xl text-[10px] uppercase hover:bg-sncb-blue hover:text-white transition-all"
                >
                  Proposer au SWAP 🔄
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="fixed bottom-10 right-10 flex space-x-4">
        <button onClick={onNext} className="bg-sncb-blue text-white font-black px-12 py-5 rounded-[28px] shadow-2xl hover:-translate-y-1 transition-all uppercase tracking-widest italic border-b-8 border-black/20">
          Suivant (Match IA) ➔
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
