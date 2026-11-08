import { STORES } from '../config/constants.js';
import { DEFAULT_CATEGORIES, SYSTEM_CATEGORIES } from '../config/defaultCategories.js';
import { getAllRecords } from './getAllRecords.js';
import { addRecord } from './addRecord.js';
import { updateRecord } from './updateRecord.js';

export async function initDB() {
  const categories = await getAllRecords(STORES.CATEGORIES);
  if (categories.length === 0) {
    for (const category of DEFAULT_CATEGORIES) {
      await addRecord(STORES.CATEGORIES, category);
    }
  } else {
    for (const sysCat of SYSTEM_CATEGORIES) {
      const exists = categories.some((c) => c.id === sysCat.id);
      if (!exists) {
        await updateRecord(STORES.CATEGORIES, sysCat);
      }
    }
  }

  // 自動將先前已建立的股票交割明細升級為對應的系統專用類別
  const transactions = await getAllRecords(STORES.TRANSACTIONS);
  for (const tx of transactions) {
    if (!tx.id.startsWith('tx_st_')) continue;
    let targetCatId = tx.categoryId;

    if (tx.id.endsWith('_1')) {
      targetCatId = tx.type === 'expense' ? 'cat_sys_stock_buy' : 'cat_sys_stock_sell';
    } else if (tx.id.endsWith('_2')) {
      targetCatId = 'cat_sys_stock_fee';
    } else if (tx.id.endsWith('_3')) {
      targetCatId = 'cat_sys_stock_tax';
    }

    if (targetCatId !== tx.categoryId) {
      await updateRecord(STORES.TRANSACTIONS, { ...tx, categoryId: targetCatId });
    }
  }

  const accounts = await getAllRecords(STORES.ACCOUNTS);
  if (accounts.length === 0) {
    await addRecord(STORES.ACCOUNTS, {
      id: 'acc_default_cash',
      name: '錢包現金',
      type: 'cash',
      initialBalance: 0,
      iconType: 'preset',
      iconData: 'wallet',
      createdAt: Date.now()
    });
  }
}