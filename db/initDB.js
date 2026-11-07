import { STORES } from '../config/constants.js';
import { DEFAULT_CATEGORIES } from '../config/defaultCategories.js';
import { getAllRecords } from './getAllRecords.js';
import { addRecord } from './addRecord.js';

export async function initDB() {
    const categories = await getAllRecords(STORES.CATEGORIES);
    if (categories.length === 0) {
        for (const category of DEFAULT_CATEGORIES) {
            await addRecord(STORES.CATEGORIES, category);
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