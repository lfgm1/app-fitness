// Ícones de perfil (gerado a partir dos desenhos da identidade visual, pasta "08 Icones de perfil").
// Cada ícone é um SVG completo: círculo escuro com contorno Pena e o desenho dentro.

export type AvatarIcon = { id: string; name: string; group: 'objetos' | 'pessoas'; xml: string };

export const AVATAR_ICONS: AvatarIcon[] = [
  {
    id: 'halter',
    name: 'Halter',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><rect x="-20" y="-3" width="40" height="6" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-27" y="-15" width="9" height="30" rx="2" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="18" y="-15" width="9" height="30" rx="2" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-33" y="-9" width="6" height="18" rx="2" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="27" y="-9" width="6" height="18" rx="2" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'kettlebell',
    name: 'Kettlebell',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-12 -6 L-12 -18 Q-12 -26 0 -26 Q12 -26 12 -18 L12 -6" fill="none" stroke-width="6" stroke="#F4F1E8" stroke-linejoin="round" stroke-linecap="round"/><circle cy="8" r="19" fill="#FF7A45" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-6" y="2" width="12" height="4" rx="2" fill="#20232A"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'anilha',
    name: 'Anilha',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><circle r="26" fill="#2A2D35" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="18" fill="none" stroke="#C6F432" stroke-width="3"/><circle r="7" fill="#20232A" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'biceps',
    name: 'Bíceps',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-24 20 L-24 0 Q-24 -12 -12 -14 L-10 -24 Q-2 -30 4 -24 L2 -14 Q16 -18 22 -4 Q26 12 10 20 Z" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M-6 -2 Q4 -8 12 0" fill="none" stroke="#0E0F12" stroke-width="2.5" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'raio',
    name: 'Raio',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><polygon points="6,-30 -16,4 -1,4 -8,30 16,-6 1,-6" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'foguinho',
    name: 'Foguinho',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M0 -30 Q20 -10 18 8 Q16 26 0 26 Q-16 26 -18 8 Q-18 -6 -8 -14 Q-6 -4 0 -2 Q2 -16 0 -30 Z" fill="#FF7A45" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M0 4 Q9 12 6 20 Q2 25 -4 22 Q-9 16 -3 8 Z" fill="#FFC23D"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'trofeu',
    name: 'Troféu',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-16 -18 Q-26 -18 -24 -9 Q-22 -2 -14 -2" fill="none" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M16 -18 Q26 -18 24 -9 Q22 -2 14 -2" fill="none" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M-16 -24 L16 -24 L14 -4 Q12 8 0 9 Q-12 8 -14 -4 Z" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-4" y="9" width="8" height="9" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-14" y="18" width="28" height="8" rx="2" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'medalha',
    name: 'Medalha',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><polygon points="-16,-30 -4,-30 4,-8 -6,-8" fill="#4CC9F0" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polygon points="16,-30 4,-30 -4,-8 6,-8" fill="#4CC9F0" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cy="10" r="17" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polygon points="0,0 3,7 10,7 4,11 6,18 0,14 -6,18 -4,11 -10,7 -3,7" fill="#F4F1E8"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'coracao',
    name: 'Coração',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M0 24 L-24 0 Q-32 -12 -22 -22 Q-10 -30 0 -16 Q10 -30 22 -22 Q32 -12 24 0 Z" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polyline points="-20,-4 -8,-4 -4,-12 2,6 6,-4 20,-4" fill="none" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'cronometro',
    name: 'Cronômetro',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><rect x="-5" y="-30" width="10" height="7" rx="2" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cy="4" r="23" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="0" y1="4" x2="0" y2="-11" stroke="#0E0F12" stroke-width="3" stroke-linecap="round"/><line x1="0" y1="4" x2="10" y2="9" stroke="#FF5C5C" stroke-width="3" stroke-linecap="round"/><circle cy="4" r="3" fill="#0E0F12"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'tenis',
    name: 'Tênis',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-28 4 L-26 -14 Q-18 -16 -14 -10 Q-8 -4 2 -4 Q18 -4 28 4 L28 10 L-28 10 Z" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-28" y="10" width="56" height="8" rx="3" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="-8" y1="-6" x2="-4" y2="2" stroke="#0E0F12" stroke-width="2"/><line x1="0" y1="-5" x2="3" y2="2" stroke="#0E0F12" stroke-width="2"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'garrafa',
    name: 'Garrafa',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><rect x="-6" y="-31" width="12" height="8" rx="2" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-13" y="-23" width="26" height="50" rx="8" fill="#4CC9F0" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-11.5" y="-4" width="23" height="12" fill="#F4F1E8" opacity="0.85"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'shaker',
    name: 'Shaker',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><rect x="-15" y="-30" width="30" height="10" rx="3" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><path d="M-16 -20 L16 -20 L12 27 L-12 27 Z" fill="#A78BFA" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="-13" y1="0" x2="13" y2="0" stroke="#F4F1E8" stroke-width="2"/><line x1="-12" y1="10" x2="12" y2="10" stroke="#F4F1E8" stroke-width="2"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'corda',
    name: 'Corda',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-20 -10 Q-26 30 0 28 Q26 30 20 -10" fill="none" stroke="#FFC23D" stroke-width="4" stroke-linecap="round"/><rect x="-26" y="-30" width="12" height="22" rx="5" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="14" y="-30" width="12" height="22" rx="5" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'banana',
    name: 'Banana',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-24 -12 Q-20 22 14 22 Q26 20 26 14 Q4 16 -8 2 Q-16 -8 -16 -20 Z" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-22" y="-28" width="7" height="9" rx="2" fill="#8B5E34" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'alvo',
    name: 'Alvo',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><circle r="27" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="19" fill="#F4F1E8"/><circle r="11" fill="#FF5C5C"/><circle r="4" fill="#F4F1E8"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'coroa',
    name: 'Coroa',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><polygon points="-26,14 -28,-18 -13,-4 0,-24 13,-4 28,-18 26,14" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><rect x="-26" y="14" width="52" height="9" rx="2" fill="#FFC23D" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="0" cy="2" r="4" fill="#FF5C5C"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'estrela',
    name: 'Estrela',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><polygon points="0,-30 8,-9 30,-9 12,4 19,26 0,13 -19,26 -12,4 -30,-9 -8,-9" fill="#C6F432" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'montanha',
    name: 'Montanha',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><polygon points="-32,24 -8,-14 4,4 12,-6 32,24" fill="#4CC9F0" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><polygon points="-8,-14 -14,-4 -8,-6 -3,-4" fill="#F4F1E8"/><line x1="-8" y1="-14" x2="-8" y2="-32" stroke="#F4F1E8" stroke-width="3" stroke-linecap="round"/><polygon points="-8,-32 6,-27 -8,-22" fill="#C6F432" stroke-width="2" stroke="#F4F1E8" stroke-linejoin="round" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'estiloso',
    name: 'Estiloso',
    group: 'objetos',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><circle r="44" fill="#20232A"/><path d="M-30 -8 L30 -8 L28 0 Q26 14 12 14 Q2 14 0 2 Q-2 14 -12 14 Q-26 14 -28 0 Z" fill="#0E0F12" stroke="#F4F1E8" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><line x1="-18" y1="-2" x2="-10" y2="6" stroke="#C6F432" stroke-width="2.5" stroke-linecap="round"/><line x1="10" y1="-2" x2="18" y2="6" stroke="#C6F432" stroke-width="2.5" stroke-linecap="round"/><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'double-biceps',
    name: 'Double bíceps',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-double-biceps"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-double-biceps)"><path d="M-18 24 L-34 12 L-30 -18" fill="none" stroke="#F4F1E8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M-18 24 L-34 12 L-30 -18" fill="none" stroke="#D9A06B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 24 L34 12 L30 -18" fill="none" stroke="#F4F1E8" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 24 L34 12 L30 -18" fill="none" stroke="#D9A06B" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-31" cy="2" r="7" fill="#D9A06B" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="31" cy="2" r="7" fill="#D9A06B" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-24 46 Q-24 20 0 20 Q24 20 24 46 Z" fill="#C6F432" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="2" r="14" fill="#D9A06B" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-5" cy="0" r="2" fill="#0E0F12"/><circle cx="5" cy="0" r="2" fill="#0E0F12"/><path d="M-6 6 Q0 12 6 6 Z" fill="#0E0F12"/><path d="M-14 -4 Q-14 -14 0 -14 Q14 -14 14 -4 Q6 -9 -14 -4 Z" fill="#3A2416"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'vampiro',
    name: 'Vampiro',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-vampiro"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-vampiro)"><polygon points="-34,34 -24,-12 -8,22" fill="#C0283A" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><polygon points="34,34 24,-12 8,22" fill="#C0283A" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#0E0F12" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-2" r="17" fill="#E9E6F2" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-17 -6 Q-17 -22 0 -22 Q17 -22 17 -6 L8 -12 L0 -3 L-8 -12 Z" fill="#0E0F12"/><circle cx="-6" cy="-1" r="2.5" fill="#FF5C5C"/><circle cx="6" cy="-1" r="2.5" fill="#FF5C5C"/><path d="M-7 7 Q0 10 7 7" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/><polygon points="-5,8 -3,8 -4,13" fill="#F4F1E8"/><polygon points="3,8 5,8 4,13" fill="#F4F1E8"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'luchador',
    name: 'Luchador',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-luchador"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-luchador)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#FFC23D" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-2" r="18" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M0 -20 L4 -10 L0 -6 L-4 -10 Z" fill="#FFC23D"/><ellipse cx="-7" cy="-3" rx="6" ry="4.5" fill="#F4F1E8" stroke="#FFC23D" stroke-width="2"/><ellipse cx="7" cy="-3" rx="6" ry="4.5" fill="#F4F1E8" stroke="#FFC23D" stroke-width="2"/><circle cx="-6" cy="-3" r="2" fill="#0E0F12"/><circle cx="6" cy="-3" r="2" fill="#0E0F12"/><ellipse cy="9" rx="6" ry="4" fill="#D9A06B" stroke="#FFC23D" stroke-width="2"/><path d="M-3 9 L3 9" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'ninja',
    name: 'Ninja',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-ninja"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-ninja)"><path d="M14 -8 L32 -14 M14 -6 L30 -2" stroke="#C6F432" stroke-width="4" stroke-linecap="round"/><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#2A2D35" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-2" r="17" fill="#0E0F12" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="-14" y="-10" width="28" height="10" rx="5" fill="#D9A06B"/><path d="M-10 -5 L-4 -6" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M4 -6 L10 -5" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/><rect x="-17" y="-16" width="34" height="4" fill="#C6F432"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'pirata',
    name: 'Pirata',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-pirata"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-pirata)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="-30" y1="30" x2="30" y2="30" stroke="#FF5C5C" stroke-width="3"/><line x1="-32" y1="38" x2="32" y2="38" stroke="#FF5C5C" stroke-width="3"/><circle cy="-2" r="17" fill="#C68A5A" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-15 8 Q-12 22 0 22 Q12 22 15 8 Q8 12 0 10 Q-8 12 -15 8 Z" fill="#3A2416"/><path d="M-18 -6 Q-18 -22 0 -22 Q18 -22 18 -6 Z" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-12" cy="-14" r="1.5" fill="#F4F1E8"/><circle cx="2" cy="-17" r="1.5" fill="#F4F1E8"/><circle cx="10" cy="-11" r="1.5" fill="#F4F1E8"/><line x1="-16" y1="-8" x2="16" y2="0" stroke="#0E0F12" stroke-width="1.5"/><circle cx="7" cy="-2" r="5" fill="#0E0F12"/><circle cx="-6" cy="-2" r="2" fill="#0E0F12"/><path d="M-5 6 Q0 9 5 6" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'viking',
    name: 'Viking',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-viking"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-viking)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#8B5E34" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="0" r="16" fill="#F2C9A0" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-16 2 Q-18 26 0 28 Q18 26 16 2 Q8 10 0 8 Q-8 10 -16 2 Z" fill="#FF7A45" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-6" cy="-2" r="2" fill="#0E0F12"/><circle cx="6" cy="-2" r="2" fill="#0E0F12"/><path d="M-17 -10 Q-30 -12 -32 -28 Q-24 -20 -16 -18" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M17 -10 Q30 -12 32 -28 Q24 -20 16 -18" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-18 -4 Q-18 -22 0 -22 Q18 -22 18 -4 Z" fill="#9AA0AB" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="0" y1="-22" x2="0" y2="-4" stroke="#F4F1E8" stroke-width="2"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'zumbi',
    name: 'Zumbi',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-zumbi"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-zumbi)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 L20 40 L12 46 L4 38 L-6 46 L-14 38 L-22 46 Z" fill="#4C6EA8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-2" r="17" fill="#8BC34A" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-12 -14 L-2 -12" stroke="#0E0F12" stroke-width="1.5"/><path d="M-10 -16 L-10 -11 M-6 -15 L-6 -10" stroke="#0E0F12" stroke-width="1.5"/><circle cx="-6" cy="-2" r="4" fill="#F4F1E8" stroke="#0E0F12" stroke-width="1.5"/><circle cx="-6" cy="-2" r="1.5" fill="#0E0F12"/><circle cx="7" cy="-1" r="2" fill="#0E0F12"/><path d="M-7 8 L-3 6 L1 9 L5 6 L8 8" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-astronauta"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-astronauta)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="-6" y="28" width="12" height="8" rx="2" fill="#FF5C5C"/><circle cy="-2" r="21" fill="#F4F1E8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><ellipse cy="-1" rx="14" ry="11" fill="#4CC9F0" stroke="#0E0F12" stroke-width="2"/><path d="M-8 -6 Q-6 -9 -2 -9" stroke="#F4F1E8" stroke-width="2.5" fill="none" stroke-linecap="round"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'rabo-de-cavalo',
    name: 'Rabo de cavalo',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-rabo-de-cavalo"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-rabo-de-cavalo)"><path d="M14 -10 Q30 -8 28 14 Q24 4 16 2 Z" fill="#3A2416" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-28 46 Q-28 20 0 20 Q28 20 28 46 Z" fill="#A78BFA" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-1" r="16" fill="#D9A06B" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-16 -2 Q-16 -18 0 -18 Q16 -18 16 -2 Q4 -12 -16 -2 Z" fill="#3A2416"/><rect x="-16" y="-9" width="32" height="4" rx="2" fill="#C6F432"/><circle cx="-6" cy="0" r="2" fill="#0E0F12"/><circle cx="6" cy="0" r="2" fill="#0E0F12"/><path d="M-5 6 Q0 10 5 6" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'fone',
    name: 'Fone no talo',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-fone"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-fone)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#FF7A45" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-6 22 L-4 34 M6 22 L4 34" stroke="#F4F1E8" stroke-width="2"/><circle cy="-1" r="16" fill="#6B4226" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-15 -6 Q-15 -17 0 -17 Q15 -17 15 -6 Q8 -11 -15 -6 Z" fill="#0E0F12"/><path d="M-19 -2 Q-19 -26 0 -26 Q19 -26 19 -2" fill="none" stroke="#C6F432" stroke-width="4"/><rect x="-24" y="-6" width="9" height="13" rx="3" fill="#C6F432" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="15" y="-6" width="9" height="13" rx="3" fill="#C6F432" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-8 -1 Q-6 -3 -4 -1" stroke="#F4F1E8" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M4 -1 Q6 -3 8 -1" stroke="#F4F1E8" stroke-width="2" stroke-linecap="round" fill="none"/><path d="M-5 5 Q0 10 5 5 Z" fill="#F4F1E8"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'super-heroi',
    name: 'Super-herói',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-super-heroi"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-super-heroi)"><path d="M-34 46 L-26 14 L26 14 L34 46 Z" fill="#FF5C5C" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-26 46 Q-26 20 0 20 Q26 20 26 46 Z" fill="#4CC9F0" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><polygon points="0,26 6,32 0,38 -6,32" fill="#FFC23D"/><circle cy="-1" r="16" fill="#F2C9A0" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-15 -5 Q-14 -20 2 -19 Q-2 -24 10 -22 Q16 -18 15 -5 Q4 -12 -15 -5 Z" fill="#0E0F12"/><rect x="-14" y="-5" width="28" height="7" rx="3.5" fill="#C6F432"/><circle cx="-6" cy="-1.5" r="1.8" fill="#0E0F12"/><circle cx="6" cy="-1.5" r="1.8" fill="#0E0F12"/><path d="M-5 7 Q0 10 5 7" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'mumia',
    name: 'Múmia',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-mumia"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-mumia)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#E6DDC8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="-2" r="17" fill="#E6DDC8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-17 -12 L17 -8 M-17 -4 L-10 -3 M10 -3 L17 -2 M-16 6 L16 10 M-12 14 L12 16 M-28 30 L28 26 M-30 38 L30 40" stroke="#B5A88A" stroke-width="2"/><rect x="-13" y="-6" width="26" height="7" fill="#0E0F12"/><circle cx="-6" cy="-2.5" r="2" fill="#FFC23D"/><circle cx="6" cy="-2.5" r="2" fill="#FFC23D"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'cowboy',
    name: 'Cowboy',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-cowboy"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-cowboy)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#4C6EA8" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><polygon points="-8,20 0,30 8,20" fill="#FF5C5C"/><circle cy="0" r="16" fill="#C68A5A" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-6" cy="1" r="2" fill="#0E0F12"/><circle cx="6" cy="1" r="2" fill="#0E0F12"/><path d="M-4 8 Q0 10 6 7" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/><ellipse cy="-10" rx="30" ry="5" fill="#8B5E34" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-14 -10 L-12 -26 Q0 -22 12 -26 L14 -10 Z" fill="#8B5E34" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="-13" y="-15" width="26" height="3" fill="#FFC23D"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'anos-80',
    name: 'Anos 80',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-anos-80"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-anos-80)"><path d="M-28 46 Q-28 20 0 20 Q28 20 28 46 Z" fill="#FFC23D" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-14" cy="-12" r="8" fill="#5A3A22" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="0" cy="-17" r="9" fill="#5A3A22" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="14" cy="-12" r="8" fill="#5A3A22" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-18" cy="0" r="7" fill="#5A3A22" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="18" cy="0" r="7" fill="#5A3A22" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cy="0" r="15" fill="#F2C9A0" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="-16" y="-10" width="32" height="5" fill="#FF5C5C"/><circle cx="-5" cy="0" r="2" fill="#0E0F12"/><circle cx="5" cy="0" r="2" fill="#0E0F12"/><path d="M-9 7 Q-4 4 0 6 Q4 4 9 7 Q4 10 0 8 Q-4 10 -9 7 Z" fill="#5A3A22"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
  {
    id: 'bone',
    name: 'Boné pra trás',
    group: 'pessoas',
    xml: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-46 -46 92 92"><defs><clipPath id="c-bone"><circle r="42"/></clipPath></defs><circle r="44" fill="#20232A"/><g clip-path="url(#c-bone)"><path d="M-32 46 Q-32 20 0 20 Q32 20 32 46 Z" fill="#646A75" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-10 20 Q0 30 10 20" fill="none" stroke="#F4F1E8" stroke-width="2"/><circle cy="0" r="16" fill="#A86B3C" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-14 -8 L-30 -6 L-28 -2 L-15 -3 Z" fill="#0E0F12" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><path d="M-16 -4 Q-16 -20 0 -20 Q16 -20 16 -4 Z" fill="#0E0F12" stroke="#F4F1E8" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><rect x="-14" y="-4" width="12" height="6" rx="2" fill="#0E0F12"/><rect x="2" y="-4" width="12" height="6" rx="2" fill="#0E0F12"/><line x1="-2" y1="-1" x2="2" y2="-1" stroke="#0E0F12" stroke-width="2"/><path d="M-3 8 Q3 11 7 6" stroke="#0E0F12" stroke-width="2" stroke-linecap="round" fill="none"/></g><circle r="44" fill="none" stroke="#F4F1E8" stroke-width="4"/></svg>',
  },
];

export function findAvatarIcon(id: string | null | undefined) {
  return id ? AVATAR_ICONS.find((a) => a.id === id) : undefined;
}
