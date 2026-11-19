/* Comic UI kit: panels, buttons, stickers, chips, a 0-100 slider and a few text helpers. */
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { anxietyLevel } from '../core/cbt';
import { MicButton } from './MicButton';
import { QuickHelpFab } from './QuickHelpFab';
import { C, F, levelColor } from './theme';

/* A box with a thick ink outline and a hard offset shadow (drawn as a second box, so it looks the same on Android). */
export function Comic({ children, bg = C.panel, shadow = 4, radius = 16, style, inner }: {
  children?: React.ReactNode; bg?: string; shadow?: number; radius?: number; style?: StyleProp<ViewStyle>; inner?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ paddingRight: shadow, paddingBottom: shadow }, style]}>
      <View style={[StyleSheet.absoluteFill, { left: shadow, top: shadow, backgroundColor: C.ink, borderRadius: radius }]} />
      <View style={[{ backgroundColor: bg, borderColor: C.ink, borderWidth: 2.5, borderRadius: radius, padding: 16 }, inner]}>{children}</View>
    </View>
  );
}

export function Panel({ title, sticker, stickerBg, children, bg }: { title?: string; sticker?: string; stickerBg?: string; children?: React.ReactNode; bg?: string }) {
  return (
    <Comic bg={bg} inner={{ gap: 10 }}>
      {sticker ? <Sticker bg={stickerBg}>{sticker}</Sticker> : null}
      {title ? <H3>{title}</H3> : null}
      {children}
    </Comic>
  );
}

export function Btn({ title, onPress, kind = 'plain', small, disabled, style, accessibilityLabel }: {
  title: string; onPress?: () => void; kind?: 'plain' | 'primary' | 'danger' | 'dark' | 'ghost'; small?: boolean; disabled?: boolean;
  style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const bg = kind === 'primary' ? C.sky : kind === 'danger' ? C.berry : kind === 'dark' ? C.night : C.panel2;
  const color = kind === 'dark' ? C.onNight : C.ink;
  if (kind === 'ghost') {
    return (
      <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} hitSlop={8} style={style}>
        <Text style={{ fontFamily: F.display, fontSize: small ? 15 : 16, color: C.ink, textDecorationLine: 'underline', paddingVertical: 8 }}>{title}</Text>
      </Pressable>
    );
  }
  const sh = small ? 3 : 4;
  return (
    <Pressable onPress={() => { Haptics.selectionAsync().catch(() => {}); onPress?.(); }} disabled={disabled}
      accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} accessibilityState={{ disabled }}
      style={[{ opacity: disabled ? 0.5 : 1, alignSelf: 'flex-start' }, style]}>
      {({ pressed }) => (
        <View style={{ paddingRight: sh, paddingBottom: sh }}>
          <View style={[StyleSheet.absoluteFill, { left: sh, top: sh, backgroundColor: C.ink, borderRadius: small ? 11 : 14 }]} />
          <View style={{
            backgroundColor: bg, borderColor: C.ink, borderWidth: 2.5, borderRadius: small ? 11 : 14,
            minHeight: small ? 38 : 46, paddingHorizontal: small ? 13 : 18, justifyContent: 'center', alignItems: 'center',
            transform: pressed ? [{ translateX: sh - 1 }, { translateY: sh - 1 }] : [],
          }}>
            <Text style={{ fontFamily: F.display, fontSize: small ? 15 : 16, color }}>{title}</Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function Sticker({ children, bg = C.pink, tiny }: { children: React.ReactNode; bg?: string; tiny?: boolean }) {
  return (
    <View style={{ alignSelf: 'flex-start', transform: [{ rotate: '-3deg' }], backgroundColor: bg, borderColor: C.ink, borderWidth: 2.5, borderRadius: 8,
      paddingHorizontal: tiny ? 7 : 10, paddingVertical: tiny ? 0 : 2 }}>
      <Text style={{ fontFamily: F.displayBold, fontSize: tiny ? 10 : 12, letterSpacing: 0.8, textTransform: 'uppercase', color: C.ink }}>{children}</Text>
    </View>
  );
}

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={{ fontFamily: F.displayBold, fontSize: 24, color: C.ink }}>{children}</Text>
);
export const H3 = ({ children }: { children: React.ReactNode }) => (
  <Text accessibilityRole="header" style={{ fontFamily: F.display, fontSize: 19, color: C.ink }}>{children}</Text>
);
export const P = ({ children, muted, bold, style }: { children: React.ReactNode; muted?: boolean; bold?: boolean; style?: StyleProp<any> }) => (
  <Text style={[{ fontFamily: bold ? F.bodyBold : F.body, fontSize: 16, lineHeight: 23, color: muted ? C.inkSoft : C.ink }, style]}>{children}</Text>
);
export const Hand = ({ children, size = 20 }: { children: React.ReactNode; size?: number }) => (
  <Text style={{ fontFamily: F.hand, fontSize: size, lineHeight: size * 1.3, color: C.ink }}>{children}</Text>
);

/* Simple **bold** support for guide text. */
export function Rich({ text, style }: { text: string; style?: StyleProp<any> }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={[{ fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.ink }, style]}>
      {parts.map((p, i) => (p.startsWith('**') ? <Text key={i} style={{ fontFamily: F.bodyBold }}>{p.slice(2, -2)}</Text> : p))}
    </Text>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View style={{ gap: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
          <Text style={{ fontFamily: F.bodyBold, fontSize: 16, color: C.ink }}>•</Text>
          <View style={{ flex: 1 }}><Rich text={x} /></View>
        </View>
      ))}
    </View>
  );
}

