import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Event } from './storageService';

// 開発時と本番時でURLを切り替え
const API_BASE_URL = __DEV__ 
  ? 'http://192.168.1.100:3000/api' // あなたのサーバーのローカルIP
  : 'https://your-server.com/api';   // 本番サーバーのURL

class ApiService {
  private api: AxiosInstance;
  
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター（認証トークンの自動付与）
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('@auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター（エラーハンドリング）
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // 認証エラーの場合、トークンをクリアしてログイン画面へ
          await AsyncStorage.removeItem('@auth_token');
          // ここでログイン画面への遷移処理を追加
        }
        return Promise.reject(error);
      }
    );
  }

  // 認証関連
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<{ token: string; user: any }> {
    const response = await this.api.post('/auth/register', { email, password, name });
    return response.data;
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('@auth_token');
    // 必要に応じてサーバーにログアウト通知
  }

  // イベント関連
  async syncEvents(events: Event[]): Promise<{ synced: string[]; failed: string[] }> {
    try {
      const response = await this.api.post('/events/sync', { events });
      return response.data;
    } catch (error) {
      console.error('Sync failed:', error);
      return { synced: [], failed: events.map(e => e.id) };
    }
  }

  async fetchEvents(startDate: string, endDate: string): Promise<Event[]> {
    try {
      const response = await this.api.get('/events', {
        params: { startDate, endDate }
      });
      return response.data.events;
    } catch (error) {
      console.error('Fetch events failed:', error);
      return [];
    }
  }

  async createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    const response = await this.api.post('/events', event);
    return response.data;
  }

  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const response = await this.api.put(`/events/${eventId}`, updates);
    return response.data;
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.api.delete(`/events/${eventId}`);
  }

  // 統計データ取得
  async getAnalytics(year: number, month?: number): Promise<any> {
    const response = await this.api.get('/analytics', {
      params: { year, month }
    });
    return response.data;
  }

  // ヘルスチェック（サーバー接続確認）
  async healthCheck(): Promise<boolean> {
    try {
      await this.api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // オフライン時の処理を考慮した安全なAPI呼び出し
  async safeApiCall<T>(
    apiCall: () => Promise<T>,
    fallback: () => T | Promise<T>
  ): Promise<T> {
    try {
      const isOnline = await this.healthCheck();
      if (isOnline) {
        return await apiCall();
      }
    } catch (error) {
      console.log('API call failed, using fallback:', error);
    }
    return await fallback();
  }
}

export default new ApiService();