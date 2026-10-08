import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../state/AppState';
import { useTheme } from '../ui/theme';
import { Btn, Body } from '../ui/ui';

const ROWS = [['analytics', 'Analytics'], ['marketing', 'Marketing'], ['embeds', 'Third-party embeds (live cams)']];

export default function ConsentBanner() {
  const { consent, consentSnap, ready } = useApp();
  const t = useTheme();
  const [manage, setManage] = useState(false);
  const [draft, setDraft] = useState({ analytics: false, marketing: false, embeds: false });
  if (!ready || consentSnap.decided) return null;
  return (
    <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: t.card, borderTopWidth: 1, borderColor: t.border }} accessibilityViewIsModal>
      <View style={{ padding: 16 }}>
        <Text accessibilityRole="header" style={{ color: t.text, fontWeight: '800', fontSize: 16, marginBottom: 6 }}>Your choices</Text>
        <Body style={{ marginBottom: 10 }}>Nothing optional is loaded until you opt in. You can change this any time in the Privacy tab.</Body>
        {manage ? ROWS.map(([k, label]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
            <Text style={{ color: t.text }}>{label}</Text>
            <Switch value={draft[k]} onValueChange={(v) => setDraft((d) => ({ ...d, [k]: v }))} accessibilityLabel={label} />
          </View>
        )) : null}
        <View style={{ gap: 8, marginTop: 8 }}>
          {manage ? <Btn title="Save my choices" onPress={() => consent.set(draft)} /> : <Btn title="Accept all" onPress={() => consent.acceptAll()} />}
          <Btn title="Reject all" kind="ghost" onPress={() => consent.rejectAll()} />
          {!manage ? <Btn title="Manage" kind="ghost" onPress={() => setManage(true)} /> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
