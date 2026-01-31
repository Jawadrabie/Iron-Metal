import * as Notifications from "expo-notifications"
import Constants from "expo-constants"
import { Platform } from "react-native"

import { supabase } from "../supabase/client"

export async function registerForPushNotificationsAsync() {
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError && (userError as any).name !== "AuthSessionMissingError") {
      return
    }

    const user = data?.user
    if (!user) {
      return
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== "granted") {
      return
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      })
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId

    if (!projectId) {
      // Without a projectId, Expo's push service may reject the request (403).
      // This also usually means the build was not done with EAS or app.json extra.eas.projectId is missing.
      return
    }

    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId })
    const expoPushToken = pushToken.data

    if (!expoPushToken) {
      return
    }

    const { error: upsertError } = await supabase
      .from("user_push_tokens")
      .upsert(
        {
          user_id: user.id,
          expo_push_token: expoPushToken,
          device_os: Platform.OS === "ios" ? "ios" : "android",
          last_seen_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: "user_id,expo_push_token" },
      )

    if (upsertError) {
      return
    }
  } catch {
    // Swallow unexpected errors; push registration should never crash the app.
  }
}
