import React from 'react';
import { useRouter } from 'expo-router';
import ConditionsView from '../../src/components/ConditionsView';
import { Btn, Body, Card } from '../../src/ui/ui';
import { MOUNTAINS } from '../../src/core/mountains';
import { useApp } from '../../src/state/AppState';

const NZ = MOUNTAINS.filter((m) => m.country === 'NZ');

export default function NZConditions() {
  const router = useRouter();
  const { seasons } = useApp();
  const banner = seasons.nzClosedForSummer ? (
    <Card>
      <Body>New Zealand fields are closed for the season. Mountains overseas may be open.</Body>
      <Btn title="See Overseas Conditions" onPress={() => router.navigate('/overseas')} style={{ marginTop: 10 }} />
    </Card>
  ) : null;
  return <ConditionsView title="New Zealand Conditions" subtitle="The Remarkables · Coronet Peak · Cardrona" mountains={NZ} banner={banner} />;
}
