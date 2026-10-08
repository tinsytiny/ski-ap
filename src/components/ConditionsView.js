import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Card, Body, Btn, FadeIn, Stat, Bar, Label } from '../ui/ui';
import { useTheme } from '../ui/theme';
import MountainTabs, { orderBySeason } from './MountainTabs';
import DailyReport from './DailyReport';
import CamPanel from './CamPanel';
import { loadConditions } from '../api/conditions';
import { staleness } from '../core/conditions';
import { inSeason } from '../core/season';
import { useApp } from '../state/AppState';

function Hero({ mountain, report, sample, onRefresh, off }) {
  const t = useTheme();
  const { stale, ageMs } = staleness(report);
  const hrs = ageMs == null ? null : Math.max(0, Math.round(ageMs / 3600e3));
  return (
    <FadeIn>
      <View style={{ borderRadius: 22, padding: 18, marginBottom: 14, backgroundColor: t.hero1, borderWidth: 1, borderColor: t.hero2 }}>
        <Text accessibilityRole="header" style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{mountain.name}</Text>
        <Text style={{ color: '#d6ecff' }}>{mountain.region}</Text>
        {off ? <Text style={{ color: '#fff', marginTop: 8 }}>Off season. Typically open {mountain.season[0]}–{mountain.season[1]} (month numbers). Check the resort for exact dates.</Text> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: stale ? '#fbbf24' : '#4ade80' }} />
          <Text style={{ color: '#fff', fontWeight: '700' }}>{stale ? 'Stale data' : 'Up to date'}</Text>
          <Text style={{ color: '#d6ecff' }}>{hrs == null ? 'No update time' : `Updated ${hrs}h ago`}</Text>
        </View>
        <Text style={{ color: '#d6ecff', fontSize: 12, marginTop: 6 }}>{sample ? 'Sample data, not real conditions. ' : ''}Conditions can change quickly. Check the resort and avalanche advice. Not a safety service.</Text>
        <View style={{ marginTop: 8, alignSelf: 'flex-start' }}><Btn title="Refresh" kind="ghost" onPress={onRefresh} style={{ borderColor: '#fff' }} /></View>
      </View>
    </FadeIn>
  );
}

export default function ConditionsView({ title, subtitle, mountains, banner }) {
  const t = useTheme();
  const { mountainId, setMountainId, summerDemo } = useApp();
  const date = summerDemo ? new Date('2027-01-15T00:00:00Z') : new Date();
  const ordered = orderBySeason(mountains, date);
  const selected = ordered.find((m) => m.id === mountainId) ?? ordered[0];
  const [state, setState] = useState({ status: 'loading' });
  const load = useCallback(async () => {
    if (!selected) return;
    setState({ status: 'loading' });
    try { setState({ status: 'ok', ...(await loadConditions(selected)) }); }
    catch (e) { console.warn('load failed', e?.message); setState({ status: 'error', message: e?.message ?? 'Unknown error' }); }
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [load]);

  return (
    <Screen title={title} subtitle={subtitle}>
      {banner}
      <MountainTabs mountains={mountains} selected={selected?.id} onSelect={setMountainId} date={date} />
      {state.status === 'loading' ? <View style={{ padding: 40 }}><ActivityIndicator accessibilityLabel="Loading conditions" /></View> : null}
      {state.status === 'error' ? (
        <Card><Body>Couldn't load conditions: {state.message}</Body><View style={{ marginTop: 10 }}><Btn title="Try again" onPress={load} /></View></Card>
      ) : null}
      {state.status === 'ok' ? (
        <>
          <Hero mountain={selected} report={state.report} sample={state.sample} onRefresh={load} off={!inSeason(selected, date)} />
          <FadeIn delay={80}><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
            <Stat label="Base (cm)" value={state.report.baseDepthCm} />
            <Stat label="New snow (cm)" value={state.report.newSnowCm} />
            <Stat label="Temp (°C)" value={state.report.temperatureC} />
            <Stat label="Wind (km/h)" value={state.report.windKph} />
          </View></FadeIn>
          <FadeIn delay={140}><Card>
            <Label>Lifts and runs</Label>
            <Bar label="Lifts" open={state.report.liftsOpen} total={state.report.liftsTotal} />
            <Bar label="Runs" open={state.report.runsOpen} total={state.report.runsTotal} />
            <Body>Weather: {state.report.weather ?? 'Unknown'}</Body>
            <Body>Access road: {state.report.accessRoad ?? 'Unknown'}</Body>
          </Card></FadeIn>
          <FadeIn delay={200}><DailyReport mountain={selected} /></FadeIn>
          <FadeIn delay={260}><CamPanel mountain={selected} /></FadeIn>
        </>
      ) : null}
    </Screen>
  );
}
