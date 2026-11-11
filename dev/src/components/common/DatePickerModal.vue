<script setup>
import { ref, computed, watch } from 'vue';
import { useOverlayStore } from '../../stores/useOverlayStore.js';
import AppIcon from './AppIcon.vue';

const overlayStore = useOverlayStore();
const state = overlayStore.datePicker;

const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
const now = new Date();
const todayStr = now.toLocaleDateString('sv-SE');

const currentYear = ref(now.getFullYear());
const currentMonth = ref(now.getMonth());

watch(() => state.open, (isOpen) => {
  if (isOpen) {
    const base = state.selectedDateStr ? new Date(`${state.selectedDateStr}T00:00:00`) : new Date();
    currentYear.value = isNaN(base.getFullYear()) ? now.getFullYear() : base.getFullYear();
    currentMonth.value = isNaN(base.getMonth()) ? now.getMonth() : base.getMonth();
  }
});

const formatYMD = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const calendarCells = computed(() => {
  const y = currentYear.value, m = currentMonth.value;
  const firstDayIndex = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrevMonth = new Date(y, m, 0).getDate();
  const cells = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevM = m - 1 < 0 ? 11 : m - 1;
    const prevY = m - 1 < 0 ? y - 1 : y;
    cells.push({ day: dayNum, dateStr: formatYMD(prevY, prevM, dayNum), isCurrentMonth: false });
  }
  for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
    cells.push({ day: dayNum, dateStr: formatYMD(y, m, dayNum), isCurrentMonth: true });
  }
  const remaining = cells.length <= 35 ? 35 - cells.length : 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const nextM = m + 1 > 11 ? 0 : m + 1;
    const nextY = m + 1 > 11 ? y + 1 : y;
    cells.push({ day: i, dateStr: formatYMD(nextY, nextM, i), isCurrentMonth: false });
  }
  return cells;
});

function changeMonth(delta) {
  const nextM = currentMonth.value + delta;
  if (nextM < 0) { currentMonth.value = 11; currentYear.value -= 1; }
  else if (nextM > 11) { currentMonth.value = 0; currentYear.value += 1; }
  else currentMonth.value = nextM;
}

function pickDate(dateStr) {
  overlayStore.closeDatePicker();
  if (typeof state.onSelect === 'function') state.onSelect(dateStr);
}
</script>

<template>
  <Teleport to="#modal-root">
    <div v-if="state.open" @click.self="overlayStore.closeDatePicker()" class="fixed inset-0 bg-slate-900/40 z-40 flex items-center justify-center p-4">
      <div class="bg-white w-full max-w-xs rounded-xl border border-slate-200 p-4 shadow-sm">
        <div class="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
          <h3 class="text-sm font-bold text-slate-900">{{ state.title }}</h3>
          <button type="button" @click="overlayStore.closeDatePicker()" class="p-1.5 text-slate-400 hover:text-slate-700 rounded-md">
            <AppIcon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div class="flex items-center justify-between mb-3 px-1">
          <button type="button" @click="changeMonth(-1)" class="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="text-xs font-bold text-slate-900">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</div>
          <button type="button" @click="changeMonth(1)" class="p-1.5 rounded hover:bg-slate-100 text-slate-600">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        <div class="grid grid-cols-7 mb-1">
          <div v-for="d in weekDays" :key="d" class="text-center text-xs font-semibold text-slate-400 py-1">{{ d }}</div>
        </div>

        <div class="grid grid-cols-7 gap-y-1 mb-3">
          <button
            v-for="cell in calendarCells"
            :key="cell.dateStr"
            type="button"
            @click="pickDate(cell.dateStr)"
            :class="[
              'h-9 w-full flex items-center justify-center text-xs rounded',
              !cell.isCurrentMonth ? 'text-slate-300 hover:bg-slate-100'
                : cell.dateStr === state.selectedDateStr ? 'bg-slate-900 text-white font-bold hover:bg-slate-800'
                : cell.dateStr === todayStr ? 'border border-slate-900 text-slate-900 font-semibold'
                : 'text-slate-700 hover:bg-slate-100'
            ]"
          >
            {{ cell.day }}
          </button>
        </div>

        <div class="pt-2 border-t border-slate-100 flex justify-between items-center">
          <button type="button" @click="pickDate(todayStr)" class="text-xs font-semibold text-slate-900 underline">選擇今天 ({{ todayStr }})</button>
          <span class="text-[11px] text-slate-400">點擊日期直接確認</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>
