/* The tracker's warm comic look: mango-to-coral page, butter-yellow panels, teal actions, plum header,
   thick ink outlines and hard offset shadows. One deliberate look, no dark variant. */
export const C = {
  ink: '#2B1D2E',
  inkSoft: '#5B3F4A',
  deep: '#170D1A',
  night: '#3A2840',
  night2: '#4C3654',
  onNight: '#F6DCC8',
  pageTop: '#F5A862',
  pageBot: '#EC8160',
  panel: '#FFD36E',
  panel2: '#FFE3A0',
  paper: '#FFF2D2',
  sky: '#4DBDAC',
  skyDeep: '#1F7F72',
  berry: '#EE6A7E',
  pink: '#F7A3AE',
  calm: '#80D4A7',
  mid: '#FFC24B',
  high: '#F37468',
  dangerInk: '#8A1C30',
};

export const F = {
  display: 'Fredoka_600SemiBold',
  displayBold: 'Fredoka_700Bold',
  body: 'Nunito_400Regular',
  bodySemi: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_800ExtraBold',
  hand: 'PatrickHand_400Regular',
};

export const levelColor = (l: 'calm' | 'mid' | 'high' | 'none') =>
  l === 'calm' ? C.calm : l === 'mid' ? C.mid : l === 'high' ? C.high : C.paper;
