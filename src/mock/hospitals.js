export const hospitals = [
  { id: 'care', name: 'Care Hospital, Banjara Hills', distanceKm: 2.4 },
  { id: 'apollo', name: 'Apollo Hospital, Jubilee Hills', distanceKm: 3.8 },
  { id: 'yashoda', name: 'Yashoda Hospital, Somajiguda', distanceKm: 5.1 },
];

// Starting bed counts. The Care Hospital has no maternity beds and Apollo has
// no trauma beds, so you can see the recommendation change.
export const defaultBeds = {
  care: { icu: 4, ventilator: 2, trauma: 3, maternity: 0 },
  apollo: { icu: 6, ventilator: 3, trauma: 0, maternity: 5 },
  yashoda: { icu: 2, ventilator: 1, trauma: 4, maternity: 2 },
};

export const facilityLabels = {
  icu: 'ICU',
  ventilator: 'Ventilator',
  trauma: 'Trauma',
  maternity: 'Maternity',
};

// Which facility each emergency needs
export const neededFacility = {
  accident: 'trauma',
  'chest-pain': 'icu',
  pregnancy: 'maternity',
  breathing: 'ventilator',
  unconscious: 'icu',
  burns: 'trauma',
  'snake-bite': 'icu',
  other: 'icu',
};

// What the ER team should prepare
export const prepNotes = {
  accident: 'Trauma team on standby. Keep X-ray and CT free. Blood bank alerted.',
  'chest-pain': 'Cardiology on call. Keep ECG and defibrillator ready at the door.',
  pregnancy: 'Gynaecologist and labour room ready. Neonatal unit on alert.',
  breathing: 'Oxygen and ventilator ready. Respiratory team on call.',
  unconscious: 'Keep a stretcher at the door. Doctor to check airway and vitals on arrival.',
  burns: 'Burns unit ready. Prepare IV fluids and pain relief.',
  'snake-bite': 'Anti-venom available. Prepare for monitoring in ICU.',
  other: 'Emergency doctor to be at the door for assessment.',
};