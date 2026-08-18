import Dexie from 'dexie';

export const db = new Dexie('KishanKataDB');

db.version(2).stores({
  crops: '++id, _id, name, season, area, status',
  laborers: '++id, _id, name, contact, baseRate, advanceBalance',
  transactions: '++id, _id, cropId, type, category, amount, mode, date, laborerId',
  attendances: '++id, _id, laborerId, cropId, date, status, isSettled',
  settlements: '++id, _id, laborerId, settlementDate, netPaid'
});
