import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Btn, Body, Card, Chip, ChipRow, Label } from '../ui/ui';
import { useTheme } from '../ui/theme';
import { sampleDayReport } from '../api/conditions';
import { useApp } from '../state/AppState';

const DAYS = ['Today', 'Yesterday', '2 days ago'];

export default function DailyReport({ mountain }) {
  const t = useTheme();
  const router = useRouter();
  const { visibleComments, setMountainId } = useApp();
  const [day, setDay] = useState(0);
  const dayMs = 24 * 3600e3;
  const now = Date.now();
  const quotes = visibleComments(mountain.id).filter((c) => { const age = now - new Date(c.at).getTime(); return age >= day * dayMs && age < (day + 1) * dayMs; }).slice(0, 3);
  return (
    <Card>
      <Label>Daily report</Label>
      <ChipRow>{DAYS.map((d, i) => <Chip key={d} title={d} active={day === i} onPress={() => setDay(i)} />)}</ChipRow>
      <Body>{sampleDayReport(day)}</Body>
      <Text style={{ color: t.sub, fontSize: 12, marginTop: 4 }}>Sample data</Text>
      <Text accessibilityRole="header" style={{ color: t.text, fontWeight: '700', marginTop: 14, marginBottom: 6 }}>What people are saying</Text>
      {quotes.length ? quotes.map((c) => <Body key={c.id} style={{ marginBottom: 6 }}>“{c.text}” <Text style={{ color: t.sub, fontSize: 12 }}>{c.author}</Text></Body>) : <Body style={{ color: t.sub }}>No comments for this day yet.</Body>}
      <View style={{ marginTop: 10 }}><Btn title="Join the conversation" kind="ghost" onPress={() => { setMountainId(mountain.id); router.navigate('/chat'); }} /></View>
    </Card>
  );
}
