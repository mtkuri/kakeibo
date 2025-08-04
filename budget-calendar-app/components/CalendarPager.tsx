import React, { useRef, useEffect } from 'react';
import { View, FlatList, Dimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import CustomCalendar from './CustomCalendar';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface Props {
  onSelectDate: (date: string) => void;
  onMonthChange: (year: number, month: number) => void;
  calendarHeight: number;
  events: { [date: string]: { title: string; memo?: string }[] };
}

export default function CalendarPager({ onSelectDate, onMonthChange, calendarHeight, events }: Props) {
  const today = new Date();
  const months = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 12 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index: 12, animated: false });
      // 初期月の表示も親に伝える
      const d = months[12];
      onMonthChange(d.year, d.month);
    }, 10);
    // eslint-disable-next-line
  }, []);

  // スワイプで月が変わったときに親へ通知
  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_WIDTH);
    const d = months[index];
    if (d) onMonthChange(d.year, d.month);
  };

  return (
    <FlatList
      ref={flatListRef}
      data={months}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => `${item.year}-${item.month}`}
      renderItem={({ item }) => (
        <View style={{ width: SCREEN_WIDTH }}>
          <CustomCalendar
            year={item.year}
            month={item.month}
            onSelectDate={onSelectDate}
            calendarHeight={calendarHeight}
            events={events}
          />
        </View>
      )}
      getItemLayout={(_, index) => ({
        length: SCREEN_WIDTH,
        offset: SCREEN_WIDTH * index,
        index,
      })}
      onMomentumScrollEnd={handleMomentumScrollEnd}
    />
  );
}