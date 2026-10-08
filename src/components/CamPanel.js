import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Btn, Card, Chip, ChipRow, Label, Body } from '../ui/ui';
import { useTheme } from '../ui/theme';
import { useApp } from '../state/AppState';

// Each cam is a third-party embed: nothing loads without 'embeds' consent.
// Mountains ship with cams: [] until the resort gives written permission.
export default function CamPanel({ mountain }) {
  const t = useTheme();
  const { consent, consentSnap } = useApp();
  const allowed = consentSnap.choices?.embeds === true;
  const pageUrl = mountain.camPageUrl; // [PLACEHOLDER] official cam page, once permitted
  return (
    <Card>
      <Label>Live cams</Label>
      <ChipRow><Chip title="Base area" active onPress={() => {}} /><Chip title="Summit" onPress={() => {}} /></ChipRow>
      <View style={{ aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: t.chip, alignItems: 'center', justifyContent: 'center', padding: 12 }} accessibilityLabel="Live cam area">
        {allowed ? <Body style={{ color: t.sub }}>Cam feed area (placeholder)</Body> : (
          <View style={{ gap: 8, alignItems: 'center' }}>
            <Body style={{ color: t.sub, textAlign: 'center' }}>Cams are third-party embeds and are off until you allow them.</Body>
            <Btn title="Allow embeds" onPress={() => consent.set({ embeds: true })} />
          </View>
        )}
      </View>
      <View style={{ marginTop: 10 }}>
        <Btn title="Open official cam page" kind="ghost" disabled={!pageUrl} onPress={() => pageUrl && Linking.openURL(pageUrl)} />
        {!pageUrl ? <Text style={{ color: t.sub, fontSize: 12, marginTop: 4 }}>[PLACEHOLDER] No official cam page configured yet.</Text> : null}
      </View>
      {/* TODO: use a WebView only for cams the resort has permitted. */}
      <Text style={{ color: t.sub, fontSize: 12, marginTop: 6 }}>Credit: [RESORT]</Text>
    </Card>
  );
}
