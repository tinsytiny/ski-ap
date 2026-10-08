import { useColorScheme } from 'react-native';

const dark = { name: 'dark', bg: '#0b1220', card: '#131c2e', text: '#eef3fb', sub: '#9fb0c8', border: '#233149', accent: '#5cc8ff', onAccent: '#04121f', good: '#4ade80', warn: '#fbbf24', bad: '#f87171', chip: '#18243a', hero1: '#0f3a5f', hero2: '#1b6aa5' };
const light = { name: 'light', bg: '#f2f6fb', card: '#ffffff', text: '#0b1a2e', sub: '#46566d', border: '#d6e0ee', accent: '#0a6db5', onAccent: '#ffffff', good: '#15803d', warn: '#a16207', bad: '#b91c1c', chip: '#e6eef8', hero1: '#1b6aa5', hero2: '#4fb3e8' };

export const useTheme = () => (useColorScheme() === 'light' ? light : dark);
