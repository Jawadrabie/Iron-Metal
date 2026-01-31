import React from 'react'
import { View, Text } from 'react-native'
import type { CalculationResults } from './types'

type Props = {
  results: CalculationResults | null
  styles: any
  theme: any
  calcT: any
  currencyCode: string
}

export function CalculationResultsPanel({ results, styles, theme, calcT, currencyCode }: Props) {
  if (!results) return null

  return (
    <View style={styles.resultsContainer}>
      <Text style={[styles.resultText, { color: theme.colors.text }]}>
        {calcT.weightPerMeter}: {results.unitWeightPerMeter} kg/m
      </Text>
      <Text style={[styles.resultText, { color: theme.colors.text }]}>
        {calcT.pieceWeight}: {results.pieceWeight} kg
      </Text>
      <Text style={[styles.resultText, { color: theme.colors.text }]}>
        {calcT.totalWeight}: {results.totalWeight} kg
      </Text>
      <Text style={[styles.resultText, { color: theme.colors.text, marginBottom: 0 }]}>
        {calcT.totalPrice}: {results.totalPrice} <Text style={styles.currencyPillText}>{currencyCode}</Text>
      </Text>
    </View>
  )
}
