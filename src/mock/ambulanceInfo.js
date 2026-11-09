// Content for the info sections on the Home screen. Edit freely.

export const facilities = [
  { id: 'stretcher', icon: 'bi-hospital', label: 'Stretcher, scoop and wheelchair' },
  { id: 'vitals', icon: 'bi-heart-pulse', label: 'Instruments to check vitals' },
  { id: 'oxygen', icon: 'bi-lungs', label: 'Oxygen cylinder and mask' },
  { id: 'medicines', icon: 'bi-capsule', label: 'All essential medicines' },
  { id: 'aed', icon: 'bi-lightning-charge', label: 'AED defibrillator' },
];

export const notSupported = [
  { id: 'distance', icon: 'bi-signpost-split', label: 'Transfers outside the district' },
  { id: 'non-medical', icon: 'bi-suitcase2', label: 'Non-medical travel' },
  { id: 'goods', icon: 'bi-box-seam', label: 'Carrying goods or luggage only' },
];

// Demo figures — replace with real numbers from the department
export const stats = {
  total: 42114,
  area: 'across Rajahmundry & East Godavari',
  tiles: [
    { id: 'accidents', value: '5.8k', label: 'Accidents & injuries' },
    { id: 'major', value: '17.7k', label: 'Major emergencies' },
    { id: 'scheduled', value: '18.4k', label: 'Scheduled transfers' },
  ],
};

export const crew = [
  { id: 'emt', icon: 'bi-bandaid-fill', title: 'Paramedic (EMT)', text: 'Gives first aid and care on the way' },
  { id: 'pilot', icon: 'bi-truck-front-fill', title: 'Pilot', text: 'Trained driver for a fast, safe ride' },
  { id: 'assistant', icon: 'bi-person-arms-up', title: 'Duty assistant', text: 'Helps with lifting and moving the patient' },
];
