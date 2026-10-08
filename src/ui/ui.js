// Small accessible UI kit using only built-in React Native + Animated.
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from './theme';

export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => live && setReduce(!!v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => setReduce(!!v));
    return () => { live = false; sub?.remove?.(); };
  }, []);
  return reduce;
}

export function FadeIn({ delay = 0, children, style }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [reduce, delay, v]);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [reduce ? 0 : 14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

function Snowflake() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const r = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(Animated.timing(r, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce, r]);
  return (
    <Animated.View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ transform: [{ rotate: r.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }}>
      <Ionicons name="snow" size={28} color={t.accent} />
    </Animated.View>
  );
}

const FLAKES = Array.from({ length: 14 }, (_, i) => ({ left: (i * 73) % 100, size: 3 + (i % 3), dur: 6000 + (i % 5) * 1500, delay: (i % 7) * 600 }));
function Flake({ f, h }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(y, { toValue: 1, duration: f.dur, delay: f.delay, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [y, f, h]);
  return <Animated.View style={{ position: 'absolute', left: `${f.left}%`, top: -10, width: f.size, height: f.size, borderRadius: f.size, backgroundColor: '#ffffff', opacity: 0.55, transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, h] }) }] }} />;
}
export function Snow({ height = 160 }) {
  const reduce = useReduceMotion();
  if (reduce) return null;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{FLAKES.map((f, i) => <Flake key={i} f={f} h={height} />)}</View>;
}

