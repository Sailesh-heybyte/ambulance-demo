export const hospitals = [
  { id: 'sri-ganga', name: 'Sri Ganga Emergency & Multispeciality Hospital', lat: 17.0065618, lng: 81.7809945 },
  { id: 'smart', name: 'Smart Emergency Hospitals', lat: 17.0002771, lng: 81.7851625 },
  { id: 'godavari', name: 'Godavari Hospital, Neuro, Cardiac & Emergency', lat: 17.0140471, lng: 81.7800178 },
  { id: 'sai', name: 'SAI Hospitals', lat: 17.0118475, lng: 81.7712929 },
  { id: 'swatantra', name: 'Swatantra Hospital', lat: 17.01437, lng: 81.7775108 },
  { id: 'govt', name: 'Government District Hospital', lat: 17.0197073, lng: 81.7916304 },
];

// Demo bed counts (change these in the hospital portal)
export const defaultBeds = {
  'sri-ganga': { icu: 4, ventilator: 2, trauma: 3, maternity: 0 },
  smart: { icu: 3, ventilator: 2, trauma: 4, maternity: 3 },
  godavari: { icu: 5, ventilator: 3, trauma: 0, maternity: 0 },
  sai: { icu: 6, ventilator: 3, trauma: 2, maternity: 5 },
  swatantra: { icu: 4, ventilator: 2, trauma: 3, maternity: 2 },
  govt: { icu: 2, ventilator: 1, trauma: 5, maternity: 0 },
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