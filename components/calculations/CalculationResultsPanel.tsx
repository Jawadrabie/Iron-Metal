import React, { useCallback, useEffect, useRef } from 'react'
import { Animated, View, Text, TouchableOpacity } from 'react-native'
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import type { CalculationResults } from './types'
import { useI18n } from '../../contexts/I18nContext'

type Props = {
  results: CalculationResults | null
  styles: any
  theme: any
  calcT: any
  currencyCode: string
  onShare?: () => void
  onDownloadPdf?: () => void
  isGeneratingPdf?: boolean
}

export function CalculationResultsPanel({
  results,
  styles,
  theme,
  calcT,
  currencyCode,
  onShare,
  onDownloadPdf,
  isGeneratingPdf = false,
}: Props) {
  const { isRTL } = useI18n()

  const DOWNLOAD_ICON_SIZE = 17
  const downloadFill = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (isGeneratingPdf) {
      downloadFill.setValue(0.66)
      Animated.timing(downloadFill, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
      }).start()
    } else {
      Animated.timing(downloadFill, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false,
      }).start()
    }
  }, [downloadFill, isGeneratingPdf])

  const downloadFillHeight = downloadFill.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DOWNLOAD_ICON_SIZE],
  })

  const handleCopy = useCallback(
    async (value: string) => {
      try {
        await Clipboard.setStringAsync(value)
      } catch {
        // ignore
      }
    },
    [],
  )

  if (!results) return null

  const rows = [
    {
      key: 'weightPerMeter',
      icon: 'tape-measure' as const,
      label: calcT.weightPerMeter,
      value: `${results.unitWeightPerMeter} kg/m`,
    },
    {
      key: 'pieceWeight',
      icon: 'cube-outline' as const,
      label: calcT.pieceWeight,
      value: `${results.pieceWeight} kg`,
    },
    {
      key: 'totalWeight',
      icon: 'weight-kilogram' as const,
      label: calcT.totalWeight,
      value: `${results.totalWeight} kg`,
    },
    {
      key: 'totalPrice',
      icon: 'currency-usd' as const,
      label: calcT.totalPrice,
      value: `${results.totalPrice}${currencyCode ? ` ${currencyCode}` : ''}`,
    },
  ]

  return (
    <View style={styles.resultsContainer}>
      {rows.map((row, idx) => (
        <View
          key={row.key}
          style={[
            styles.resultRow,
            isRTL ? { flexDirection: 'row-reverse', justifyContent: 'flex-start' } : null,
            idx === rows.length - 1 ? { marginBottom: 0 } : null,
          ]}
        >
          {isRTL ? (
            <>
              <MaterialCommunityIcons name={row.icon as any} size={16} color={theme.colors.textSecondary} />
              <Text
                style={[
                  styles.resultText,
                  {
                    color: theme.colors.text,
                    marginBottom: 0,
                    flex: 1,
                    minWidth: 0,
                    textAlign: 'right',
                    writingDirection: 'rtl',
                  },
                ]}
                numberOfLines={1}
              >
                {row.label}
                {': '}
                <Text
                  style={[
                    styles.resultValueText,
                    {
                      color: theme.colors.text,
                      writingDirection: 'ltr',
                    },
                  ]}
                >
                  {row.value}
                </Text>
              </Text>
              <TouchableOpacity
                style={styles.resultCopyButton}
                onPress={() => handleCopy(`${row.label}: ${row.value}`)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="copy" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name={row.icon as any} size={16} color={theme.colors.textSecondary} />
              <Text
                style={[styles.resultText, { color: theme.colors.text, marginBottom: 0, flex: 1 }]}
                numberOfLines={1}
              >
                {`${row.label}: ${row.value}`}
              </Text>
              <TouchableOpacity
                style={styles.resultCopyButton}
                onPress={() => handleCopy(`${row.label}: ${row.value}`)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="copy" size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ))}

      <View
        style={[
          styles.resultsActionsRow,
          isRTL ? { justifyContent: 'flex-start' } : null,
        ]}
      >
        <TouchableOpacity
          style={[styles.resultsActionButton, !onShare ? { opacity: 0.5 } : null]}
          onPress={onShare}
          activeOpacity={0.85}
          disabled={!onShare}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Feather name="share-2" size={17} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.resultsActionButton,
            !onDownloadPdf || isGeneratingPdf ? { opacity: 0.5 } : null,
          ]}
          onPress={onDownloadPdf}
          activeOpacity={0.85}
          disabled={!onDownloadPdf || isGeneratingPdf}
          accessibilityRole="button"
          accessibilityLabel="Download PDF"
        >
          <View
            style={{
              width: DOWNLOAD_ICON_SIZE,
              height: DOWNLOAD_ICON_SIZE,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="download" size={DOWNLOAD_ICON_SIZE} color={theme.colors.text} />
            </View>
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: downloadFillHeight,
                overflow: 'hidden',
                alignItems: 'center',
                justifyContent: 'flex-start',
              }}
            >
              <Feather name="download" size={DOWNLOAD_ICON_SIZE} color="#ff9800" />
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  )
}
