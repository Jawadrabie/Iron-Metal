import React, { useCallback } from "react"
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { useFocusEffect, useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"
import { Feather } from "@expo/vector-icons"

import type { RootStackParamList } from "../navigation"
import { useCatalogData } from "../hooks/useCatalogData"
import { FeaturedSectorCard } from "../components/featured/FeaturedSectorCard"
import { useFeaturedSectorsController } from "../hooks/useFeaturedSectorsController"
import type { FeaturedSectorRow } from "../lib/featured-sectors"
import { colors } from "../constants/colors"
import { useI18n } from "../contexts/I18nContext"
import { useTheme } from "../contexts/ThemeContext"
import { ErrorState } from "../components/ui/ErrorState"

type RootNav = NativeStackNavigationProp<RootStackParamList>

export default function FeaturedSectorsScreen() {
  const navigation = useNavigation<RootNav>()
  const theme = useTheme()
  const isDark = theme.isDark
  const { data: catalog } = useCatalogData()
  const { items, loading, error, refresh, handleDelete } = useFeaturedSectorsController()
  const { isRTL, t } = useI18n()
  const ft = t.featuredSectors

  const isGuestAuthError =
    typeof error === "string" &&
    (error.includes("يجب تسجيل الدخول") || /\b(sign\s*in|log\s*in|login)\b/i.test(error))

  useFocusEffect(
    useCallback(() => {
      void refresh()
      return undefined
    }, [refresh]),
  )

  const handleOpen = useCallback(
    (sector: FeaturedSectorRow) => {
      navigation.navigate("Home", {
        initialTab: "home",
        featured: sector,
      })
    },
    [navigation],
  )

  return (
    <View style={[styles.root, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Feather name="chevron-left" size={22} color={isDark ? theme.colors.text : "#111827"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark ? { color: theme.colors.text } : null]}>{ft.title}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={isDark ? theme.colors.secondary : "#302C6D"} />
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          {isGuestAuthError ? (
            <>
              <Feather
                name="star"
                size={42}
                color={isDark ? theme.colors.textSecondary : "#9CA3AF"}
                style={styles.emptyIcon}
              />
              <Text
                style={[
                  styles.emptyTitle,
                  isDark ? { color: theme.colors.text } : null,
                  isRTL ? { writingDirection: "rtl" as const } : null,
                ]}
              >
                {ft.guestTitle}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  isDark ? { color: theme.colors.textSecondary } : null,
                  isRTL ? { writingDirection: "rtl" as const } : null,
                ]}
              >
                {ft.guestSubtitle}
              </Text>
              <TouchableOpacity
                style={[styles.loginButton, { backgroundColor: theme.colors.secondary }]}
                activeOpacity={0.9}
                onPress={() => navigation.navigate("Login" as never)}
              >
                <Text
                  style={[
                    styles.loginButtonText,
                    isRTL ? { writingDirection: "rtl" as const } : null,
                  ]}
                >
                  {t.auth.accountModal.login}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <ErrorState message={error} onRetry={() => { void refresh() }} />
          )}
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerBox}>
          <Feather
            name="star"
            size={42}
            color={isDark ? theme.colors.textSecondary : "#9CA3AF"}
            style={styles.emptyIcon}
          />
          <Text
            style={[
              styles.emptyText,
              isDark ? { color: theme.colors.textSecondary } : null,
              isRTL ? { writingDirection: "rtl" as const } : null,
            ]}
          >
            {ft.empty}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {items.map((sector) => (
            <FeaturedSectorCard
              key={sector.id}
              sector={sector}
              catalog={catalog}
              onOpen={handleOpen}
              onDelete={handleDelete}
            />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 0,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  centerBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
  emptyText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    paddingHorizontal: 16,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    textAlign: "center",
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  list: {
    marginTop: 4,
  },
  listContent: {
    paddingBottom: 16,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
  },
  itemMain: {
    flex: 1,
    marginRight: 8,
  },
  itemRight: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  itemImageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  itemDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: "#4b5563",
  },
  itemColon: {
    fontSize: 12,
    color: "#4b5563",
    marginHorizontal: 4,
  },
  itemValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 6,
  },
  actionButton: {
    width: 24,
    height: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    bottom:-7
  },
  actionButtonSpacer: {
    marginRight: 8,
  },
  actionPrimary: {
    backgroundColor: colors.primary,
  },
  actionDanger: {
    backgroundColor: "#c83c3cff",
  },
})
