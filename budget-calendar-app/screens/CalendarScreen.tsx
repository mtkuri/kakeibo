import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Easing,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import CalendarPager from '../components/CalendarPager';
import AddEventModal from '../components/AddEventModal';
import SwipeableDetailView from '../components/SwipeableDetailView';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import storageService from '../services/storageService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80;
const HEADER_HEIGHT = 52;
const STATUS_BAR_HEIGHT = Platform.OS === 'ios' ? 47 : 24;

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear());
  const [displayMonth, setDisplayMonth] = useState(new Date().getMonth() + 1);

  // カレンダー表示に使える最大高さ
  const AVAILABLE_HEIGHT =
    SCREEN_HEIGHT - TAB_BAR_HEIGHT - HEADER_HEIGHT - STATUS_BAR_HEIGHT;

  // Animated.Value と、その値を受け取る state
  const calendarHeight = useRef(new Animated.Value(AVAILABLE_HEIGHT)).current;
  const [heightValue, setHeightValue] = useState<number>(AVAILABLE_HEIGHT);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [events, setEvents] = useState<{
    [date: string]: { id: string; title: string; memo?: string }[];
  }>({});
  const [isLoading, setIsLoading] = useState(true);

  // ─── 初回読み込み ─────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const loaded = await storageService.loadEvents();
        const formatted: typeof events = {};
        Object.keys(loaded).forEach((date) => {
          formatted[date] = loaded[date].map((ev) => ({
            id: ev.id,
            title: ev.title,
            memo: ev.memo,
          }));
        });
        setEvents(formatted);
      } catch (e) {
        console.error(e);
        Alert.alert('エラー', 'データの読み込みに失敗しました');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // ─── カレンダー高さの変化を heightValue に反映 ─────────────────────────
  useEffect(() => {
    const id = calendarHeight.addListener(({ value }) => setHeightValue(value));
    return () => calendarHeight.removeListener(id);
  }, [calendarHeight]);

  // ─── ロード中はここで早期リターン ─────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.container,
            { justifyContent: 'center', alignItems: 'center' },
          ]}
        >
          <Text style={{ color: '#fff' }}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── イベント追加 ─────────────────────────
  const handleAddEvent = async (event: {
    title: string;
    date: string;
    memo?: string;
  }) => {
    try {
      const newEv = await storageService.addEvent(event);
      setEvents((prev) => ({
        ...prev,
        [event.date]: [
          ...(prev[event.date] || []),
          { id: newEv.id, title: newEv.title, memo: newEv.memo },
        ],
      }));
    } catch (e) {
      console.error(e);
      Alert.alert('エラー', 'イベントの追加に失敗しました');
    }
  };

  // ─── イベント削除 ─────────────────────────
  const handleDeleteEvent = (date: string, index: number) => {
    Alert.alert('イベントを削除', 'このイベントを削除しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '削除',
        style: 'destructive',
        onPress: async () => {
          try {
            const target = events[date][index];
            await storageService.deleteEvent(date, target.id);
            setEvents((prev) => {
              const copy = { ...prev };
              copy[date] = copy[date].filter((_, i) => i !== index);
              if (copy[date].length === 0) delete copy[date];
              return copy;
            });
          } catch (e) {
            console.error(e);
            Alert.alert('エラー', 'イベントの削除に失敗しました');
          }
        },
      },
    ]);
  };

  // ─── 日付選択でカレンダーを縮小／復元 ─────────────────────────
  const handleDateSelect = (date: string) => {
    if (date === selectedDate) {
      // 再タップ or 閉じる時は元の高さに
      Animated.timing(calendarHeight, {
        toValue: AVAILABLE_HEIGHT,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
      setSelectedDate(null);
    } else {
      // 新規選択時は 40% 高さまで縮める
      Animated.timing(calendarHeight, {
        toValue: AVAILABLE_HEIGHT * 0.4,
        duration: 300,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
      setSelectedDate(date);
    }
  };

  // ─── スワイプダウンで詳細ビューを閉じたときも高さを復元 ─────────────────────────
  const handleCloseDetail = () => {
    Animated.timing(calendarHeight, {
      toValue: AVAILABLE_HEIGHT,
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
    setSelectedDate(null);
  };

  // ─── 月変更 ─────────────────────────
  const handleMonthChange = (year: number, month: number) => {
    setDisplayYear(year);
    setDisplayMonth(month);
  };

  const selectedDateEvents = selectedDate ? events[selectedDate] || [] : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.monthText}>
          {displayYear}年{displayMonth}月
        </Text>
        <TouchableOpacity onPress={() => setAddModalVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* カレンダー */}
      <Animated.View style={{ height: calendarHeight }}>
        <CalendarPager
          onSelectDate={handleDateSelect}
          onMonthChange={handleMonthChange}
          calendarHeight={heightValue}
          events={events}
        />
      </Animated.View>

      {/* 詳細スワイプビュー */}
      <SwipeableDetailView
        visible={!!selectedDate}
        onClose={handleCloseDetail}
      >
        {selectedDate && (
          <>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>
                {dayjs(selectedDate).format('M月D日')}の予定
              </Text>
              <TouchableOpacity
                onPress={() => setAddModalVisible(true)}
                style={styles.addButton}
              >
                <Ionicons name="add" size={24} color="#4CAF50" />
              </TouchableOpacity>
            </View>

            {selectedDateEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color="#666" />
                <Text style={styles.emptyText}>予定がありません</Text>
                <TouchableOpacity
                  onPress={() => setAddModalVisible(true)}
                  style={styles.emptyAddButton}
                >
                  <Text style={styles.emptyAddButtonText}>予定を追加</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.eventList}
                showsVerticalScrollIndicator={false}
              >
                {selectedDateEvents.map((ev, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.eventItem}
                    onLongPress={() => handleDeleteEvent(selectedDate, idx)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.eventContent}>
                      <Text style={styles.eventTitle}>{ev.title}</Text>
                      {ev.memo && (
                        <Text style={styles.eventMemo}>{ev.memo}</Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}
      </SwipeableDetailView>

      {/* イベント追加モーダル */}
      <AddEventModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddEvent}
        defaultDate={selectedDate || dayjs().format('YYYY-MM-DD')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#111' },
  container: { flex: 1, backgroundColor: '#111' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderColor: '#222',
    height: HEADER_HEIGHT,
  },
  monthText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { padding: 4 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  emptyText: { fontSize: 16, color: '#666', marginTop: 12, marginBottom: 20 },
  emptyAddButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyAddButtonText: { color: '#fff', fontWeight: '600' },
  eventList: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
  eventItem: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventContent: { flex: 1, marginRight: 12 },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eventMemo: { fontSize: 14, color: '#aaa', lineHeight: 20 },
});