export function Screen({ title, subtitle, children, pill = 'Sample data' }) {
  const t = useTheme();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: t.bg }}>
      <View style={s.header}>
        <Snowflake />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text accessibilityRole="header" style={[s.h1, { color: t.text }]}>{title}</Text>
          {subtitle ? <Text style={{ color: t.sub, fontSize: 13 }}>{subtitle}</Text> : null}
        </View>
        {pill ? <View style={[s.pill, { backgroundColor: t.chip, borderColor: t.border }]}><Text style={{ color: t.sub, fontSize: 11 }}>{pill}</Text></View> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }) {
  const t = useTheme();
  return <View style={[s.card, { backgroundColor: t.card, borderColor: t.border }, style]}>{children}</View>;
}
export const Label = ({ children }) => { const t = useTheme(); return <Text accessibilityRole="header" style={{ color: t.sub, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>{children}</Text>; };
export const Body = ({ children, style, ...p }) => { const t = useTheme(); return <Text style={[{ color: t.text, fontSize: 15, lineHeight: 21 }, style]} {...p}>{children}</Text>; };

function PressScale({ children, onPress, style, disabled, accessibilityLabel, accessibilityState, accessibilityRole = 'button' }) {
  const reduce = useReduceMotion();
  const sc = useRef(new Animated.Value(1)).current;
  const to = (v) => { if (!reduce) Animated.spring(sc, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 0 }).start(); };
  return (
    <Pressable onPress={onPress} disabled={disabled} onPressIn={() => to(0.96)} onPressOut={() => to(1)}
      accessibilityRole={accessibilityRole} accessibilityLabel={accessibilityLabel} accessibilityState={{ disabled: !!disabled, ...accessibilityState }}>
      <Animated.View style={[{ minHeight: 44, justifyContent: 'center', transform: [{ scale: sc }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({ title, onPress, kind = 'primary', disabled, style }) {
  const t = useTheme();
  const primary = kind === 'primary';
  return (
    <PressScale onPress={onPress} disabled={disabled} accessibilityLabel={title}
      style={[s.btn, { backgroundColor: primary ? t.accent : 'transparent', borderColor: primary ? t.accent : t.border, opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={{ color: primary ? t.onAccent : t.text, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
    </PressScale>
  );
}

export function Chip({ title, active, onPress, dim, note }) {
  const t = useTheme();
  return (
    <PressScale onPress={onPress} accessibilityLabel={note ? `${title}, ${note}` : title} accessibilityState={{ selected: !!active }}
      style={[s.chip, { backgroundColor: active ? t.accent : t.chip, borderColor: active ? t.accent : t.border, opacity: dim && !active ? 0.55 : 1 }]}>
      <Text style={{ color: active ? t.onAccent : t.text, fontWeight: '600' }}>{title}{note ? ` · ${note}` : ''}</Text>
    </PressScale>
  );
}
export const ChipRow = ({ children }) => <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }} style={{ marginBottom: 12 }}>{children}</ScrollView>;

export function Stat({ label, value, unit = '', digits = 0 }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(reduce || value == null ? value : 0);
  useEffect(() => {
    if (value == null) { setShown(null); return undefined; }
    if (reduce) { setShown(value); return undefined; }
    const id = v.addListener(({ value: x }) => setShown(x));
    v.setValue(0);
    Animated.timing(v, { toValue: value, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => v.removeListener(id);
  }, [value, reduce, v]);
  const text = shown == null ? '—' : `${Number(shown).toFixed(digits)}${unit}`;
  return (
    <View style={[s.stat, { backgroundColor: t.chip, borderColor: t.border }]} accessible accessibilityLabel={`${label}: ${value == null ? 'unknown' : `${value}${unit}`}`}>
      <Text style={{ color: t.text, fontSize: 24, fontWeight: '800' }}>{text}</Text>
      <Text style={{ color: t.sub, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function Bar({ label, open, total }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const ratio = total ? Math.min(1, open / total) : 0;
  const w = useRef(new Animated.Value(reduce ? ratio : 0)).current;
  useEffect(() => {
    if (reduce) { w.setValue(ratio); return; }
    Animated.timing(w, { toValue: ratio, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [ratio, reduce, w]);
  return (
    <View style={{ marginBottom: 10 }} accessible accessibilityLabel={total == null || open == null ? `${label}: unknown` : `${label}: ${open} of ${total} open`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ color: t.text }}>{label}</Text>
        <Text style={{ color: t.sub }}>{open == null || total == null ? '—' : `${open} / ${total}`}</Text>
      </View>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.chip, overflow: 'hidden' }}>
        <Animated.View style={{ height: 8, borderRadius: 4, backgroundColor: t.accent, width: w.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
      </View>
    </View>
  );
}

// Custom dropdown (not the native picker wheel). options: {value,label,desc,level}
export function Dropdown({ label, value, options, onChange }) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.value === value) ?? options[0];
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: t.sub, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <PressScale onPress={() => setOpen((o) => !o)} accessibilityLabel={`${label}: ${cur.label}`} accessibilityState={{ expanded: open }}
        style={[s.btn, { borderColor: t.border, backgroundColor: t.card, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={{ color: t.text, fontWeight: '600' }}>{cur.label}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.sub} />
      </PressScale>
      {open ? (
        <FadeIn><View style={[s.list, { backgroundColor: t.card, borderColor: t.border }]}>
          {options.map((o) => (
            <PressScale key={o.value} onPress={() => { onChange(o.value); setOpen(false); }} accessibilityLabel={`${o.label}. ${o.desc ?? ''}`} accessibilityState={{ selected: o.value === value }} style={{ padding: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: t.text, fontWeight: o.value === value ? '800' : '600' }}>{o.label}</Text>
                {o.level != null ? <Text style={{ color: t.accent }}>{'●'.repeat(o.level)}{'○'.repeat(4 - o.level)}</Text> : null}
              </View>
              {o.desc ? <Text style={{ color: t.sub, fontSize: 12 }}>{o.desc}</Text> : null}
            </PressScale>
          ))}
        </View></FadeIn>
      ) : null}
    </View>
  );
}

export const screenWidth = () => Dimensions.get('window').width;

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  h1: { fontSize: 22, fontWeight: '800' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 14 },
  btn: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  chip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  stat: { flexGrow: 1, flexBasis: '45%', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  list: { borderRadius: 12, borderWidth: 1, marginTop: 6, overflow: 'hidden' },
});
