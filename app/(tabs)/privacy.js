import React, { useState } from 'react';
import { Alert, Linking, Switch, Text, View } from 'react-native';
import { Screen, Card, Body, Btn, Label } from '../../src/ui/ui';
import { useTheme } from '../../src/ui/theme';
import { useApp } from '../../src/state/AppState';
import { registerForPush } from '../../src/native/push';

const LEGAL = [
  ['Privacy Policy', process.env.EXPO_PUBLIC_PRIVACY_URL],
  ['Terms', process.env.EXPO_PUBLIC_TERMS_URL],
  ['Cookies Policy', process.env.EXPO_PUBLIC_COOKIES_URL],
  ['Community Guidelines', process.env.EXPO_PUBLIC_GUIDELINES_URL],
  ['Refund Policy', process.env.EXPO_PUBLIC_REFUND_URL],
];
const ROWS = [['analytics', 'Analytics'], ['marketing', 'Marketing'], ['embeds', 'Third-party embeds (live cams)']];

export default function Privacy() {
  const t = useTheme();
  const { consent, consentSnap, user, signIn, signOut, deleteAccount, summerDemo, setSummerDemo } = useApp();
  const [push, setPush] = useState(false);
  const openLegal = (name, url) => {
    if (!url) { Alert.alert(name, '[PLACEHOLDER] This page has not been published yet. Set its EXPO_PUBLIC_*_URL before launch.'); return; }
    Linking.openURL(url).catch(() => Alert.alert(name, "Couldn't open the link."));
  };
  const togglePush = async (v) => {
    if (!v) { setPush(false); return; }
    const r = await registerForPush();
    setPush(r.ok);
    if (!r.ok) Alert.alert('Notifications', r.reason === 'denied' ? 'Notifications are off in system settings.' : 'Notifications are not available yet (needs an EAS project ID and a build, not Expo Go).');
  };
  const confirmDelete = () => Alert.alert('Delete account?', 'This removes your account and your comments. This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() }]);
  return (
    <Screen title="Privacy" subtitle="Your choices and legal">
      <Card>
        <Label>Cookies and embeds</Label>
        {ROWS.map(([k, label]) => (
          <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
            <Text style={{ color: t.text }}>{label}</Text>
            <Switch value={consentSnap.choices?.[k] === true} onValueChange={(v) => consent.set({ [k]: v })} accessibilityLabel={label} />
          </View>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <Btn title="Accept all" kind="ghost" onPress={() => consent.acceptAll()} />
          <Btn title="Reject all" kind="ghost" onPress={() => consent.rejectAll()} />
        </View>
      </Card>
      <Card>
        <Label>Notifications</Label>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.text }}>Daily conditions alerts</Text>
          <Switch value={push} onValueChange={togglePush} accessibilityLabel="Daily conditions alerts" />
        </View>
      </Card>
      <Card>
        <Label>Account</Label>
        {user ? (<><Body>Signed in (sample sign-in).</Body><View style={{ gap: 8, marginTop: 10 }}><Btn title="Sign out" kind="ghost" onPress={signOut} /><Btn title="Delete account" kind="ghost" onPress={confirmDelete} /></View></>)
          : <><Body>Browsing as a guest. Sign in is only needed to post.</Body><View style={{ marginTop: 10 }}><Btn title="Sign in (sample)" onPress={signIn} /></View></>}
      </Card>
      <Card>
        <Label>Legal</Label>
        <View style={{ gap: 8 }}>{LEGAL.map(([n, u]) => <Btn key={n} title={n} kind="ghost" onPress={() => openLegal(n, u)} />)}</View>
        <Text style={{ color: t.sub, fontSize: 12, marginTop: 8 }}>Support: {process.env.EXPO_PUBLIC_SUPPORT_EMAIL || '[PLACEHOLDER SUPPORT EMAIL]'}</Text>
      </Card>
      <Card>
        <Label>Preview</Label>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: t.text }}>Preview NZ summer (January)</Text>
          <Switch value={summerDemo} onValueChange={setSummerDemo} accessibilityLabel="Preview NZ summer" />
        </View>
      </Card>
    </Screen>
  );
}
