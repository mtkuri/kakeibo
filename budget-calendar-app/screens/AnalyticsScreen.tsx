import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="stats-chart" size={48} color="#4CAF50" style={{ marginBottom: 24 }} />
      <Text style={styles.title}>アナリティクス</Text>
      <Text style={styles.subtitle}>ここに月別・カテゴリ別などの支出やイベントのグラフを表示できます。</Text>
      <View style={styles.box}>
        <Text style={styles.boxText}>🟢 今月の支出合計: ¥12,300</Text>
        <Text style={styles.boxText}>🔵 カテゴリ「食費」: ¥6,500</Text>
        <Text style={styles.boxText}>🟣 イベント数: 5件</Text>
      </View>
      <Text style={styles.placeholder}>（今後グラフや円グラフなどもここに追加できます）</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: '#222' },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 20, textAlign: 'center' },
  box: { backgroundColor: '#f4f4f4', borderRadius: 12, padding: 16, width: '100%', marginBottom: 20 },
  boxText: { fontSize: 16, marginVertical: 2 },
  placeholder: { color: '#aaa', fontSize: 13, textAlign: 'center' },
});
