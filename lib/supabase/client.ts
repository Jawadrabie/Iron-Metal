// تكوين عميل Supabase للتطبيق
import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

const resolvedSupabaseUrl = supabaseUrl?.trim() || "https://invalid.supabase.co"
const resolvedSupabaseAnonKey = supabaseAnonKey?.trim() || "invalid"

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[supabase] Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY",
  )
}

export const supabase = createClient(resolvedSupabaseUrl, resolvedSupabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storage: AsyncStorage,
    detectSessionInUrl: false,
  },
})
