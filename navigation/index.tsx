// تكوين التنقل الرئيسي للتطبيق
import React from "react"
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
} from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"

import { useTheme } from "../contexts/ThemeContext"

import { HomeScreen } from "../screens/HomeScreen"
import CalculationsScreen from "../screens/CalculationsScreen"
import LoginScreen from "../screens/LoginScreen"
import FeaturedSectorsScreen from "../screens/FeaturedSectorsScreen"
import DeleteAccountScreen from "../screens/DeleteAccountScreen"
import PrivacyPolicyScreen from "../screens/PrivacyPolicyScreen"
import type { TabKey } from "../components/navigation/BottomTabNavigator"
import type { FeaturedSectorRow } from "../lib/featured-sectors"

export type HomeDeepLinkParams = {
  sid?: number
  type?: string
  vi?: number
  sv?: number
  url: string
  nonce: string
}

export type RootStackParamList = {
  Home:
    | {
        initialTab?: TabKey
        featured?: FeaturedSectorRow
        deepLink?: HomeDeepLinkParams
      }
    | undefined
  EngineeringCalculations: undefined
  Login: undefined
  Featured: undefined
  DeleteAccount: undefined
  PrivacyPolicy: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const navigationRef = createNavigationContainerRef<RootStackParamList>()

export function RootNavigator() {
  const theme = useTheme()

  const baseTheme = theme.isDark ? DarkTheme : DefaultTheme

  const navTheme = {
    ...baseTheme,
    dark: theme.isDark,
    colors: {
      ...baseTheme.colors,
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.secondary,
    },
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme as any}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="EngineeringCalculations"
          component={CalculationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Featured" component={FeaturedSectorsScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
