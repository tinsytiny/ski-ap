import React from 'react';
import { Chip, ChipRow } from '../ui/ui';
import { inSeason } from '../core/season';

// Season ordering: in-season first, off-season dimmed and labelled.
export default function MountainTabs({ mountains, selected, onSelect, date }) {
  const ordered = [...mountains].sort((a, b) => Number(inSeason(b, date)) - Number(inSeason(a, date)));
  return (
    <ChipRow>
      {ordered.map((m) => {
        const off = !inSeason(m, date);
        return <Chip key={m.id} title={m.name} active={selected === m.id} dim={off} note={off ? 'off season' : undefined} onPress={() => onSelect(m.id)} />;
      })}
    </ChipRow>
  );
}
export const orderBySeason = (mountains, date) => [...mountains].sort((a, b) => Number(inSeason(b, date)) - Number(inSeason(a, date)));
