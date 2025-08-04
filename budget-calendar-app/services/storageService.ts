import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  EVENTS: '@calendar_events',
  SETTINGS: '@calendar_settings',
  LAST_SYNC: '@calendar_last_sync',
};

export interface Event {
  id: string;
  title: string;
  date: string;
  memo?: string;
  amount?: number;
  category?: string;
  type?: 'income' | 'expense' | 'event';
  createdAt: string;
  updatedAt: string;
  syncStatus?: 'local' | 'synced' | 'pending';
}

class StorageService {
  // イベントの保存
  async saveEvents(events: { [date: string]: Event[] }): Promise<void> {
    try {
      const jsonValue = JSON.stringify(events);
      await AsyncStorage.setItem(STORAGE_KEYS.EVENTS, jsonValue);
    } catch (e) {
      console.error('Error saving events:', e);
      throw e;
    }
  }

  // イベントの読み込み
  async loadEvents(): Promise<{ [date: string]: Event[] }> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.EVENTS);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Error loading events:', e);
      return {};
    }
  }

  // 単一イベントの追加
  async addEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const events = await this.loadEvents();
    const newEvent: Event = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncStatus: 'local',
    };

    if (!events[event.date]) {
      events[event.date] = [];
    }
    events[event.date].push(newEvent);

    await this.saveEvents(events);
    return newEvent;
  }

  // イベントの更新
  async updateEvent(date: string, eventId: string, updates: Partial<Event>): Promise<void> {
    const events = await this.loadEvents();
    if (events[date]) {
      const index = events[date].findIndex(e => e.id === eventId);
      if (index !== -1) {
        events[date][index] = {
          ...events[date][index],
          ...updates,
          updatedAt: new Date().toISOString(),
          syncStatus: 'pending',
        };
        await this.saveEvents(events);
      }
    }
  }

  // イベントの削除
  async deleteEvent(date: string, eventId: string): Promise<void> {
    const events = await this.loadEvents();
    if (events[date]) {
      events[date] = events[date].filter(e => e.id !== eventId);
      if (events[date].length === 0) {
        delete events[date];
      }
      await this.saveEvents(events);
    }
  }

  // 設定の保存・読み込み
  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  }

  async loadSettings(): Promise<any> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return jsonValue != null ? JSON.parse(jsonValue) : {};
    } catch (e) {
      console.error('Error loading settings:', e);
      return {};
    }
  }

  // サーバー同期の準備（将来の実装用）
  async getUnsyncedEvents(): Promise<Event[]> {
    const events = await this.loadEvents();
    const unsyncedEvents: Event[] = [];
    
    Object.values(events).forEach(dateEvents => {
      dateEvents.forEach(event => {
        if (event.syncStatus === 'local' || event.syncStatus === 'pending') {
          unsyncedEvents.push(event);
        }
      });
    });
    
    return unsyncedEvents;
  }

  async markEventsSynced(eventIds: string[]): Promise<void> {
    const events = await this.loadEvents();
    
    Object.keys(events).forEach(date => {
      events[date] = events[date].map(event => {
        if (eventIds.includes(event.id)) {
          return { ...event, syncStatus: 'synced' };
        }
        return event;
      });
    });
    
    await this.saveEvents(events);
  }

  // ストレージのクリア（デバッグ用）
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.EVENTS,
        STORAGE_KEYS.SETTINGS,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
  }
}

export default new StorageService();