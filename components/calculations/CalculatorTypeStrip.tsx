import React from 'react'
import { View, FlatList, TouchableOpacity, Image, Text } from 'react-native'
import { resolveLocalAssetUri } from '../../lib/localAssets'

type Props = {
  calculators: any[]
  selectedCalcId: number | null
  onSelect: (id: number) => void
  styles: any
  theme: any
}

export function CalculatorTypeStrip({ calculators, selectedCalcId, onSelect, styles, theme }: Props) {
  const renderCalculatorItem = ({ item }: { item: any }) => {
    const imageUri = item.symbol ? resolveLocalAssetUri(item.symbol) : null
    const isSelected = selectedCalcId === item.id
    return (
      <TouchableOpacity style={styles.itemButton} onPress={() => onSelect(item.id)}>
        <View style={[styles.itemImageWrapper, isSelected && styles.itemImageWrapperActive]}>
          {imageUri && <Image source={{ uri: imageUri }} style={styles.itemImage} />}
        </View>
        <Text
          style={[
            styles.itemLabel,
            {
              color: isSelected ? theme.colors.secondary : theme.colors.text,
            },
          ]}
        >
          {item.labelAr}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.sliderContainer}>
      <FlatList
        data={calculators}
        renderItem={renderCalculatorItem}
        keyExtractor={(item) => item.id.toString()}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  )
}
