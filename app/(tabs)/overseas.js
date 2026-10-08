import React from 'react';
import ConditionsView from '../../src/components/ConditionsView';
import { MOUNTAINS } from '../../src/core/mountains';

const OVERSEAS = MOUNTAINS.filter((m) => m.country !== 'NZ');

export default function OverseasConditions() {
  return <ConditionsView title="Overseas Conditions" subtitle="Whistler · Niseko · Hakuba · Rusutsu · Myoko" mountains={OVERSEAS} />;
}
