
export interface StationMapping {
  code: string;
  fr: string;
  nl: string;
}

/**
 * Dictionnaire complet extrait de la "Liste des abréviations télégraphes"
 */
export const STATION_CODES: StationMapping[] = [
  { code: 'FLT', fr: 'Aalter', nl: 'Aalter' },
  { code: 'FRST', fr: 'Aarschot', nl: 'Aarschot' },
  { code: 'FAR', fr: 'Aarsele', nl: 'Aarsele' },
  { code: 'FXA', fr: 'Acren', nl: 'Akren' },
  { code: 'FAO', fr: 'Aiseau', nl: 'Aiseau' },
  { code: 'FAK', fr: 'Alken', nl: 'Alken' },
  { code: 'FLS', fr: 'Alost', nl: 'Aalst' },
  { code: 'FLSK', fr: 'Alost-Kerrebroek', nl: 'Aalst-Kerrebroek' },
  { code: 'NM', fr: 'Amay', nl: 'Amay' },
  { code: 'NA', fr: 'Ampsin', nl: 'Ampsin' },
  { code: 'NDN', fr: 'Andenne', nl: 'Andenne' },
  { code: 'ANDL', fr: 'Anderlecht', nl: 'Anderlecht' },
  { code: 'MGR', fr: 'Angleur', nl: 'Angleur' },
  { code: 'ANS', fr: 'Ans', nl: 'Ans' },
  { code: 'MNS', fr: 'Anseremme', nl: 'Anseremme' },
  { code: 'FNT', fr: 'Antoing', nl: 'Antoing' },
  { code: 'FCV', fr: 'Anvers-Berchem', nl: 'Antwerpen-Berchem' },
  { code: 'FN', fr: 'Anvers-Central', nl: 'Antwerpen-Centraal' },
  { code: 'FNKL', fr: 'Anvers-Kiel', nl: 'Antwerpen-Kiel' },
  { code: 'LB', fr: 'Anvers-Luchtbal', nl: 'Antwerpen-Luchtbal' },
  { code: 'FNND', fr: 'Anvers-Nord', nl: 'Antwerpen-Noord' },
  { code: 'AND', fr: 'Anvers-Noorderdokken', nl: 'Antwerpen-Noorderdokken' },
  { code: 'FNZG', fr: 'Anvers-Schijnpoort', nl: 'Antwerpen-Schijnpoort' },
  { code: 'FNZD', fr: 'Anvers-Sud', nl: 'Antwerpen-Zuid' },
  { code: 'FAN', fr: 'Anzegem', nl: 'Anzegem' },
  { code: 'MAP', fr: 'Appelterre', nl: 'Appelterre' },
  { code: 'GAR', fr: 'Arcades', nl: 'Arcaden' },
  { code: 'ARC', fr: 'Archennes', nl: 'Eerken' },
  { code: 'LL', fr: 'Arlon', nl: 'Aarlen' },
  { code: 'LAS', fr: 'Asse', nl: 'Asse' },
  { code: 'MAS', fr: 'Assesse', nl: 'Assesse' },
  { code: 'ATH', fr: 'Ath', nl: 'Aat' },
  { code: 'MH', fr: 'Athus', nl: 'Athus' },
  { code: 'MAB', fr: 'Aubange', nl: 'Aubange' },
  { code: 'FVL', fr: 'Auvelais', nl: 'Auvelais' },
  { code: 'FDN', fr: 'Audenarde', nl: 'Oudenaarde' },
  { code: 'AYE', fr: 'Aye', nl: 'Aye' },
  { code: 'MWL', fr: 'Aywaille', nl: 'Aywaille' },
  { code: 'FBMZ', fr: 'Bruxelles-Midi', nl: 'Brussel-Zuid' },
  { code: 'FBN', fr: 'Bruxelles-Nord', nl: 'Brussel-Noord' },
  { code: 'FBCL', fr: 'Bruxelles-Central', nl: 'Brussel-Centraal' },
  { code: 'LX', fr: 'Bruxelles-Luxembourg', nl: 'Brussel-Luxemburg' },
  { code: 'FBSM', fr: 'Bruxelles-Schuman', nl: 'Brussel-Schuman' },
  { code: 'FBNL', fr: 'Bruxelles-Aéroport-Zaventem', nl: 'Brussel-Airport-Zaventem' },
  { code: 'FLG', fr: 'Liège-Guillemins', nl: 'Luik-Guillemins' },
  { code: 'FNR', fr: 'Namur', nl: 'Namen' },
  { code: 'FMS', fr: 'Mons', nl: 'Bergen' },
  { code: 'FCR', fr: 'Charleroi-Central', nl: 'Charleroi-Centraal' },
  { code: 'FOT', fr: 'Ostende', nl: 'Oostende' },
  { code: 'FGSP', fr: 'Gand-Saint-Pierre', nl: 'Gent-Sint-Pieters' },
  { code: 'FLLN', fr: 'Louvain-la-Neuve', nl: 'Louvain-la-Neuve' },
  { code: 'FSD', fr: 'Ostende', nl: 'Oostende' },
  { code: 'LT', fr: 'Ottignies', nl: 'Ottiginies' },
  { code: 'FDM', fr: 'Oudegem', nl: 'Oudegem' }
];

export const getStationName = (code: string): string => {
  const match = STATION_CODES.find(s => s.code === code.toUpperCase());
  return match ? match.fr : code;
};
