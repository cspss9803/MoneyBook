import { STORES } from '../config/constants.js';
import { getAllRecords } from './getAllRecords.js';

export async function exportDatabase() {
    const [accounts, categories, transactions] = await Promise.all([
        getAllRecords(STORES.ACCOUNTS),
        getAllRecords(STORES.CATEGORIES),
        getAllRecords(STORES.TRANSACTIONS)
    ]);

    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        data: { accounts, categories, transactions }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);

    link.href = url;
    link.download = `ledger-backup-${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}