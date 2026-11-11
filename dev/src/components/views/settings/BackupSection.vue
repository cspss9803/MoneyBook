<script setup>
import { ref } from 'vue';
import { useLedgerStore } from '../../../stores/useLedgerStore.js';
import { useOverlayStore } from '../../../stores/useOverlayStore.js';
import { exportDatabase } from '../../../db/exportDatabase.js';
import { importDatabase } from '../../../db/importDatabase.js';

const ledgerStore = useLedgerStore();
const overlayStore = useOverlayStore();
const msg = ref('');
const isOk = ref(true);

function handleExport() {
  overlayStore.openConfirm({
    id: 'export-backup-confirm',
    title: '匯出備份檔案',
    message: '確定要將目前的記帳資料匯出並下載為 JSON 備份檔嗎？',
    confirmText: '確定匯出',
    onConfirm: () => exportDatabase()
  });
}

async function handleImport(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    await importDatabase(await file.text());
    await ledgerStore.refreshData();
    isOk.value = true;
    msg.value = '資料匯入成功！';
  } catch (err) {
    isOk.value = false;
    msg.value = `匯入失敗：${err.message}`;
  } finally {
    e.target.value = '';
  }
}
</script>

<template>
  <section class="bg-white border border-slate-200 rounded-md p-4 space-y-3">
    <div>
      <h2 class="text-sm font-bold text-slate-900">資料備份與還原</h2>
      <p class="text-xs text-slate-500 mt-0.5">所有資料儲存於瀏覽器 IndexedDB，可匯出為 JSON 檔案保存或還原。</p>
    </div>
    <div class="grid grid-cols-2 gap-3 pt-1">
      <button type="button" @click="handleExport" class="py-2.5 px-3 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 bg-white active:bg-slate-100">
        匯出備份 (JSON)
      </button>
      <label class="py-2.5 px-3 bg-slate-900 text-white rounded-md text-xs font-semibold text-center cursor-pointer active:bg-slate-700">
        匯入還原 (JSON)
        <input type="file" accept="application/json,.json" @change="handleImport" class="hidden" />
      </label>
    </div>
    <div v-if="msg" :class="['text-xs', isOk ? 'text-emerald-600' : 'text-rose-600']">{{ msg }}</div>
  </section>
</template>
