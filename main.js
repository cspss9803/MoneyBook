import { initDB } from './db/initDB.js';
import { refreshData } from './state/refreshData.js';

async function bootstrap() {
    try {
        await initDB();
        await refreshData();
    } catch (error) {
        console.error('初始化記帳本失敗:', error);
    }
}

bootstrap();