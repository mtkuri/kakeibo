import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
dayjs.extend(weekday);
dayjs.extend(isoWeek);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WEEK_HEADER_HEIGHT = 32;
const weekDays = ['日', '月', '火', '水', '木', '金', '土'];

type Event = { title: string; memo?: string };
type CalendarCell = {
  date: string;
  day: number;
  isThisMonth: boolean;
  isPrevMonth?: boolean;
  isNextMonth?: boolean;
  hasEvents?: boolean;
  eventCount?: number;
};

function generateCalendar(year: number, month: number, events: Record<string, Event[]>) {
  // 月初・月末
  const firstDay = dayjs(`${year}-${month}-01`);
  const startDayOfWeek = firstDay.day(); // 0=日, 1=月, ..., 6=土
  const daysInMonth = firstDay.daysInMonth();

  // 前月の計算
  const prevMonth = firstDay.subtract(1, 'month');
  const daysInPrevMonth = prevMonth.daysInMonth();

  let cells: CalendarCell[] = [];
  // 前月の日付を入れる
  for (let i = 0; i < startDayOfWeek; i++) {
    const dayNum = daysInPrevMonth - startDayOfWeek + i + 1;
    const date = prevMonth.date(dayNum).format('YYYY-MM-DD');
    cells.push({
      date,
      day: dayNum,
      isThisMonth: false,
      isPrevMonth: true,
      hasEvents: events[date] && events[date].length > 0,
      eventCount: events[date]?.length || 0,
    });
  }
  // 今月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = dayjs(`${year}-${month}-${d}`).format('YYYY-MM-DD');
    cells.push({
      date,
      day: d,
      isThisMonth: true,
      hasEvents: events[date] && events[date].length > 0,
      eventCount: events[date]?.length || 0,
    });
  }
  // 次月で埋める
  let nextMonth = firstDay.add(1, 'month');
  let nextMonthDay = 1;
  while (cells.length < 42) {
    const date = nextMonth.date(nextMonthDay).format('YYYY-MM-DD');
    cells.push({
      date,
      day: nextMonthDay,
      isThisMonth: false,
      isNextMonth: true,
      hasEvents: events[date] && events[date].length > 0,
      eventCount: events[date]?.length || 0,
    });
    nextMonthDay++;
  }
  return cells;
}

interface Props {
  year: number;
  month: number;
  onSelectDate: (date: string) => void;
  calendarHeight: number;
  events: { [date: string]: Event[] };
}

export default function CustomCalendar({ year, month, onSelectDate, calendarHeight, events }: Props) {
  const calendarCells = generateCalendar(year, month, events);
  
  // 今日の日付を取得
  const today = dayjs().format('YYYY-MM-DD');

  const CELL_WIDTH = Math.floor(SCREEN_WIDTH / 7);
  // セルの高さを計算（週ヘッダーを引いて、6週間分で割る）
  const CELL_HEIGHT = Math.floor((calendarHeight - WEEK_HEADER_HEIGHT) / 6);

  const handlePressDay = (cell: CalendarCell) => {
    if (!cell.date) return;
    if (!cell.isThisMonth) return; // 前月・次月セルの選択不可ならここでreturn
    onSelectDate(cell.date);
  };

  return (
    <View style={[styles.container, { height: calendarHeight }]}>
      <View style={styles.weekRow}>
        {weekDays.map((w) => (
          <Text key={w} style={styles.weekCell}>{w}</Text>
        ))}
      </View>
      <FlatList
        data={calendarCells}
        numColumns={7}
        scrollEnabled={false}
        keyExtractor={(_, i) => i.toString()}
        contentContainerStyle={{ paddingBottom: 0 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={item.isThisMonth ? 0.7 : 1}
            style={[
              styles.cell,
              {
                width: CELL_WIDTH,
                height: CELL_HEIGHT,
                backgroundColor: item.date === today && item.isThisMonth ? '#1a1a1a' : '#111',
              }
            ]}
            onPress={() => handlePressDay(item)}
            disabled={!item.isThisMonth}
          >
            <View style={styles.cellContent}>
              <Text
                style={[
                  item.isPrevMonth || item.isNextMonth
                    ? styles.cellSubMonth
                    : item.isThisMonth
                    ? styles.cellText
                    : styles.cellEmptyText,
                  item.date === today && item.isThisMonth && styles.todayText
                ]}
              >
                {item.day !== 0 ? item.day : ''}
              </Text>
              {item.hasEvents && item.isThisMonth && (
                <View style={styles.eventIndicatorContainer}>
                  {item.eventCount! <= 3 ? (
                    // 3個以下なら個別のドットを表示
                    <View style={styles.eventDots}>
                      {Array.from({ length: item.eventCount! }).map((_, index) => (
                        <View key={index} style={styles.eventDot} />
                      ))}
                    </View>
                  ) : (
                    // 4個以上なら数字を表示
                    <View style={styles.eventCountBadge}>
                      <Text style={styles.eventCountText}>{item.eventCount}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    width: SCREEN_WIDTH,
    alignSelf: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    backgroundColor: '#222',
    height: WEEK_HEADER_HEIGHT,
  },
  weekCell: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#ccc',
    padding: 4,
    fontSize: 15,
  },
  cell: {
    borderWidth: 0.3,
    borderColor: '#222',
    padding: 4,
  },
  cellContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cellText: { 
    fontSize: 18, 
    color: '#fff', 
    fontWeight: '500',
    marginTop: 2,
  },
  cellEmptyText: { 
    color: '#444', 
    fontSize: 18,
    marginTop: 2,
  },
  cellSubMonth: { 
    color: '#666', 
    fontSize: 16,
    marginTop: 2,
  },
  todayText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  eventIndicatorContainer: {
    position: 'absolute',
    bottom: 4,
    alignItems: 'center',
  },
  eventDots: {
    flexDirection: 'row',
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
  eventCountBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 16,
  },
  eventCountText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});