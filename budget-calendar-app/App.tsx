import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CalendarScreen from './screens/CalendarScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName;
            if (route.name === 'カレンダー') iconName = 'calendar';
            else if (route.name === 'アナリティクス') iconName = 'stats-chart';
            else if (route.name === '履歴') iconName = 'list';
            return <Ionicons name={iconName as any} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#4CAF50',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="カレンダー" component={CalendarScreen} />
        <Tab.Screen name="アナリティクス" component={AnalyticsScreen} />
        {/* <Tab.Screen name="履歴" component={HistoryScreen} /> */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
