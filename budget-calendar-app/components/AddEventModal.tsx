import React, { useState } from 'react';
import { View, Text, TextInput, Button, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import dayjs from 'dayjs';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (event: { title: string; date: string; memo?: string }) => void;
  defaultDate: string;
}

export default function AddEventModal({ visible, onClose, onSubmit, defaultDate }: Props) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate);
  const [memo, setMemo] = useState('');

  const handleAdd = () => {
    if (title.trim() === '') return;
    onSubmit({ title, date, memo });
    setTitle('');
    setMemo('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>イベント追加</Text>
          <TextInput
            style={styles.input}
            placeholder="イベント名"
            value={title}
            onChangeText={setTitle}
          />
          {/* 日付選択もカスタム可能、今はテキストで */}
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={date}
            onChangeText={setDate}
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            placeholder="メモ（任意）"
            value={memo}
            onChangeText={setMemo}
            multiline
          />
          <View style={styles.row}>
            <TouchableOpacity onPress={onClose} style={[styles.button, { backgroundColor: '#aaa' }]}>
              <Text style={{ color: '#fff' }}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAdd} style={[styles.button, { backgroundColor: '#4CAF50' }]}>
              <Text style={{ color: '#fff' }}>追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  modalContent: {
    width: '88%', backgroundColor: '#222', borderRadius: 16, padding: 20
  },
  title: { fontSize: 20, color: '#fff', fontWeight: 'bold', marginBottom: 18 },
  input: {
    backgroundColor: '#333', color: '#fff', borderRadius: 8, marginVertical: 6, padding: 8
  },
  row: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  button: { padding: 10, borderRadius: 8, marginLeft: 8 }
});
