import React, { useMemo, useRef, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image, Text } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { getLocalAssetModuleId, resolveLocalAssetUri } from '../../lib/localAssets'
import { useI18n } from '../../contexts/I18nContext'

type Props = {
  calculators: any[]
  selectedCalcId: number | null
  onSelect: (id: number) => void
  styles: any
  theme: any
}

export function CalculatorTypeStrip({ calculators, selectedCalcId, onSelect, styles, theme }: Props) {
  const { language } = useI18n()

  const listRef = useRef<FlatList<any> | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [contentWidth, setContentWidth] = useState(0)
  const [scrollX, setScrollX] = useState(0)

  const showScrollHint = useMemo(() => {
    if (!containerWidth || !contentWidth) return false
    const canScroll = contentWidth > containerWidth + 8
    const atEnd = scrollX + containerWidth >= contentWidth - 8
    return canScroll && !atEnd
  }, [containerWidth, contentWidth, scrollX])

  const handleScrollHintPress = () => {
    if (!listRef.current) return
    if (!containerWidth || !contentWidth) return

    const step = Math.max(120, Math.round(containerWidth * 0.7))
    const maxOffset = Math.max(0, contentWidth - containerWidth)
    const nextOffset = Math.min(maxOffset, scrollX + step)
    listRef.current.scrollToOffset({ offset: nextOffset, animated: true })
  }

  const renderCalculatorItem = ({ item }: { item: any }) => {
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
  }

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(e: any) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <FlatList
        ref={(node) => {
          listRef.current = node
        }}
        data={calculators}
        renderItem={renderCalculatorItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.sliderListContent}
        ItemSeparatorComponent={() => <View style={styles.sliderItemSeparator} />}
        removeClippedSubviews
        windowSize={7}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        onContentSizeChange={(w: number) => setContentWidth(w)}
        onScroll={(e: any) => setScrollX(e.nativeEvent.contentOffset.x)}
        scrollEventThrottle={16}
        horizontal
        showsHorizontalScrollIndicator={false}
      />

      {showScrollHint && (
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
}
