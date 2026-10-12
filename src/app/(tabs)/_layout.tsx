import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fonts } from '@/theme';

/** Navegación pública por pestañas: Catálogo, Tienda, Contacto. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: {
          backgroundColor: colors.bg.card,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tienda"
        options={{
          title: 'Tienda',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'storefront' : 'storefront-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="contacto"
        options={{
          title: 'Contacto',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'call' : 'call-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
