import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Animated, LayoutChangeEvent, PanResponder, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View, Easing } from "react-native"

import type { Variant } from "../../types/sections"
import { useTheme } from "../../contexts/ThemeContext"

type VariantSliderProps = {
  variants: Variant[]
  selectedIndex: number
  sliderValue: number
  onSliderChange: (value: number) => void
  onVariantSelect: (index: number) => void
}

export function VariantSlider({ variants, selectedIndex, sliderValue, onSliderChange, onVariantSelect }: VariantSliderProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const accentColor = theme.colors.secondary
  const neutralColor = theme.colors.neutral
  const activeTitleColor = isDark ? "#111827" : "#ffffff"
  const total = variants.length
  const [visualDisplayIndex, setVisualDisplayIndex] = useState(selectedIndex)
  const safeIndex = Math.max(0, Math.min(total - 1, Math.round(visualDisplayIndex)))
  const activeVariant = variants[safeIndex] ?? variants[selectedIndex] ?? variants[0]
  const label =
    activeVariant?.name?.en ||
    (activeVariant as any)?.nameEn ||
    activeVariant?.size ||
    "-"

  const [trackWidth, setTrackWidth] = useState(0)
  // هذا المقاس يمثل مساحة اللمس (Hit Area) للدائرة
  const thumbSize = 40
  const animatedPercent = useRef(new Animated.Value(sliderValue)).current
  const isDraggingRef = useRef(false)
  const sliderValueRef = useRef(sliderValue)
  const dragStartPercentRef = useRef(sliderValue)
  const dragCurrentPercentRef = useRef(sliderValue)
  const thumbLastReportedIndexRef = useRef(safeIndex)
  const cardDragStartIndexRef = useRef(safeIndex)
  const cardLastIndexRef = useRef(safeIndex)
  const cardLastReportedIndexRef = useRef(safeIndex)
  const isCardDraggingRef = useRef(false)
  const lastChangeSourceRef = useRef<"thumb" | "track" | "arrow" | "card" | null>(null)
  const visualIndexAnim = useRef(new Animated.Value(selectedIndex)).current
  const visualDisplayIndexRef = useRef(selectedIndex)

  useEffect(() => {
    const id = visualIndexAnim.addListener(({ value }) => {
      setVisualDisplayIndex(value)
    })
    return () => {
      visualIndexAnim.removeListener(id)
    }
  }, [visualIndexAnim])

  useEffect(() => {
    visualDisplayIndexRef.current = visualDisplayIndex
  }, [visualDisplayIndex])

  const setVisualIndexAnimated = useCallback(
    (target: number) => {
      if (!total) return
      const clamped = Math.max(0, Math.min(total - 1, target))
      visualIndexAnim.stopAnimation()
      Animated.timing(visualIndexAnim, {
        toValue: clamped,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    },
    [total, visualIndexAnim],
  )

  useEffect(() => {
    if (!total) return

    // عند سحب الـ slider (الكرة أو المسار) بسرعة نريد أن تتبع الكروت الحركة فورًا بدون أنيميشن طويل
    if (lastChangeSourceRef.current === "thumb" || lastChangeSourceRef.current === "card") {
      const clamped = Math.max(0, Math.min(total - 1, selectedIndex))
      visualIndexAnim.stopAnimation()
      visualIndexAnim.setValue(clamped)
      return
    }

    // في باقي الحالات (الأسهم، الكروت نفسها، الخ) نستخدم أنيميشن سلس عادي
    setVisualIndexAnimated(selectedIndex)
  }, [selectedIndex, total, setVisualIndexAnimated, visualIndexAnim])

  useEffect(() => {
    // نحدّث القيمة الحالية في كل رندر لاستخدامها عند بداية السحب
    sliderValueRef.current = sliderValue

    if (isDraggingRef.current || isCardDraggingRef.current) {
      // أثناء السحب، نترك Animated.Value هو المصدر الأساسي للحركة
      return
    }

    // إذا التغيير جاء من سحب الكرة أو سحب الكروت، نترك Animated.Value على قيمته الأخيرة (لا نعمل سناب بصري)
    if (lastChangeSourceRef.current === "thumb" || lastChangeSourceRef.current === "card") {
      return
    }

    // عند الضغط على المسار أو الأسهم أو البطاقات: نحدّث الموضع مباشرة بدون ارتداد
    animatedPercent.setValue(sliderValue)
  }, [animatedPercent, sliderValue])

  const handleTouch = useCallback(
    (locationX: number) => {
      if (!trackWidth) return
      const relativeX = Math.max(0, Math.min(trackWidth, locationX))
      const ratio = Math.max(0, Math.min(1, relativeX / trackWidth))

      if (total > 1) {
        const targetIndex = Math.round(ratio * (total - 1))
        const snappedPercent = (targetIndex / (total - 1)) * 100
        lastChangeSourceRef.current = "track"
        onVariantSelect(targetIndex)
        onSliderChange(snappedPercent)
      } else {
        const percent = ratio * 100
        lastChangeSourceRef.current = "track"
        onSliderChange(percent)
      }
    },
    [onSliderChange, onVariantSelect, total, trackWidth],
  )

  const thumbPanResponder = useMemo(
    () => {
      const finalizeDrag = () => {
        isDraggingRef.current = false

        const finalPercent = Math.max(0, Math.min(100, dragCurrentPercentRef.current))

        const animateTo = (target: number) => {
          animatedPercent.stopAnimation()
          Animated.timing(animatedPercent, {
            toValue: target,
            duration: 140,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          }).start()
        }

        if (total > 1) {
          const ratio = finalPercent / 100
          const targetIndex = Math.round(ratio * (total - 1))
          const snappedPercent = (targetIndex / (total - 1)) * 100
          lastChangeSourceRef.current = "thumb"
          sliderValueRef.current = snappedPercent
          dragCurrentPercentRef.current = snappedPercent
          animateTo(snappedPercent)
          onVariantSelect(targetIndex)
          onSliderChange(snappedPercent)
        } else {
          lastChangeSourceRef.current = "thumb"
          sliderValueRef.current = finalPercent
          dragCurrentPercentRef.current = finalPercent
          animateTo(finalPercent)
          onSliderChange(finalPercent)
        }
      }

      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          isDraggingRef.current = true
          dragStartPercentRef.current = sliderValueRef.current
          dragCurrentPercentRef.current = sliderValueRef.current

          if (total > 1) {
            const baseIndex = Math.round((sliderValueRef.current / 100) * (total - 1))
            thumbLastReportedIndexRef.current = Math.max(0, Math.min(total - 1, baseIndex))
          } else {
            thumbLastReportedIndexRef.current = 0
          }
        },

        onPanResponderMove: (_, gestureState) => {
          if (!trackWidth) return

          // حركة الإصبع كنسبة مئوية مستمرة من عرض المسار
          const deltaPercent = (gestureState.dx / trackWidth) * 100
          let percent = dragStartPercentRef.current + deltaPercent
          percent = Math.max(0, Math.min(100, percent))

          // الدائرة (واللون البرتقالي) تتبع إصبعك مباشرة فقط بصريًا
          animatedPercent.setValue(percent)
          dragCurrentPercentRef.current = percent
          lastChangeSourceRef.current = "thumb"

          if (total > 1) {
            const nextVisual = (percent / 100) * (total - 1)
            visualIndexAnim.stopAnimation()
            visualIndexAnim.setValue(nextVisual)

            const nextIndex = Math.round(nextVisual)
            if (nextIndex !== thumbLastReportedIndexRef.current) {
              thumbLastReportedIndexRef.current = nextIndex
              const snappedPercent = (nextIndex / (total - 1)) * 100
              sliderValueRef.current = snappedPercent
              onVariantSelect(nextIndex)
              onSliderChange(snappedPercent)
            }
          }
        },
        onPanResponderRelease: finalizeDrag,
        onPanResponderTerminate: finalizeDrag,
      })
    },
    [animatedPercent, onSliderChange, onVariantSelect, total, trackWidth, visualIndexAnim],
  )

  const handleStep = useCallback(
    (direction: number) => {
      if (!total) return
      const baseIndex = selectedIndex
      const next = Math.min(total - 1, Math.max(0, baseIndex + direction))
      if (next === baseIndex) return

      onVariantSelect(next)
      setVisualIndexAnimated(next)

      const percent = total > 1 ? (next / (total - 1)) * 100 : 0
      lastChangeSourceRef.current = "arrow"
      onSliderChange(percent)
    },
    [onSliderChange, onVariantSelect, selectedIndex, total, setVisualIndexAnimated],
  )

  const cardPanResponder = useMemo(() => {
    const activationThreshold = 4
    // عتبة ثابتة تقريبًا مثل WheelPicker في الويب
    const dragStepPx = 70

    const finalizeFromLastIndex = () => {
      if (!total) return
      const snappedIndex = Math.max(0, Math.min(total - 1, Math.round(cardLastIndexRef.current)))
      const snappedPercent = total > 1 ? (snappedIndex / (total - 1)) * 100 : 0
      visualIndexAnim.stopAnimation()
      Animated.timing(visualIndexAnim, {
        toValue: snappedIndex,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()

      animatedPercent.stopAnimation()
      Animated.timing(animatedPercent, {
        toValue: snappedPercent,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()

      sliderValueRef.current = snappedPercent
      lastChangeSourceRef.current = "card"
      onVariantSelect(snappedIndex)
      onSliderChange(snappedPercent)
    }

    return PanResponder.create({
      // نترك اللمسة العادية تذهب للـ TouchableOpacity (الضغط على الكروت)
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // نلتقط فقط السحب الأفقي الواضح لتحريك الكروت
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > activationThreshold,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > Math.abs(gesture.dy) && Math.abs(gesture.dx) > activationThreshold,
      onPanResponderGrant: () => {
        // نبدأ من أقرب كرت حالي كمؤشر أساسي
        const baseIndex = Math.max(0, Math.min(total - 1, Math.round(visualDisplayIndexRef.current)))
        cardDragStartIndexRef.current = baseIndex
        cardLastIndexRef.current = baseIndex
        cardLastReportedIndexRef.current = baseIndex
        isCardDraggingRef.current = true
      },
      onPanResponderMove: (_, gesture) => {
        if (!total) return
        const rawIndex = cardDragStartIndexRef.current - gesture.dx / dragStepPx
        const nextVisual = Math.max(0, Math.min(total - 1, rawIndex))
        cardLastIndexRef.current = nextVisual
        visualIndexAnim.stopAnimation()
        visualIndexAnim.setValue(nextVisual)

        const percent = total > 1 ? (nextVisual / (total - 1)) * 100 : 0
        sliderValueRef.current = percent
        lastChangeSourceRef.current = "card"
        animatedPercent.setValue(percent)

        const nextIndex = Math.round(nextVisual)
        if (nextIndex !== cardLastReportedIndexRef.current) {
          cardLastReportedIndexRef.current = nextIndex
          const snappedPercent = total > 1 ? (nextIndex / (total - 1)) * 100 : 0
          sliderValueRef.current = snappedPercent
          onVariantSelect(nextIndex)
          onSliderChange(snappedPercent)
        }
      },
      onPanResponderRelease: () => {
        isCardDraggingRef.current = false
        finalizeFromLastIndex()
      },
      onPanResponderTerminate: () => {
        isCardDraggingRef.current = false
        finalizeFromLastIndex()
      },
    })
  }, [animatedPercent, onSliderChange, onVariantSelect, total, visualIndexAnim])

  const handleTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width)
  }

  const fillWidth = useMemo(() => {
    if (!trackWidth) return new Animated.Value(0)
    return animatedPercent.interpolate({
      inputRange: [0, 100],
      outputRange: [0, trackWidth],
      extrapolate: "clamp",
    })
  }, [animatedPercent, trackWidth])

  const thumbLeft = useMemo(() => {
    if (!trackWidth) return new Animated.Value(0)
    return animatedPercent.interpolate({
      inputRange: [0, 100],
      // نحرّك مركز الدائرة من بداية المسار (0) حتى نهايته (trackWidth)
      // لذلك نطرح نصف حجم الدائرة من البداية والنهاية
      outputRange: [-thumbSize / 2, Math.max(0, trackWidth - thumbSize / 2)],
      extrapolate: "clamp",
    })
  }, [animatedPercent, thumbSize, trackWidth])

  const badgeLeft = useMemo(() => {
    if (!trackWidth) return new Animated.Value(0)
    return animatedPercent.interpolate({
      inputRange: [0, 100],
      outputRange: [0, Math.max(0, trackWidth - 90)],
      extrapolate: "clamp",
    })
  }, [animatedPercent, trackWidth])

  return (
    <View style={styles.wrapper}>
      <View style={styles.sliderRow}>
        <TouchableOpacity style={styles.arrowButton} activeOpacity={0.8} onPress={() => handleStep(-1)}>
          <Text style={[styles.arrowText, styles.arrowTextLeft, { color: accentColor }]}>«</Text>
        </TouchableOpacity>
        <View style={styles.trackWrapper}>
          <View style={[styles.trackBackground, isDark ? { backgroundColor: theme.colors.surface2 } : null]}>
            <Animated.View
              style={[
                styles.trackFill,
                { width: fillWidth },
                { backgroundColor: accentColor },
              ]}
            />
          </View>
          <Pressable
            style={styles.touchTrack}
            onLayout={handleTrackLayout}
            onPressIn={(evt) => {
              handleTouch(evt.nativeEvent.locationX)
            }}
          >
            <Animated.View style={[styles.thumbHit, { left: thumbLeft }]} {...thumbPanResponder.panHandlers}>
              <View
                style={[
                  styles.thumb,
                  isDark ? { borderColor: neutralColor, backgroundColor: "#000000" } : null,
                ]}
              />
            </Animated.View>
          </Pressable>
          <Animated.View
            style={[
              styles.valueBadge,
              { left: badgeLeft },
              isDark ? { backgroundColor: theme.colors.surface } : null,
            ]}
          >
            <Text style={[styles.valueBadgeText, isDark ? { color: theme.colors.text } : null]}>{label}</Text>
          </Animated.View>
        </View>
        <TouchableOpacity style={styles.arrowButton} activeOpacity={0.8} onPress={() => handleStep(1)}>
          <Text style={[styles.arrowText, styles.arrowTextRight, { color: accentColor }]}>»</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsStage} {...cardPanResponder.panHandlers}>
        {variants.map((variant, index) => {
          // الفهرس المنطقي للكرت النشط (لا يتحرك بشكل كسري أثناء الأنيميشن)
          const centerIndex = Math.round(visualDisplayIndex)

          // إزاحة الكرت بصريًّا تعتمد على visualDisplayIndex المتحرك للأنيميشن السلس
          const offset = index - visualDisplayIndex
          const abs = Math.abs(offset)

          // مدى الكروت المرئية حول الكرت النشط (3 يمين و 3 يسار = 7 كروت ظاهرة)
          // نعتمد على offset المتحرك لضمان حركة سلسة حتى عند سحب الـ slider بسرعة
          const visibleRange = 3
          const logicalDistance = Math.abs(offset)
          if (logicalDistance > visibleRange) return null

          const isActive = centerIndex === index

          // قيم قريبة من WheelPicker في الويب: دوران + scale/opacity مع انزلاق أفقي بسيط
          // نقلل الزاوية والمسافة الأفقية قليلًا ليستوعب المسرح حتى 7 بطاقات
          const angleStep = 24
          const angle = offset * angleStep

          const baseOffsetX =70
          // نحافظ على المسافة الأصلية لأول كرتين، ونقرِّب فقط الكرت الثالث مع حركة سلسة بدون قفزة
          const extra = Math.max(0, abs - 2)
          const effectiveOffset = Math.sign(offset) * (Math.min(abs, 2) + extra * 0.3)
          const translateX = effectiveOffset * baseOffsetX

          const rotateY = angle
          const activeScale = 1.15
          const scale = isActive
            ? activeScale
            : Math.max(0.85, activeScale - Math.abs(offset) * 0.12)
          // إلغاء تأثير الشفافية على البطاقات الجانبية
          const opacity = 1

          // ترتيب الطبقات يعتمد على البعد المنطقي عن الكرت النشط،
          // حتى لا تتبادل الكروت الأمامية والخلفية أثناء الأنيميشن الكسري
          const depth = visibleRange - Math.round(logicalDistance)
          const zIndex = isActive ? visibleRange + 3 : depth + 1

          const labelText = variant.name?.en || (variant as any).nameEn || variant.size

          return (
            <TouchableOpacity
              key={`${labelText}-${index}`}
              activeOpacity={0.95}
              style={[
                styles.variantCard,
                isActive ? styles.centerCard : styles.sideCard,
                isActive
                  ? isDark
                    ? { backgroundColor: neutralColor, borderColor: neutralColor }
                    : { backgroundColor: "#000000", borderColor: "#000000" }
                  : isDark
                    ? { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }
                    : null,
                {
                  transform:
                    Platform.OS === "ios"
                      ? [{ translateX }, { scale }]
                      : [{ perspective: 900 }, { translateX }, { rotateY: `${rotateY}deg` }, { scale }],
                  opacity,
                  zIndex,
                },
              ]}
              onPress={() => {
                if (Math.round(visualDisplayIndex) === index) return
                onVariantSelect(index)
                setVisualIndexAnimated(index)
                const percent = total > 1 ? (index / (total - 1)) * 100 : 0
                lastChangeSourceRef.current = "card"
                onSliderChange(percent)
              }}
            >
              <Text
                style={
                  isActive
                    ? [styles.centerCardTitle, { color: activeTitleColor }]
                    : [styles.cardLabel, isDark ? { color: theme.colors.text } : null]
                }
                numberOfLines={1}
              >
                {labelText}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 0,
    // paddingHorizontal: 16,
    gap: 10,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackWrapper: {
    flex: 1,
    position: "relative",
    justifyContent: "center",
    paddingVertical: 8,
  },
  trackBackground: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#f1f5f9",
    overflow: "hidden",
  },
  trackFill: {
    height: "100%",
    backgroundColor: "#000000",
  },
  touchTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 8,
    height: 50,
  },
  arrowButton: {
    paddingHorizontal: 15,
    paddingVertical: 3,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -10,
  },
  arrowText: {
    fontSize: 35,
    fontWeight: "700",
  },
  arrowTextLeft: {
    color: "black",
  },
  arrowTextRight: {
    color: "black",
  },
  thumbHit: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    // نرفع الـ hit area قليلاً ليبقى مركز الدائرة قريباً من منتصف المسار
    top: -16,
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 5,
    borderColor: "#000000",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  valueBadge: {
    position: "absolute",
    top: 30,
    minWidth: 60,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#000000",
  },
  valueBadgeText: {
    color: "#fff",
    fontWeight: "700",
    textAlign: "center",
  },
  cardsStage: {
    marginTop: 16,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    width: "100%",
  },
  variantCard: {
    width: 110,
    height: 45,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#000000",
    backfaceVisibility: "hidden",
  },
  sideCard: {
    position: "absolute",
    backgroundColor: "#ffffff",
  },
  centerCard: {
    position: "absolute",
    backgroundColor: "#000000",
    borderColor: "#000000",
    zIndex: 3,
  },
  centerCardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardLabel: {
    color: "#000000",
    fontWeight: "500",
    fontSize: 14,
  },
  cardPlaceholderText: {
    color: "#b8c2d8",
  },
  cardDisabled: {
    opacity: 0.25,
  },
})

