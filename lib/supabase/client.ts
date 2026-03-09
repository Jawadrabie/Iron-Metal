// تكوين عميل Supabase للتطبيق
import "react-native-url-polyfill/auto"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { createClient } from "@supabase/supabase-js"

const DEFAULT_SUPABASE_URL = "https://docytsghlznipuapvizn.supabase.co"
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvY3l0c2dobHpuaXB1YXB2aXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNDU5MTcsImV4cCI6MjA2NDYyMTkxN30.3kAUiHH2X3fqz0v2-ToevLUBjYGM-p239UzGzM_nEhk"

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

const resolvedSupabaseUrl = supabaseUrl?.trim() || DEFAULT_SUPABASE_URL
const resolvedSupabaseAnonKey = supabaseAnonKey?.trim() || DEFAULT_SUPABASE_ANON_KEY

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