export function Chips({ options, value, onChange, multi = true }: {
  options: { k: string; label: string }[]; value: string[]; onChange: (v: string[]) => void; multi?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = value.includes(o.k);
        return (
          <Pressable key={o.k} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
            onPress={() => onChange(on ? value.filter((x) => x !== o.k) : multi ? [...value, o.k] : [o.k])}
            style={{ backgroundColor: on ? C.sky : C.paper, borderColor: C.ink, borderWidth: 2, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ fontFamily: F.bodySemi, fontSize: 14, color: C.ink }}>{on ? '✓ ' : ''}{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* 0-100 rating with a colored badge. `marker` shows an earlier rating as text, for example "Down 35 from 70". */
export function Rating({ label, value, onChange, hint, max = 100, step = 5, low = 'None', high = 'Worst' }: {
  label: string; value: number | null | undefined; onChange: (v: number) => void; hint?: string; max?: number; step?: number; low?: string; high?: string;
}) {
  const v = typeof value === 'number' ? value : null;
  const lvl = max === 100 ? anxietyLevel(v) : anxietyLevel(v === null ? null : (v / max) * 100);
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ fontFamily: F.bodyBold, fontSize: 15, color: C.ink, flex: 1 }}>{label}</Text>
        <View style={{ minWidth: 48, alignItems: 'center', backgroundColor: levelColor(lvl), borderColor: C.ink, borderWidth: 2, borderRadius: 10, paddingHorizontal: 8 }}>
          <Text style={{ fontFamily: F.displayBold, fontSize: 18, color: C.ink }}>{v === null ? '–' : v}</Text>
        </View>
      </View>
      <Slider minimumValue={0} maximumValue={max} step={step} value={v ?? 0} onValueChange={(x) => onChange(Math.round(x))}
        minimumTrackTintColor={C.skyDeep} maximumTrackTintColor={C.inkSoft} thumbTintColor={C.ink}
        accessibilityLabel={label} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.inkSoft }}>0 {low}</Text>
        <Text style={{ fontFamily: F.body, fontSize: 12, color: C.inkSoft }}>{max} {high}</Text>
      </View>
      {hint ? <Text style={{ fontFamily: F.bodyBold, fontSize: 14, color: C.skyDeep }}>{hint}</Text> : null}
    </View>
  );
}

/* A labelled text field. Multi-line fields get a Speak button for voice input (on the phone only, see MicButton). */
export function Field({ label, value, onChangeText, multiline = true, placeholder, dictate = multiline, ...rest }: {
  label: string; value: string | undefined; onChangeText: (t: string) => void; placeholder?: string; multiline?: boolean; dictate?: boolean;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: F.bodyBold, fontSize: 15, color: C.ink }}>{label}</Text>
      {dictate && Platform.OS !== 'web' ? <MicButton value={value ?? ''} onChange={onChangeText} label={label} /> : null}
      <TextInput value={value ?? ''} onChangeText={onChangeText} multiline={multiline} placeholder={placeholder} placeholderTextColor={C.inkSoft}
        onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} accessibilityLabel={label}
        style={{ fontFamily: F.hand, fontSize: 20, color: C.ink, backgroundColor: C.paper, borderColor: focus ? C.skyDeep : C.ink, borderWidth: 2.5,
          borderRadius: 12, padding: 12, minHeight: multiline ? 84 : 48, textAlignVertical: 'top' }} {...rest} />
    </View>
  );
}

export function Row({ children, gap = 10, wrap = true }: { children: React.ReactNode; gap?: number; wrap?: boolean }) {
  return <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap, alignItems: 'center' }}>{children}</View>;
}

/* The warm page: gradient, safe area, scroll, room for the Quick help button. */
export function Page({ children, scroll = true, help = true }: { children: React.ReactNode; scroll?: boolean; help?: boolean }) {
  const insets = useSafeAreaInsets();
  const body = <View style={{ padding: 16, gap: 20, paddingBottom: 120 + insets.bottom, width: '100%', maxWidth: 640, alignSelf: 'center' }}>{children}</View>;
  return (
    <LinearGradient colors={[C.pageTop, C.pageBot]} style={{ flex: 1 }}>
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">{body}</ScrollView> : body}
      {help ? <QuickHelpFab /> : null}
    </LinearGradient>
  );
}

export function Badge({ v }: { v: number | null | undefined }) {
  return (
    <View style={{ minWidth: 40, alignItems: 'center', backgroundColor: levelColor(anxietyLevel(v)), borderColor: C.ink, borderWidth: 2, borderRadius: 10, paddingHorizontal: 6 }}>
      <Text style={{ fontFamily: F.displayBold, fontSize: 16, color: C.ink }}>{typeof v === 'number' ? v : '–'}</Text>
    </View>
  );
}

export function ThoughtBubble({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: C.paper, borderColor: C.ink, borderWidth: 2.5, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-start' }}>
      <Hand size={19}>{children}</Hand>
    </View>
  );
}
