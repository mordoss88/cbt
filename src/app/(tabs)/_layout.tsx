/* Four tabs in the plum header, like the tracker. */
import { Tabs, type BottomTabBarProps } from 'expo-router/tabs';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from '../../ui/theme';

function Header({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ backgroundColor: C.night, paddingTop: insets.top + 10, paddingBottom: 12, paddingHorizontal: 16, borderBottomWidth: 3, borderBottomColor: C.deep, gap: 12 }}>
      <Text accessibilityRole="header" style={{ fontFamily: F.displayBold, fontSize: 24, color: C.panel,
        textShadowColor: C.deep, textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 }}>CBT Practice Log</Text>
      <View style={{ flexDirection: 'row', gap: 7 }} accessibilityRole="tablist">
        {state.routes.map((route, i) => {
          const on = state.index === i;
          const label = (descriptors[route.key].options.title ?? route.name) as string;
          return (
            <Pressable key={route.key} accessibilityRole="tab" accessibilityState={{ selected: on }} style={{ flex: 1 }}
              onPress={() => { if (!on) navigateToTab(route.key); }}>
              <View style={{ paddingRight: on ? 0 : 3, paddingBottom: on ? 0 : 3, marginLeft: on ? 3 : 0, marginTop: on ? 3 : 0 }}>
                {on ? null : <View style={[StyleSheet.absoluteFill, { left: 3, top: 3, backgroundColor: C.deep, borderRadius: 12 }]} />}
                <View style={{ backgroundColor: on ? C.sky : C.panel2, borderColor: C.deep, borderWidth: 2.5, borderRadius: 12, minHeight: 42,
                  alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 }}>
                  <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: F.display, fontSize: 15, color: C.ink }}>{label}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(p) => <Header {...p} />} screenOptions={{ headerShown: false, tabBarPosition: 'top', sceneStyle: { backgroundColor: C.pageBot } }}>
      <Tabs.Screen name="index" options={{ title: 'Thoughts' }} />
      <Tabs.Screen name="ladder" options={{ title: 'Ladder' }} />
      <Tabs.Screen name="patterns" options={{ title: 'Patterns' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
    </Tabs>
  );
}
