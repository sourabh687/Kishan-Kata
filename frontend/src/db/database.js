import Dexie from 'dexie';

export const db = new Dexie('KishanKataDB');

db.version(1).stores({
  crops: '++id, name, season, area, status',
  laborers: '++id, name, contact, baseRate, advanceBalance',
  transactions: '++id, cropId, type, category, amount, mode, date, laborerId'
});
