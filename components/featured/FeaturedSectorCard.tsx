import { memo, useMemo } from "react"
import { StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Feather } from "@expo/vector-icons"

import type { FeaturedSectorRow } from "../../lib/featured-sectors"
import type { Section, Variant } from "../../types/sections"
import { colors } from "../../constants/colors"
import { useTheme } from "../../contexts/ThemeContext"
import { MaskedSectionImage } from "../sections/MaskedSectionImage"

type FeaturedSectorCardProps = {
  sector: FeaturedSectorRow
  catalog: Section[]
  onOpen: (sector: FeaturedSectorRow) => void
  onDelete: (id: string) => void
}

export const FeaturedSectorCard = memo(function FeaturedSectorCard({
  sector,
  catalog,
  onOpen,
  onDelete,
}: FeaturedSectorCardProps) {
  const theme = useTheme()
  const isDark = theme.isDark

  const sectionName = sector.section_type || `Section ${sector.section_id ?? "-"}`
  const weightText = sector.unit_weight != null ? `${sector.unit_weight.toFixed(2)} kg` : "-"
  const lengthText = sector.length_value != null ? `${sector.length_value} m` : "-"
  const dateText = formatDate(sector.created_at)
  const { mainImageUri, fallbackImageUri } = useMemo(
    () => getImageUrisForFeaturedSector(catalog, sector),
    [catalog, sector],
  )

  return (
    <View
      style={[
        styles.card,
        isDark
          ? {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          : null,
      ]}
    >
      <View style={styles.main}>
        <Text style={[styles.title, isDark ? { color: theme.colors.text } : null]}>{sectionName}</Text>

        <View style={styles.row}>
          <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Weight per meter</Text>
          <Text style={[styles.colon, isDark ? { color: theme.colors.textSecondary } : null]}>:</Text>
          <Text style={[styles.value, isDark ? { color: theme.colors.text } : null]}>{weightText}</Text>
        </View>

        <View style={styles.row}>
          <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Standard Length</Text>
          <Text style={[styles.colon, isDark ? { color: theme.colors.textSecondary } : null]}>:</Text>
          <Text style={[styles.value, isDark ? { color: theme.colors.text } : null]}>{lengthText}</Text>
        </View>

        <Text style={[styles.date, isDark ? { color: theme.colors.textSecondary } : null]}>{dateText}</Text>
      </View>

      <View style={styles.side}>
        {(mainImageUri || fallbackImageUri) && (
          <View style={styles.imageWrapper}>
            <MaskedSectionImage
              uri={mainImageUri}
              fallbackUri={fallbackImageUri}
              width={40}
              height={40}
              color={isDark ? theme.colors.text : "#111827"}
            />
          </View>
        )}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.actionPrimary, styles.actionSpacer]}
            activeOpacity={0.8}
            onPress={() => onOpen(sector)}
          >
            <Feather name="eye" size={14} color="#ffffff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionDanger]}
            activeOpacity={0.8}
            onPress={() => onDelete(sector.id)}
          >
            <Feather name="trash-2" size={14} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
})

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

function getImageUrisForFeaturedSector(
  catalog: Section[],
  sector: FeaturedSectorRow,
): { mainImageUri: string | null; fallbackImageUri: string | null } {
  const section = catalog.find((s) => s.id === sector.section_id)
  if (!section) {
    return { mainImageUri: null, fallbackImageUri: null }
  }

  let imageVariant: Variant | undefined

  if (
    (section.id === 1 || section.label === "H") &&
    sector.section_type === "UC" &&
    section.types?.length
  ) {
    const rsjType = section.types.find((t) => t.name === "RSJ")
    const index = sector.variant_index ?? 0
    imageVariant = rsjType?.variants?.[index] ?? rsjType?.variants?.[0]
  } else if (section.types?.length && sector.section_type) {
    const fallbackType = section.types[0]
    const targetType = section.types.find((t) => t.name === sector.section_type) ?? fallbackType
    const index = sector.variant_index ?? 0
    imageVariant = targetType?.variants?.[index] ?? targetType?.variants?.[0]
  } else if (section.variants?.length) {
    const index = sector.variant_index ?? 0
    imageVariant = section.variants?.[index] ?? section.variants?.[0]
  }

  const mainImageUri = imageVariant?.bigImg || imageVariant?.img || null

  let fallbackImageUri: string | null = null
  const isISection = section.id === 2 || section.label === "I"
  if (isISection) {
    const fallbackUri = "/icons/ip1.svg"
    if (fallbackUri !== mainImageUri) {
      fallbackImageUri = fallbackUri
    }
  }

  return { mainImageUri, fallbackImageUri }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#f9fafb",
    flexDirection: "row",
  },
  main: {
    flex: 1,
    marginRight: 8,
  },
  side: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  imageWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  label: {
    fontSize: 12,
    color: "#4b5563",
  },
  colon: {
    fontSize: 12,
    color: "#4b5563",
    marginHorizontal: 4,
  },
  value: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111827",
  },
  date: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 6,
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
    bottom: -7,
  },
  actionSpacer: {
    marginRight: 8,
  },
  actionPrimary: {
    backgroundColor: colors.secondary,
  },
  actionDanger: {
    backgroundColor: "#c83c3c",
  },
})
