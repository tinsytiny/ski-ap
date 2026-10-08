import React, { useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { Screen, Card, Body, Btn, Chip, ChipRow, Dropdown, FadeIn, Label } from '../../src/ui/ui';
import { useTheme } from '../../src/ui/theme';
import MountainTabs from '../../src/components/MountainTabs';
import { MOUNTAINS } from '../../src/core/mountains';
import { SKI_TYPES, WAIST_RANGES_MM, recommend } from '../../src/core/skis';
import { MODELS, RENTAL_GUIDE, SOURCES, TYPE_INFO, searchBuy, searchRent, searchShops, searchSpecs } from '../../src/data/skis';
import { SAMPLE } from '../../src/data/sample';
import { useApp } from '../../src/state/AppState';

const ABILITY = [
  { value: 'any', label: 'Any level', desc: 'Show everything', level: 0 },
  { value: 'beginner', label: 'Beginner', desc: 'Learning the basics', level: 1 },
  { value: 'intermediate', label: 'Intermediate', desc: 'Comfortable on blue runs', level: 2 },
  { value: 'advanced', label: 'Advanced', desc: 'Confident on most terrain', level: 3 },
  { value: 'expert', label: 'Expert', desc: 'Steeps, variable snow, all of it', level: 4 },
];
const TABS = ['Ski types', 'Skis to buy', 'Rent skis'];
const TOWN = { remarkables: 'Queenstown', 'coronet-peak': 'Queenstown', cardrona: 'Wanaka' };
const link = (url) => Linking.openURL(url).catch(() => {});

function ModelCard({ m, town }) {
  const t = useTheme();
  const src = SOURCES[m.source];
  return (
    <Card>
      <Text style={{ color: t.text, fontWeight: '800', fontSize: 16 }}>{m.name}</Text>
      <Body style={{ marginVertical: 6 }}>{m.why}</Body>
      <Btn title={`Source: ${src.name}`} kind="ghost" onPress={() => link(src.url)} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        <Btn title="Search to buy" kind="ghost" onPress={() => link(searchBuy(m.name))} />
        <Btn title={`Search to rent`} kind="ghost" onPress={() => link(searchRent(m.name, town))} />
        <Btn title="Check specs" kind="ghost" onPress={() => link(searchSpecs(m.name))} />
      </View>
    </Card>
  );
}

export default function Finder() {
  const t = useTheme();
  const { seasons, mountainId, setMountainId } = useApp();
  const nz = MOUNTAINS.filter((m) => m.country === 'NZ');
  const sel = MOUNTAINS.find((m) => m.id === mountainId) ?? nz[0];
  const [tab, setTab] = useState(0);
  const [ability, setAbility] = useState('any');
  const [type, setType] = useState(null);
  const x = SAMPLE[sel.id];
  const report = x ? { newSnowCm: x.snow, temperatureC: x.temp } : null;
  const rec = recommend({ ability, type: type ?? undefined, report });
  const town = TOWN[sel.id] ?? 'Queenstown';
  return (
    <Screen title="Ski finder" subtitle="Information only, not advice or endorsement">
      <ChipRow>{TABS.map((n, i) => <Chip key={n} title={n} active={tab === i} onPress={() => setTab(i)} />)}</ChipRow>
      <MountainTabs mountains={nz} selected={sel.id} onSelect={setMountainId} date={new Date()} />
      <Dropdown label="Ability" value={ability} options={ABILITY} onChange={setAbility} />
      <Text style={{ color: t.sub, fontSize: 12, marginBottom: 6 }}>Ski type</Text>
      <ChipRow><Chip title="Today's best" active={!type} onPress={() => setType(null)} />{SKI_TYPES.map((k) => <Chip key={k} title={k} active={type === k} onPress={() => setType(k)} />)}</ChipRow>
      <FadeIn key={`${tab}-${sel.id}-${type}-${ability}`}>
        {tab === 0 ? SKI_TYPES.map((k) => (
          <Card key={k}>
            <Text style={{ color: t.text, fontWeight: '800', textTransform: 'capitalize' }}>{k}</Text>
            <Body>{TYPE_INFO[k]}</Body>
            <Text style={{ color: t.sub, marginTop: 4 }}>Typical waist: {WAIST_RANGES_MM[k][0]}–{WAIST_RANGES_MM[k][1]} mm (rule of thumb)</Text>
            {rec.types.includes(k) ? <Text style={{ color: t.good, marginTop: 4 }}>Suits today's conditions at {sel.name} (sample data)</Text> : null}
          </Card>
        )) : null}
        {tab === 1 ? (
          <>
            {ability === 'beginner' ? <Card><Body>Most reviewed models are aimed at intermediate and advanced skiers. As a beginner, consider renting first.</Body></Card> : null}
            {rec.notes.map((n) => <Card key={n}><Body>{n}</Body></Card>)}
            {rec.types.flatMap((k) => MODELS[k]).map((m) => <ModelCard key={m.name} m={m} town={town} />)}
          </>
        ) : null}
        {tab === 2 ? (
          <Card>
            <Label>Rent near {sel.name}</Label>
            <Body>Rental shops in {town}. Prices, stock and models change every season.</Body>
            <View style={{ gap: 8, marginTop: 10 }}>
              <Btn title={`Search rental shops in ${town}`} onPress={() => link(searchShops(town))} />
              <Btn title="Read a rental guide" kind="ghost" onPress={() => link(RENTAL_GUIDE)} />
            </View>
          </Card>
        ) : null}
        <Text style={{ color: t.sub, fontSize: 12 }}>Links are third-party, not endorsements, and are not affiliate links.</Text>
      </FadeIn>
    </Screen>
  );
}
