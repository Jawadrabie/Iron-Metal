import { memo, useEffect, useState } from "react"
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"

import {
  deleteFeaturedSectorMobile,
  getFeaturedSectorsMobile,
  type FeaturedSectorRow,
} from "../../lib/featured-sectors"
import { useLanguage } from "../../hooks/useLanguage"
import { colors } from "../../constants/colors"
import { useTheme } from "../../contexts/ThemeContext"

const STRINGS = {
  en: {
    title: "Featured Sectors",
    empty: "You haven't saved any sectors yet. Use the star button in the calculator to save.",
    weightPerMeter: "Weight per meter",
    standardLength: "Standard Length",
    open: "Open",
    delete: "Delete",
    sectionFallback: (id: number | string) => `Section ${id}`,
  },
  ar: {
    title: "القطاعات المميزة",
    empty: "لم تقم بحفظ أي قطاعات بعد. استخدم زر النجمة في الحاسبة للحفظ.",
    weightPerMeter: "الوزن لكل متر",
    standardLength: "الطول القياسي",
    open: "فتح",
    delete: "حذف",
    sectionFallback: (id: number | string) => `قطاع ${id}`,
  },
} as const

const BASE_URL =
  process.env.EXPO_PUBLIC_SITE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://iron-metal.net"

type FeaturedSectorsModalProps = {
  visible: boolean
  onClose: () => void
}

function formatDate(value: string) {
  if (!value) return "-"
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return "-"
    const day = String(d.getDate()).padStart(2, "0")
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return "-"
  }
}

function buildSectorUrl(sector: FeaturedSectorRow) {
  const params: string[] = []

  if (sector.section_id != null) params.push(`sid=${encodeURIComponent(String(sector.section_id))}`)
  if (sector.section_type) params.push(`type=${encodeURIComponent(sector.section_type)}`)
  if (sector.variant_index != null)
    params.push(`vi=${encodeURIComponent(String(sector.variant_index))}`)
  if (sector.slider_value) params.push(`sv=${encodeURIComponent(sector.slider_value)}`)
  if (sector.price_per_kg != null)
    params.push(`ppk=${encodeURIComponent(String(sector.price_per_kg))}`)
  if (sector.required_pieces != null)
    params.push(`req=${encodeURIComponent(String(sector.required_pieces))}`)
  if (sector.length_value != null)
    params.push(`len=${encodeURIComponent(String(sector.length_value))}`)
  if (sector.length_unit)
    params.push(`lunit=${encodeURIComponent(sector.length_unit)}`)
  if (sector.height != null) params.push(`h=${encodeURIComponent(String(sector.height))}`)
  if (sector.width != null) params.push(`w=${encodeURIComponent(String(sector.width))}`)
  if (sector.thickness != null)
    params.push(`th=${encodeURIComponent(String(sector.thickness))}`)
  if (sector.hook_length != null)
    params.push(`t=${encodeURIComponent(String(sector.hook_length))}`)
  if (sector.dimension_unit)
    params.push(`unit=${encodeURIComponent(sector.dimension_unit)}`)
  if (sector.density != null)
    params.push(`rho=${encodeURIComponent(String(sector.density))}`)

  const query = params.join("&")
  return query ? `${BASE_URL}/?${query}` : BASE_URL
}

export const FeaturedSectorsModal = memo(function FeaturedSectorsModal({
  visible,
  onClose,
}: FeaturedSectorsModalProps) {
  const { language } = useLanguage("en")
  const t = STRINGS[language]
  const theme = useTheme()
  const isDark = theme.isDark
  const [items, setItems] = useState<FeaturedSectorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!visible) return

    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(undefined)
      const result = await getFeaturedSectorsMobile(language)
      if (cancelled) return
      if (result.error) {
        setError(result.error)
      }
      setItems(result.items || [])
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [language, visible])

  const handleDelete = async (id: string) => {
    const result = await deleteFeaturedSectorMobile(id, language)
    if (!result.success) {
      // في حال الفشل نترك القائمة كما هي
      return
    }

    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleOpenOnWeb = async (sector: FeaturedSectorRow) => {
    const url = buildSectorUrl(sector)
    try {
      await Linking.openURL(url)
    } catch {
      // نتجاهل الخطأ هنا، يمكن تحسين الرسائل لاحقًا
    }
  }

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.card,
                isDark
                  ? {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: 1,
                    }
                  : null,
              ]}
            >
              <Text style={[styles.title, isDark ? { color: theme.colors.text } : null]}>{t.title}</Text>

              {loading ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator size="large" color={isDark ? theme.colors.secondary : "#302C6D"} />
                </View>
              ) : error ? (
                <View style={styles.centerBox}>
                  <Text style={[styles.errorText, isDark ? { color: theme.colors.error } : null]}>{error}</Text>
                </View>
              ) : items.length === 0 ? (
                <View style={styles.centerBox}>
                  <Text style={[styles.emptyText, isDark ? { color: theme.colors.textSecondary } : null]}>{t.empty}</Text>
                </View>
              ) : (
                <ScrollView
                  style={styles.list}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                >
                  {items.map((sector) => {
                    const sectionName =
                      sector.section_type || t.sectionFallback(sector.section_id ?? "-")
                    const weightText =
                      sector.unit_weight != null
                        ? `${sector.unit_weight.toFixed(2)} kg`
                        : "-"
                    const lengthText =
                      sector.length_value != null
                        ? `${sector.length_value} m`
                        : "-"
                    const dateText = formatDate(sector.created_at)

                    return (
                      <View
                        key={sector.id}
                        style={[
                          styles.itemCard,
                          isDark
                            ? {
                                backgroundColor: theme.colors.surface2,
                                borderColor: theme.colors.border,
                              }
                            : null,
                        ]}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={[styles.itemTitle, isDark ? { color: theme.colors.text } : null]}>{sectionName}</Text>
                          <Text style={[styles.itemDate, isDark ? { color: theme.colors.textSecondary } : null]}>{dateText}</Text>
                        </View>

                        <View style={styles.itemRow}>
                          <Text style={[styles.itemLabel, isDark ? { color: theme.colors.textSecondary } : null]}>{t.weightPerMeter}</Text>
                          <Text style={[styles.itemValue, isDark ? { color: theme.colors.text } : null]}>{weightText}</Text>
                        </View>

                        <View style={styles.itemRow}>
                          <Text style={[styles.itemLabel, isDark ? { color: theme.colors.textSecondary } : null]}>{t.standardLength}</Text>
                          <Text style={[styles.itemValue, isDark ? { color: theme.colors.text } : null]}>{lengthText}</Text>
                        </View>

                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionPrimary]}
                            activeOpacity={0.8}
                            onPress={() => handleOpenOnWeb(sector)}
                          >
                            <Feather name="eye" size={16} color="#ffffff" />
                            <Text style={styles.actionText}>{t.open}</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionButton, styles.actionDanger]}
                            activeOpacity={0.8}
                            onPress={() => handleDelete(sector.id)}
                          >
                            <Feather name="trash-2" size={16} color="#ffffff" />
                            <Text style={styles.actionText}>{t.delete}</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  })}
                </ScrollView>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 12,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 14,
    color: "#dc2626",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
  },
  list: {
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 8,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  itemDate: {
    fontSize: 12,
    color: "#6b7280",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: "#4b5563",
  },
  itemValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 4,
  },
  actionPrimary: {
    backgroundColor: colors.secondary,
  },
  actionDanger: {
    backgroundColor: "#dc2626",
  },
  actionText: {
    fontSize: 11,
    color: "#ffffff",
    fontWeight: "500",
  },
})
