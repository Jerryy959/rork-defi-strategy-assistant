import { Tabs } from "expo-router";
import { Home, BarChart2, Store } from "lucide-react-native";
import React from "react";
import { StrategyContext } from "@/hooks/strategy-store";

export default function TabLayout() {
  return (
    <StrategyContext>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#3B82F6",
          headerShown: true,
          tabBarStyle: {
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            height: 60,
            paddingBottom: 8,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Create Strategy",
            tabBarIcon: ({ color }) => <Home color={color} size={24} />,
            tabBarLabel: "Create",
          }}
        />
        <Tabs.Screen
          name="strategies"
          options={{
            title: "My Strategies",
            tabBarIcon: ({ color }) => <BarChart2 color={color} size={24} />,
            tabBarLabel: "Strategies",
          }}
        />
        <Tabs.Screen
          name="marketplace"
          options={{
            title: "Marketplace",
            tabBarIcon: ({ color }) => <Store color={color} size={24} />,
            tabBarLabel: "Marketplace",
          }}
        />
      </Tabs>
    </StrategyContext>
  );
}