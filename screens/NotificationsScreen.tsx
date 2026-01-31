import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"

import type { NotificationRow } from "../hooks/useNotifications"
import { useLanguage } from "../hooks/useLanguage"
import { useTheme } from "../contexts/ThemeContext"

const STRINGS = {
  en: {
    markAllAsRead: "Mark all as read",
    guestEmpty: "Sign in to view your notifications",
    signIn: "Sign in",
    empty: "No notifications yet",
  },
  ar: {
    markAllAsRead: "تحديد الكل كمقروء",
    guestEmpty: "سجّل الدخول لعرض إشعاراتك",
    signIn: "تسجيل الدخول",
    empty: "لا توجد إشعارات بعد",
  },
} as const

type NotificationsScreenProps = {
  items: NotificationRow[]
  loading: boolean
  error?: string | null
  onRefresh: () => Promise<void> | void
  onMarkAllAsRead: () => Promise<void> | void
  onOpenNotification: (item: NotificationRow) => void
  isGuest?: boolean
  onPressLogin?: () => void
}

export function NotificationsScreen({
  items,
  loading,
  error,
  onRefresh,
  onMarkAllAsRead,
  onOpenNotification,
  isGuest,
  onPressLogin,
}: NotificationsScreenProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { language } = useLanguage("en")
  const isRTL = language === "ar"
  const t = STRINGS[language]

  const hasNotifications = items.length > 0
  const hasUnread = items.some((n) => !n.read_at)
  const guest = !!isGuest
  const showInitialLoader = loading && !hasNotifications && !guest
  const showErrorState = !loading && error && !hasNotifications
  const showGuestEmptyState = !error && !hasNotifications && guest
  const showEmptyState = !loading && !error && !hasNotifications && !guest

  return (
    <View style={[styles.container, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <View style={styles.headerRow}>
        {hasNotifications && hasUnread && (
          <TouchableOpacity onPress={onMarkAllAsRead}>
            <Text
              style={[
                styles.markAllText,
                isDark ? { color: theme.colors.secondary } : null,
                isRTL ? { textAlign: "right", writingDirection: "rtl" } : null,
              ]}
            >
              {t.markAllAsRead}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {showInitialLoader ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="small" color={isDark ? theme.colors.primary : "#302C6D"} />
        </View>
      ) : showErrorState ? (
        <View style={styles.centerContent}>
          <Text style={[styles.errorText, isDark ? { color: theme.colors.error } : null]}>{error}</Text>
        </View>
      ) : showGuestEmptyState ? (
        <View style={styles.centerContent}>
          <Feather name="lock" size={42} color={isDark ? theme.colors.textSecondary : "#d1d5db"} style={styles.emptyIcon} />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? theme.colors.textSecondary : "#919191" },
              isRTL ? { writingDirection: "rtl" } : null,
            ]}
          >
            {t.guestEmpty}
          </Text>
          {!!onPressLogin && (
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.secondary }]}
              activeOpacity={0.9}
              onPress={onPressLogin}
            >
              <Text
                style={[
                  styles.loginButtonText,
                  isRTL ? { writingDirection: "rtl" } : null,
                ]}
              >
                {t.signIn}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : showEmptyState ? (
        <View style={styles.centerContent}>
          <Feather name="bell" size={42} color={theme.colors.secondary} style={styles.emptyIcon} />
          <Text
            style={[
              styles.emptyText,
              { color: isDark ? theme.colors.textSecondary : "#919191" },
              isRTL ? { writingDirection: "rtl" } : null,
            ]}
          >
            {t.empty}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
          refreshControl={
            <RefreshControl
              refreshing={loading && !guest}
              onRefresh={onRefresh}
              colors={[isDark ? theme.colors.primary : "#302C6D"]}
              tintColor={isDark ? theme.colors.primary : "#302C6D"}
            />
          }
          renderItem={({ item }) => {
            const isUnread = !item.read_at
            return (
              <TouchableOpacity
                style={[
                  styles.item,
                  isDark
                    ? { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                    : null,
                  isUnread
                    ? isDark
                      ? { backgroundColor: theme.colors.surface2, borderColor: theme.colors.secondary }
                      : styles.itemUnread
                    : null,
                ]}
                activeOpacity={0.8}
                onPress={() => onOpenNotification(item)}
              >
                <View style={styles.itemContent}>
                  <View style={styles.itemTitleRow}>
                    <Text style={[styles.itemTitle, isDark ? { color: theme.colors.text } : null]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>

                  {item.body ? (
                    <Text style={[styles.itemBody, isDark ? { color: theme.colors.textSecondary } : null]} numberOfLines={2}>
                      {item.body}
                    </Text>
                  ) : null}

                  <Text style={[styles.itemDate, isDark ? { color: theme.colors.textSecondary } : null]}>{formatDate(item.created_at)}</Text>
                </View>

                <View
                  style={[
                    styles.itemIconWrapper,
                    isDark ? { backgroundColor: theme.colors.surface2 } : null,
                  ]}
                >
                  <Feather name="bell" size={18} color={theme.colors.secondary} />
                  {isUnread && <View style={[styles.unreadDot, isDark ? { backgroundColor: theme.colors.secondary } : null]} />}
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

function formatDate(ts?: string | null) {
  if (!ts) return ""
  try {
    return new Date(ts).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    })
  } catch {
    return ""
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#302C6D",
  },
  markAllText: {
    fontSize: 14,
    color: "#2563eb",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#919191",
    textAlign: "center",
  },
  loginButton: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 999,
  },
  loginButtonText: {
    fontSize: 15,
    color: "#ffffff",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 8,
  },
  itemUnread: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FDBA74",
  },
  itemDate: {
    marginTop: 6,
    fontSize: 11,
    color: "#9CA3AF",
  },
  itemContent: {
    flex: 1,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  itemBody: {
    marginTop: 4,
    fontSize: 13,
    color: "#4B5563",
  },
  newBadge: {
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
  },
  itemIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1E6",
    marginLeft: 10,
  },
  unreadDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#f97316",
  },
})
