/* The pink Quick help button. It sits at the bottom of every screen (through Page). */
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from './theme';

export function QuickHelpFab() {
  const insets = useSafeAreaInsets();
  return (
    <View pointerEvents="box-none" style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: insets.bottom + 14 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Quick help. Open during panic." onPress={() => router.push('/quick-help')}>
        {({ pressed }) => (
          <View style={{ paddingRight: 4, paddingBottom: 4 }}>
            <View style={[StyleSheet.absoluteFill, { left: 4, top: 4, backgroundColor: C.ink, borderRadius: 999 }]} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.berry, borderColor: C.ink, borderWidth: 3, borderRadius: 999,
              paddingHorizontal: 22, paddingVertical: 12, transform: pressed ? [{ translateX: 3 }, { translateY: 3 }] : [] }}>
              <Text style={{ fontSize: 18 }}>〰️</Text>
              <Text style={{ fontFamily: F.displayBold, fontSize: 18, color: C.ink }}>Quick help</Text>
            </View>
          </View>
        )}
      </Pressable>
    </View>
  );
}
