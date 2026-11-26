// Solmara Skies — tuning constants and course layout.
// One place for every number the rest of the game reads, so a tweak
// here rebalances the whole flight without touching the mechanics.

export const VIEW = {
  width: 1280,
  height: 720,
  planeScreenY: 430,
  planeScreenX: 640,
  worldScale: 0.9,
};

export const COURSE = {
  length: 14200, // world units from the coast to the end of the runway
  runwayStart: 13000,
  runwayEnd: 14200,
  runwayHalfWidth: 95,
  timeLimitSeconds: 300,
  startAltitude: 520,
  startSpeed: 185,
};

// The flight is split into four legs. Each leg is a band of world
// distance with its own ground look, obstacle density and objective.
export const LEGS = [
  { name: 'Coast', from: 0, to: 2600, kind: 'sea', rings: 3, stars: 3 },
  { name: 'Farmland', from: 2600, to: 5400, kind: 'fields', rings: 3, stars: 4 },
  { name: 'City', from: 5400, to: 8300, kind: 'city', rings: 4, stars: 3 },
  { name: 'High Pass', from: 8300, to: 11200, kind: 'mountains', rings: 4, stars: 4 },
  { name: 'Valley Run', from: 11200, to: 13000, kind: 'valley', rings: 3, stars: 2 },
];

export const PLANE = {
  maxBankDegrees: 42,
  turnRate: 46, // degrees of heading change per second at full stick
  climbRate: 150, // feet per second at full pull
  minAltitude: 40,
  maxAltitude: 1400,
  minSpeed: 110,
  maxSpeed: 320,
  boostSpeed: 380,
  cruiseFuelBurn: 0.55, // fuel points per second at cruise throttle
  boostFuelBurn: 1.6,
  hitRadius: 26,
};

export const SCORING = {
  ring: 100,
  star: 50,
  nearMiss: 25,
  landingBase: 500,
  timeBonusPerSecond: 5,
  fuelBonusPerPoint: 2,
  ringStreakBonus: 25,
};

export const PALETTE = {
  skyTop: '#2f7fd0',
  skyMid: '#7cc0ee',
  skyLow: '#cfeefb',
  sun: '#ffd94d',
  sunCore: '#fff3b0',
  seaDeep: '#1466a8',
  seaShallow: '#2f8fc9',
  sand: '#e8d29a',
  fieldGreen: '#7fae56',
  fieldDark: '#6b9a48',
  fieldGold: '#c9b458',
  cityGround: '#9aa0a8',
  building: '#5d6b7d',
  buildingLit: '#ffd27a',
  rock: '#8a7f74',
  rockDark: '#6e635a',
  snow: '#f4f8ff',
  runway: '#3c4148',
  runwayMark: '#f5f5f5',
  grass: '#79a854',
  ring: '#ffc93c',
  ringGlow: 'rgba(255, 201, 60, 0.45)',
  star: '#ffe066',
  hudPanel: 'rgba(8, 24, 44, 0.72)',
  hudText: '#eaf6ff',
  hudAccent: '#ffd94d',
  danger: '#ff5a4e',
  good: '#7dff9a',
};
