// src/app/navigation/RootNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { Platform } from 'react-native';

// Screens
import BrowserScreen from '@/screens/BrowserScreen/BrowserScreen';
import HomeScreen from '@/screens/HomeScreen/HomeScreen';
import SettingsScreen from '@/screens/SettingsScreen/SettingsScreen';

// SVG icons (use your icons under assets/icons/)
import BrowserIcon from '@/assets/icons/anchor.svg';
import HomeIcon from '@/assets/icons/home.svg';
import SettingsIcon from '@/assets/icons/settings.svg';

type RootStackParamList = {
  MainTabs: undefined;
  Browser: { url?: string } | undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <HomeIcon width={size} height={size} fill={color} />;
          }
          if (route.name === 'Browser') {
            return <BrowserIcon width={size} height={size} fill={color} />;
          }
          if (route.name === 'Settings') {
            return <SettingsIcon width={size} height={size} fill={color} />;
          }
          return null;
        },
        tabBarActiveTintColor: '#0a84ff',
        tabBarInactiveTintColor: '#9aa4b2',
        tabBarStyle: {
          height: Platform.OS === 'android' ? 64 : 82,
          paddingBottom: Platform.OS === 'android' ? 8 : 20,
          paddingTop: 8,
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Browser" component={BrowserScreen} options={{ title: 'Browse' }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator(): JSX.Element {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Browser" component={BrowserScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
