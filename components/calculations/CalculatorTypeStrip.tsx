import React from 'react'
import { View, FlatList, TouchableOpacity, Image, Text } from 'react-native'
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
    <View style={styles.sliderContainer}>
      <FlatList
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
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}
