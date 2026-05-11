import { View, Text, Pressable, ScrollView, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useTimesheet } from '@/hooks/use-timesheet';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Январь','Февраль','Март','Апрель','Май','Июнь',
  'Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь',
];
const DOW_LABELS = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const WEEKEND = new Set([5, 6]); // Mon-based index

function fmtHours(seconds: number): string {
  if (seconds === 0) return '';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}м`;
  if (m === 0) return `${h}ч`;
  return `${h}ч${m}м`;
}

function fmtTotal(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} ч ${m > 0 ? `${m} м` : ''}`.trim();
}

/** Build a Mon-based calendar grid — null cells are padding outside the month. */
function buildWeeks(year: number, month: number): (string | null)[][] {
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Mon=0
  const totalDays = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, '0');

  const cells: (string | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= totalDays; d++) {
    cells.push(`${year}-${mm}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function cellStyle(seconds: number, dow: number, isFuture: boolean, isToday: boolean) {
  if (isFuture)        return { bg: '', text: 'text-surface-2' };
  if (WEEKEND.has(dow) && seconds === 0) return { bg: 'bg-surface-1', text: 'text-text-muted' };
  if (seconds === 0)   return { bg: 'bg-surface-2', text: 'text-text-muted' };
  if (seconds < 14400) return { bg: 'bg-green-900',  text: 'text-green-300' }; // < 4 h
  if (seconds < 28800) return { bg: 'bg-green-700',  text: 'text-white'     }; // 4–8 h
  return                      { bg: 'bg-amber-600',  text: 'text-white'     }; // ≥ 8 h
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function TimesheetScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1); // 1-based

  const { data, isLoading, isError, refetch } = useTimesheet(year, month);

  // Map date string → seconds for O(1) lookup
  const dayMap = new Map<string, number>(
    (data?.days ?? []).map((d) => [d.date, d.tracked_seconds]),
  );

  const todayStr = today.toISOString().slice(0, 10);
  const weeks = buildWeeks(year, month);
  const cellW = Math.floor((width - 32 - 6) / 7); // 32px padding, 6px gaps

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  return (
    <View className="flex-1 bg-surface-0" style={{ paddingTop: insets.top }}>

      {/* Header */}
      <View className="flex-row items-center gap-3 px-4 pb-2 pt-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-accent-500">←</Text>
        </Pressable>
        <Text className="flex-1 text-xl font-bold text-text-primary">Мой табель</Text>
      </View>

      {/* Month navigation */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Pressable onPress={prevMonth} className="px-3 py-1">
          <Text className="text-2xl text-text-primary">‹</Text>
        </Pressable>

        <Text className="text-base font-semibold text-text-primary">
          {MONTH_NAMES[month - 1]} {year}
        </Text>

        <Pressable
          onPress={nextMonth}
          disabled={isCurrentMonth}
          className="px-3 py-1"
        >
          <Text className={`text-2xl ${isCurrentMonth ? 'text-surface-2' : 'text-text-primary'}`}>
            ›
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#F59E0B" />
      ) : isError ? (
        <View className="mt-8 items-center">
          <Text className="text-text-muted">Ошибка загрузки</Text>
          <Pressable onPress={() => refetch()} className="mt-3">
            <Text className="text-accent-500">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        >
          {/* Day-of-week headers */}
          <View className="mb-1 flex-row gap-px">
            {DOW_LABELS.map((lbl, i) => (
              <View key={lbl} style={{ width: cellW }} className="items-center">
                <Text className={`text-xs font-medium ${WEEKEND.has(i) ? 'text-text-muted' : 'text-text-muted'}`}>
                  {lbl}
                </Text>
              </View>
            ))}
          </View>

          {/* Week rows */}
          {weeks.map((week, wi) => (
            <View key={wi} className="mb-px flex-row gap-px">
              {week.map((date, di) => {
                if (!date) {
                  return <View key={di} style={{ width: cellW, height: cellW }} />;
                }
                const seconds = dayMap.get(date) ?? 0;
                const isFuture = date > todayStr;
                const isToday = date === todayStr;
                const { bg, text } = cellStyle(seconds, di, isFuture, isToday);
                const dayNum = parseInt(date.slice(8), 10);
                const hrs = fmtHours(seconds);

                return (
                  <View
                    key={date}
                    style={{ width: cellW, height: cellW }}
                    className={`items-center justify-center rounded-lg ${bg} ${isToday ? 'border border-accent-500' : ''}`}
                  >
                    <Text className={`text-[10px] ${isFuture ? 'text-surface-2' : 'text-text-muted'}`}>
                      {dayNum}
                    </Text>
                    {hrs ? (
                      <Text className={`text-[11px] font-semibold leading-tight ${text}`}>
                        {hrs}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}

          {/* Monthly total */}
          <View className="mt-4 rounded-xl bg-surface-1 px-4 py-3">
            <Text className="text-xs uppercase tracking-widest text-text-muted">
              Итого за {MONTH_NAMES[month - 1].toLowerCase()}
            </Text>
            <Text className="mt-1 text-2xl font-bold text-text-primary">
              {data && data.total_tracked_seconds > 0
                ? fmtTotal(data.total_tracked_seconds)
                : '—'}
            </Text>
            {data && data.days.length > 0 && (
              <Text className="mt-0.5 text-xs text-text-muted">
                {data.days.length} {data.days.length === 1 ? 'рабочий день' : 'рабочих дней'}
              </Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
