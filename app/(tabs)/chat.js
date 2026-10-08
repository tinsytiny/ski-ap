import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Screen, Card, Body, Btn, Label } from '../../src/ui/ui';
import { useTheme } from '../../src/ui/theme';
import MountainTabs from '../../src/components/MountainTabs';
import { MOUNTAINS } from '../../src/core/mountains';
import { MAX_COMMENT_LENGTH } from '../../src/core/moderation';
import { useApp } from '../../src/state/AppState';

export default function Chat() {
  const t = useTheme();
  const app = useApp();
  const { user, signIn, mountainId, setMountainId, visibleComments, post, report, block, banStatus, SKIP_LOCATION } = app;
  const sel = MOUNTAINS.find((m) => m.id === mountainId) ?? MOUNTAINS[0];
  const [text, setText] = useState('');
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const r = await post(sel, text);
      setMsg(r.message);
      if (r.status === 'posted' || r.status === 'held') setText('');
    } catch (e) { console.warn('post failed', e?.message); setMsg('Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };
  const list = visibleComments(sel.id);
  return (
    <Screen title="Chat" subtitle={`Conditions chat · ${sel.name}`}>
      <MountainTabs mountains={MOUNTAINS.filter((m) => m.phase <= app.PHASE || app.seasons.inSeason.includes(m))} selected={sel.id} onSelect={setMountainId} date={new Date()} />
      <Card>
        <Label>Rules</Label>
        <Body>Be kind. No links, contact details, safety claims or abuse. Reading needs no sign-in or location. To post you must sign in and be within 5 km of the mountain (your location is checked, not stored). Bad content that gets through can lead to a 24 hour chat ban.</Body>
        {!user ? <View style={{ marginTop: 10 }}><Btn title="Sign in to post (sample)" onPress={signIn} /></View> : (
          <View style={{ marginTop: 10 }}>
            {banStatus.state !== 'ok' ? <Body style={{ color: t.bad }}>{banStatus.state === 'banned' ? 'Chat is paused on your account for 24 hours.' : 'Chat is off on your account until a moderator reviews it.'}</Body> : null}
            <TextInput value={text} onChangeText={setText} multiline maxLength={MAX_COMMENT_LENGTH + 20} placeholder="Write a comment" placeholderTextColor={t.sub}
              accessibilityLabel="Comment" style={{ minHeight: 72, borderWidth: 1, borderColor: t.border, borderRadius: 12, padding: 10, color: t.text, textAlignVertical: 'top' }} />
            <Text style={{ color: t.sub, fontSize: 12, textAlign: 'right' }}>{text.length} / {MAX_COMMENT_LENGTH}</Text>
            <Btn title={busy ? 'Posting…' : 'Post'} onPress={submit} disabled={busy || !text.trim()} />
            {msg ? <Text accessibilityLiveRegion="polite" style={{ color: t.text, marginTop: 8 }}>{msg}</Text> : null}
            {SKIP_LOCATION ? <Text style={{ color: t.warn, fontSize: 12, marginTop: 6 }}>DEV: location check bypassed.</Text> : null}
          </View>
        )}
      </Card>
      {list.length === 0 ? <Body style={{ color: t.sub }}>No comments yet.</Body> : list.map((c) => (
        <Card key={c.id}>
          <Text style={{ color: t.sub, fontSize: 12 }}>{c.author}{c.sample ? ' · Sample data' : ''}</Text>
          <Body style={{ marginVertical: 6 }}>{c.text}</Body>
          {c.authorId !== user?.id ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Btn title="Report" kind="ghost" onPress={() => { report(c.id, c.authorId); setMsg('Thanks, reported.'); }} />
              <Btn title="Block" kind="ghost" onPress={() => { block(c.authorId); setMsg('User blocked.'); }} />
            </View>
          ) : null}
        </Card>
      ))}
      {__DEV__ && user ? (
        <Card><Label>Dev tools</Label>
          <Btn title="Simulate: my comment was removed" kind="ghost" onPress={app.simulateRemoval} />
          <Btn title="Reset chat bans" kind="ghost" onPress={app.resetBans} style={{ marginTop: 8 }} />
        </Card>
      ) : null}
    </Screen>
  );
}
