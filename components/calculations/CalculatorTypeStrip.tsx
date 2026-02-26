import React, { memo, useCallback, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { getLocalAssetModuleId, resolveLocalAssetUri } from '../../lib/localAssets'
import { useI18n } from '../../contexts/I18nContext'

type Props = {
  calculators: any[]
  selectedCalcId: number | null
  pinnedCalcId: number | null
  onSelect: (id: number) => void
  onTogglePin: (id: number) => void
  styles: any
  theme: any
}

export const CalculatorTypeStrip = memo(function CalculatorTypeStrip({
  calculators,
  selectedCalcId,
  pinnedCalcId,
  onSelect,
  onTogglePin,
  styles,
  theme,
}: Props) {
  const { language } = useI18n()

  const listRef = useRef<FlatList<any> | null>(null)
  const containerWidthRef = useRef(0)
  const contentWidthRef = useRef(0)
  const scrollXRef = useRef(0)
  const [showRightScrollHint, setShowRightScrollHint] = useState(false)
  const [showLeftScrollHint, setShowLeftScrollHint] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const recomputeScrollHint = useCallback(() => {
    const containerWidth = containerWidthRef.current
    const contentWidth = contentWidthRef.current
    if (!containerWidth || !contentWidth) {
      setShowRightScrollHint(false)
      setShowLeftScrollHint(false)
      return
    }

    const canScroll = contentWidth > containerWidth + 8
    const atStart = scrollXRef.current <= 8
    const atEnd = scrollXRef.current + containerWidth >= contentWidth - 8
    const nextRight = canScroll && !atEnd
    const nextLeft = canScroll && !atStart

    setShowRightScrollHint((current) => (current === nextRight ? current : nextRight))
    setShowLeftScrollHint((current) => (current === nextLeft ? current : nextLeft))
  }, [])

  const handleLeftScrollHintPress = useCallback(() => {
    if (!listRef.current) return
    const containerWidth = containerWidthRef.current
    const contentWidth = contentWidthRef.current
    if (!containerWidth || !contentWidth) return

    const step = Math.max(120, Math.round(containerWidth * 0.7))
    const nextOffset = Math.max(0, scrollXRef.current - step)
    scrollXRef.current = nextOffset
    listRef.current.scrollToOffset({ offset: nextOffset, animated: true })
    recomputeScrollHint()
  }, [recomputeScrollHint])

  const handleScrollHintPress = useCallback(() => {
    if (!listRef.current) return
    const containerWidth = containerWidthRef.current
    const contentWidth = contentWidthRef.current
    if (!containerWidth || !contentWidth) return

    const step = Math.max(120, Math.round(containerWidth * 0.7))
    const maxOffset = Math.max(0, contentWidth - containerWidth)
    const nextOffset = Math.min(maxOffset, scrollXRef.current + step)
    scrollXRef.current = nextOffset
    listRef.current.scrollToOffset({ offset: nextOffset, animated: true })
    recomputeScrollHint()
  }, [recomputeScrollHint])

  const handleContainerLayout = useCallback(
    (e: any) => {
      containerWidthRef.current = e?.nativeEvent?.layout?.width ?? 0
      recomputeScrollHint()
    },
    [recomputeScrollHint],
  )

  const handleContentSizeChange = useCallback(
    (w: number) => {
      contentWidthRef.current = w
      recomputeScrollHint()
    },
    [recomputeScrollHint],
  )

  const handleScrollEnd = useCallback(
    (e: any) => {
      setIsDragging(false)
      scrollXRef.current = e?.nativeEvent?.contentOffset?.x ?? 0
      recomputeScrollHint()
    },
    [recomputeScrollHint],
  )

  const renderCalculatorItem = useCallback(({ item }: { item: any }) => {
    const moduleId = item.symbol ? getLocalAssetModuleId(item.symbol) : null
    const imageSource = moduleId
      ? moduleId
      : item.symbol
        ? (() => {
            const imageUri = resolveLocalAssetUri(item.symbol)
            return imageUri ? { uri: imageUri } : null
          })()
        : null
    const isSelected = selectedCalcId === item.id
    const isPinned = pinnedCalcId === item.id

    const label = language === 'ar' ? (item.labelAr || item.label) : (item.label || item.labelAr)
    const isFlangeRingEn = language !== 'ar' && item?.formula === 'flange_ring'
    const labelString = String(label || '').trim()
    const flangeMatch = isFlangeRingEn
      ? labelString.match(/^(.*?)\s*\(([^()]*)\)\s*$/)
      : null

    return (
      <TouchableOpacity style={styles.itemButton} onPress={() => onSelect(item.id)}>
        <View style={[styles.itemImageWrapper, isSelected && styles.itemImageWrapperActive]}>
          {!!imageSource && <Image source={imageSource as any} style={styles.itemImage} />}

          {isSelected && (
            <TouchableOpacity
              style={[
                styles.itemPinButton,
                theme.isDark ? { backgroundColor: theme.colors.surface } : null,
                isPinned ? (theme.isDark ? { backgroundColor: theme.colors.surface2 } : null) : null,
              ]}
              onPress={(e) => {
                ;(e as any)?.stopPropagation?.()
                onTogglePin(item.id)
              }}
              activeOpacity={0.9}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.itemPinText,
                  theme.isDark ? { color: theme.colors.textSecondary } : null,
                  isPinned ? [styles.itemPinTextActive, theme.isDark ? { color: theme.colors.secondary } : null] : null,
                ]}
              >
                {isPinned ? '★' : '☆'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {flangeMatch ? (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[
              styles.itemLabel,
              {
                color: isSelected ? theme.colors.secondary : theme.colors.text,
                textAlign: 'center',
              },
            ]}
          >
            {flangeMatch[1].trim()}
            {'\n'}
            <Text
              style={[
                styles.itemLabelSub,
                {
                  color: isSelected ? theme.colors.secondary : theme.colors.text,
                },
              ]}
            >
              ({flangeMatch[2].trim()})
            </Text>
          </Text>
        ) : (
          <Text
            numberOfLines={2}
            ellipsizeMode="tail"
            style={[
              styles.itemLabel,
              {
                color: isSelected ? theme.colors.secondary : theme.colors.text,
              },
            ]}
          >
            {label}
          </Text>
        )}
      </TouchableOpacity>
    )
  }, [language, onSelect, onTogglePin, pinnedCalcId, selectedCalcId, styles, theme])

  const keyExtractor = useCallback((item: any) => item.id.toString(), [])
  const renderSeparator = useCallback(() => <View style={styles.sliderItemSeparator} />, [styles])

  const ITEM_WIDTH = 88
  const ITEM_SEPARATOR = 3
  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_WIDTH + ITEM_SEPARATOR,
      offset: (ITEM_WIDTH + ITEM_SEPARATOR) * index,
      index,
    }),
    [],
  )

  return (
    <View
      style={styles.sliderContainer}
      onLayout={handleContainerLayout}
    >
      <FlatList
        ref={(node) => {
          listRef.current = node
        }}
        data={calculators}
        renderItem={renderCalculatorItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.sliderListContent}
        ItemSeparatorComponent={renderSeparator}
        removeClippedSubviews={false}
        windowSize={9}
        initialNumToRender={calculators.length}
        maxToRenderPerBatch={calculators.length}
        updateCellsBatchingPeriod={50}
        onContentSizeChange={handleContentSizeChange}
        onScrollBeginDrag={() => setIsDragging(true)}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={getItemLayout}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      {showLeftScrollHint && !isDragging && (
        <View pointerEvents="box-none" style={[styles.sliderScrollHint, styles.sliderScrollHintLeft]}>
          <TouchableOpacity
            style={[
              styles.sliderScrollHintButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            activeOpacity={0.9}
            onPress={handleLeftScrollHintPress}
          >
            <Feather name="chevron-left" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}

      {showRightScrollHint && !isDragging && (
        <View pointerEvents="box-none" style={styles.sliderScrollHint}>
          <TouchableOpacity
            style={[
              styles.sliderScrollHintButton,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
            activeOpacity={0.9}
            onPress={handleScrollHintPress}
          >
            <Feather name="chevron-right" size={18} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
})
