const KEY = 'ambulance_profile';
const empty = { abha: '', aarogyasri: '', contacts: [] };

export function getProfile() {
  try {
    return { ...empty, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return empty;
  }
}

export function saveProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

// 12345678901234 -> 12-3456-7890-1234
export function formatAbha(value = '') {
  const d = value.replace(/\D/g, '');
  return [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10), d.slice(10, 14)]
    .filter(Boolean)
    .join('-');
}