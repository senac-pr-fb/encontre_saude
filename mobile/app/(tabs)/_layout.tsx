import { ComponentProps } from 'react';
import { Tabs } from 'expo-router';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { colors, fonts } from '@presentation/theme';

type IconName = ComponentProps<typeof FontAwesome6>['name'];

// Substitui shared/sidebar.js. Ícones com os mesmos nomes do Font Awesome do site.
const tab = (title: string, icon: IconName): ComponentProps<typeof Tabs.Screen>['options'] => ({
  title,
  tabBarIcon: ({ color, size }) => <FontAwesome6 name={icon} color={color} size={size - 2} />,
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.greenDark,
        tabBarInactiveTintColor: colors.textLight,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.grayLight },
      }}
    >
      <Tabs.Screen name="index" options={tab('Home', 'house')} />
      <Tabs.Screen name="primeiros-socorros" options={tab('Socorros', 'kit-medical')} />
      <Tabs.Screen name="prevencao" options={tab('Prevenção', 'shield-heart')} />
      <Tabs.Screen name="farmacias" options={tab('Farmácias', 'prescription-bottle-medical')} />
      <Tabs.Screen name="perfil" options={tab('Perfil', 'user')} />
    </Tabs>
  );
}
