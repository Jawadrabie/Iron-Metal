import { memo, useCallback, useEffect, useRef } from "react"
import { FlatList, Image, ListRenderItemInfo, StyleSheet, Text, TouchableOpacity, View } from "react-native"

import type { Type } from "../../types/sections"
import { MaskedSectionIcon } from "./MaskedSectionIcon"
import { prefetchLocalAssets, prefetchLocalSvgXml, resolveLocalAssetUri } from "../../lib/localAssets"
import { useTheme } from "../../contexts/ThemeContext"

type TypeSelectorProps = {
  types?: Type[]
  selectedType: string
  onSelectType: (typeName: string) => void
}

const resolveIconPath = (path?: string | null) => {
  if (!path) return null
  // نمرّر المسار الأصلي مثل "/icons/1.svg" حتى تعمل getLocalSvgXml مع الأصول المحلية
  return path
}

const resolveFlagUri = (path?: string | null) => {
  if (!path) return null
  const local = resolveLocalAssetUri(path)
  if (local) return local
  if (path.startsWith("http")) return path
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `https://iron-metal.net${normalized}`
}

type TypeCardProps = {
  type: Type
  isActive: boolean
  onSelect: (typeName: string) => void
}

const TypeCard = memo(function TypeCard({ type, isActive, onSelect }: TypeCardProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const iconUri = resolveIconPath(type.symbol)
  const flagUri = resolveFlagUri(type.flag)
  const handlePress = useCallback(() => onSelect(type.name), [onSelect, type.name])

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isDark
          ? {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
            }
          : null,
        isActive
          ? [
              styles.cardActive,
              isDark
                ? {
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surface2,
                  }
                : null,
            ]
          : null,
      ]}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      <View style={styles.iconWrapper}>
        {iconUri ? (
          <MaskedSectionIcon
            uri={iconUri}
            size={26}
            color={isDark ? (isActive ? theme.colors.text : theme.colors.icon) : undefined}
          />
        ) : (
          <Text style={[styles.iconFallback, isDark ? { color: theme.colors.text } : null]}>{type.name.charAt(0)}</Text>
        )}

        {flagUri && (
          <Image
            source={{ uri: flagUri }}
            fadeDuration={0}
            style={[
              styles.flag,
              isDark ? { borderColor: theme.colors.surface, backgroundColor: theme.colors.surface } : null,
            ]}
            resizeMode="cover"
          />
        )}
      </View>
      <Text
        style={[
          styles.cardLabel,
          isDark ? { color: theme.colors.textSecondary } : null,
          isActive ? [styles.cardLabelActive, isDark ? { color: theme.colors.text } : null] : null,
        ]}
      >
        {type.name}
      </Text>
    </TouchableOpacity>
  )
})

export function TypeSelector({ types, selectedType, onSelectType }: TypeSelectorProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  if (!types?.length) return null

  const listRef = useRef<FlatList<Type> | null>(null)

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false })

    const symbols = types.map((t) => t.symbol).filter(Boolean) as string[]
    const flags = types.map((t) => t.flag).filter(Boolean) as string[]

    prefetchLocalAssets([...symbols, ...flags]).catch(() => undefined)
    prefetchLocalSvgXml(symbols).catch(() => undefined)

    const remoteFlagUris = flags
      .map((path) => {
        if (!path) return null
        if (path.startsWith("http")) return path
        const local = resolveLocalAssetUri(path)
        if (local) return null
        const normalized = path.startsWith("/") ? path : `/${path}`
        return `https://iron-metal.net${normalized}`
      })
      .filter(Boolean) as string[]

    remoteFlagUris.forEach((uri) => {
      Image.prefetch(uri).catch(() => undefined)
    })
  }, [types])

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Type>) => (
      <TypeCard type={item} isActive={selectedType === item.name} onSelect={onSelectType} />
    ),
    [onSelectType, selectedType],
  )

  const keyExtractor = useCallback((item: Type) => item.name, [])

  return (
    <View style={[styles.container, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <FlatList
        ref={listRef}
        horizontal
        data={types}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        initialNumToRender={6}
        maxToRenderPerBatch={10}
        windowSize={5}
        overScrollMode="never"
        bounces={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // paddingTop: 40,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 0,
  },
  separator: {
    width: 8,
  },
  card: {
    width: 64,
    height: 74,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  cardActive: {
    borderColor: "#a3a3a3",
    backgroundColor: "#e5e7eb",
  },
  iconWrapper: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: {
    position: "absolute",
    top: -6,
    left: -10,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#ffffff",
    backgroundColor: "#ffffff",
  },
  iconFallback: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  cardLabel: {
    marginTop: 4,
    fontSize: 11,
    color: "#475569",
    fontWeight: "600",
  },
  cardLabelActive: {
    color: "#000000",
  },
})

