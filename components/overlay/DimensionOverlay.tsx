import { StyleSheet, Text, View } from "react-native"
import Svg, { Line, Path } from "react-native-svg"

import { useTheme } from "../../contexts/ThemeContext"
import type { OverlayConfig, OverlayEntry } from "./config"

type DimensionOverlayProps = {
  config: OverlayConfig
  values: Record<string, number | string | undefined>
  width?: number
  height?: number
}

type PlacementStyle = {
  top?: number
  bottom?: number
  left?: number
  right?: number
  width?: number
  height?: number
  translateX?: number
  translateY?: number
}

const DIMENSION_COLOR = "#cbd5e1"

function renderLabelValue(label: string, rawValue: number | string, labelColor: string, valueColor: string) {
  return (
    <Text>
      <Text style={[styles.label, { color: labelColor }]}>{label} </Text>
      <Text style={[styles.value, { color: valueColor }]}>{rawValue}</Text>
    </Text>
  )
}

export function DimensionOverlay({ config, values, width = 320, height = 220 }: DimensionOverlayProps) {
  const theme = useTheme()
  const labelColor = theme.isDark ? theme.colors.neutral : "#0f172a"
  const valueColor = theme.colors.secondary
  const floatingBg = theme.isDark ? theme.colors.surface : "#fff"

  return (
    <View style={[styles.overlay, { width, height }]} pointerEvents="none">
      {Object.entries(config).map(([key, cfg]) => {
        if (!cfg.enabled) return null
        const rawValue = values[key]
        // نسمح بالقيمة الفارغة "" حتى نرسم الخط مع الحرف فقط في الحالة الابتدائية
        if (rawValue == null) return null
        const displayValue =
          typeof rawValue === "number" || typeof rawValue === "string" ? rawValue : String(rawValue)

        const placement = computePlacement(cfg, width, height)
        const lineHeight = placement.height ?? height
        const lineWidth = placement.width ?? width
        const { width: placementWidth, height: placementHeight, translateX, translateY, ...positionStyle } = placement
        const transformArray = buildTransform(translateX, translateY)

        const labelNode = renderLabelValue(cfg.label, displayValue, labelColor, valueColor)
        const wrapLabel = (style?: any) => (style ? <View style={style}>{labelNode}</View> : labelNode)

        switch (cfg.style) {
          case "vertical-line":
          case "vertical-line-small": {
            const actualHeight = cfg.style === "vertical-line-small" ? Math.min(lineHeight, 80) : lineHeight
            const isH = key === "H" // نعامل H بشكل خاص

            // لتحديد موضع الفتحة في منتصف الخط لـ H
            const centerY = actualHeight / 2
            const gapHeight = isH ? 50 : 0 // ارتفاع الفتحة في منتصف الخط
            const gapTop = isH ? centerY - gapHeight / 2 : 6
            const gapBottom = isH ? centerY + gapHeight / 2 : actualHeight - 6

            const defaultVerticalLabelStyle = { marginLeft: -65 }
            return (
              <View
                key={key}
                style={[
                  styles.verticalContainer,
                  positionStyle,
                  transformArray.length ? { transform: transformArray } : null,
                ]}
              >
                <Svg width={24} height={actualHeight}>

                  {isH ? (
                    <>
                      {/* الجزء العلوي من الخط */}
                      <Line x1={12} y1={6} x2={12} y2={gapTop} stroke={DIMENSION_COLOR} strokeWidth={2} />
                      {/* الجزء السفلي من الخط */}
                      <Line
                        x1={12}
                        y1={gapBottom}
                        x2={12}
                        y2={actualHeight - 6}
                        stroke={DIMENSION_COLOR}
                        strokeWidth={2}
                      />
                    </>
                  ) : (
                    // خط كامل بدون فتحة لباقي الخطوط الرأسية (مثل Tf)
                    <Line x1={12} y1={6} x2={12} y2={actualHeight - 6} stroke={DIMENSION_COLOR} strokeWidth={2} />
                  )}
                  {/* العلامات الأفقية في الأعلى والأسفل */}
                  <Line x1={6} y1={6} x2={18} y2={6} stroke={DIMENSION_COLOR} strokeWidth={2} />
                  <Line
                    x1={6}
                    y1={actualHeight - 6}
                    x2={18}
                    y2={actualHeight - 6}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />
                </Svg>

                {isH ? (
                  // H: النص داخل الفتحة في منتصف الخط
                  <View
                    style={[
                      {
                        position: "absolute",
                        left: 0,             // مسافة النص عن الخط أفقياً
                        top: centerY - 10,     // تقريباً منتصف الفتحة

                      },
                      cfg.labelStyle,
                    ]}
                  >
                    {labelNode}
                  </View>
                ) : (
                  // باقي الخطوط الرأسية (مثل Tf): النص على جنب كما كان
                  wrapLabel(cfg.labelStyle ?? defaultVerticalLabelStyle)
                )}
              </View>
            )
          }
          case "horizontal-line": {
            const isGapLabel = cfg.label === "B" || cfg.label === "W" || cfg.label === "OD_mm"
            const isTw = cfg.label === "Tw"
            const actualWidth = placementWidth ?? lineWidth
            const centerX = actualWidth / 2
            const gapWidth =
              cfg.label === "OD_mm" ? 100: isGapLabel ? 60 : 0
            const gapLeft = isGapLabel ? centerX - gapWidth / 2 : 8
            const gapRight = isGapLabel ? centerX + gapWidth / 2 : actualWidth - 8

            return (
              <View
                key={key}
                style={[
                  styles.horizontalContainer,
                  positionStyle,
                  transformArray.length ? { transform: transformArray } : null,
                ]}
              >
                {isGapLabel
                  ? wrapLabel(
                      cfg.labelStyle ?? {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 2,
                        alignItems: "center",
                      },
                    )
                  : isTw
                    ? wrapLabel(
                        cfg.labelStyle ?? {
                          position: "absolute",
                          left: -100,
                          right: 0,
                          top: 3,
                          alignItems: "center",
                        },
                      )
                    : wrapLabel(cfg.labelStyle)}
                <Svg width={actualWidth} height={24}>
                  <Line x1={8} y1={12} x2={gapLeft} y2={12} stroke={DIMENSION_COLOR} strokeWidth={2} />
                  {isGapLabel ? (
                    <Line
                      x1={gapRight}
                      y1={12}
                      x2={actualWidth - 8}
                      y2={12}
                      stroke={DIMENSION_COLOR}
                      strokeWidth={2}
                    />
                  ) : (
                    <Line
                      x1={8}
                      y1={12}
                      x2={actualWidth - 8}
                      y2={12}
                      stroke={DIMENSION_COLOR}
                      strokeWidth={2}
                    />
                  )}
                  <Line x1={8} y1={6} x2={8} y2={18} stroke={DIMENSION_COLOR} strokeWidth={2} />
                  <Line
                    x1={actualWidth - 8}
                    y1={6}
                    x2={actualWidth - 8}
                    y2={18}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />
                </Svg>
              </View>
            )
          }
          case "corner-line": {
            return (
              <View key={key} style={[styles.cornerContainer, positionStyle]}>
                <Svg width={70} height={50}>
                  {/* المحور الشاقولي (العمودي) أطول */}
                  <Line
                    x1={20}
                    y1={0}
                    x2={20}
                    y2={30}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />

                  {/* المحور الأفقي أطول لكن أقصر قليلاً من قبل */}
                  <Line
                    x1={20}
                    y1={30}
                    x2={55}   // كان 60 → قصّرناه قليلاً
                    y2={30}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />

                  {/* المربّع الصغير عند زاوية التعامد (أكبر قليلاً) */}
                  <Path
                    d="M20 22 H28 V30 H20 Z"  // كان 20→26 عرضاً و 24→30 ارتفاعاً، الآن أكبر
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                    fill="none"
                  />

                  {/* الحد العلوي للمحور العمودي */}
                  <Line
                    x1={16}
                    y1={0}
                    x2={24}
                    y2={0}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />

                  {/* الحد في نهاية المحور الأفقي (نقلناه مع نهاية الخط) */}
                  <Line
                    x1={55}   // كان 60
                    y1={26}
                    x2={55}   // كان 60
                    y2={34}
                    stroke={DIMENSION_COLOR}
                    strokeWidth={2}
                  />
                </Svg>

                <View style={{ marginTop: -55, marginLeft: 30 }}>
                  {wrapLabel(cfg.labelStyle ?? { marginTop: 4 })}
                </View>
              </View>
            )
          }
          case "z-line": {
            const actualHeight = lineHeight
            const centerY = actualHeight / 2
            const gapHeight = 50
            const gapTop = centerY - gapHeight / 2
            const gapBottom = centerY + gapHeight / 2

            return (
              <View key={key} style={[styles.zLineContainer, positionStyle]}>
                {/* خط عمودي مع نهايات مسطحة، ندوره ليصبح مائلاً */}
                <View style={{ transform: [{ rotate: "-50deg" }] }}>
                  <Svg width={24} height={actualHeight}>
                    {/* الجزء العلوي من الخط المائل */}
                    <Line
                      x1={12}
                      y1={6}
                      x2={12}
                      y2={gapTop}
                      stroke={DIMENSION_COLOR}
                      strokeWidth={2}
                    />
                    {/* الجزء السفلي من الخط المائل */}
                    <Line
                      x1={12}
                      y1={gapBottom}
                      x2={12}
                      y2={actualHeight - 6}
                      stroke={DIMENSION_COLOR}
                      strokeWidth={2}
                    />
                    {/* العلامات الأفقية في الأعلى والأسفل */}
                    <Line x1={6} y1={6} x2={18} y2={6} stroke={DIMENSION_COLOR} strokeWidth={2} />
                    <Line
                      x1={6}
                      y1={actualHeight - 6}
                      x2={18}
                      y2={actualHeight - 6}
                      stroke={DIMENSION_COLOR}
                      strokeWidth={2}
                    />
                  </Svg>
                </View>

                {/* الرمز L في منتصف الخط تقريبًا */}
                <View
                  style={[
                    {
                      position: "absolute",
                      top: centerY - 10,
                      left: 0,
                      right: 0,
                      alignItems: "center",
                    },
                    cfg.labelStyle,
                  ]}
                >
                  {labelNode}
                </View>
              </View>
            )
          }
          case "floating-label":
          default:
            return (
              <View
                key={key}
                style={[
                  styles.floating,
                  { backgroundColor: floatingBg },
                  positionStyle,
                  transformArray.length ? { transform: transformArray } : null,
                  cfg.labelStyle,
                ]}
              >
                {labelNode}
              </View>
            )
        }
      })}
    </View>
  )
}

function buildTransform(translateX?: number, translateY?: number) {
  const transforms: Array<{ translateX: number } | { translateY: number }> = []
  if (typeof translateX === "number" && translateX !== 0) {
    transforms.push({ translateX })
  }
  if (typeof translateY === "number" && translateY !== 0) {
    transforms.push({ translateY })
  }
  return transforms
}

function computePlacement(entry: OverlayEntry, width: number, height: number): PlacementStyle {
  const tokens = `${entry.position ?? ""} ${entry.offset ?? ""}`.trim().split(/\s+/).filter(Boolean)
  const style: PlacementStyle = {}
  const translate = { translateX: 0, translateY: 0 }

  tokens.forEach((token) => {
    if (token === "transform") return
    if (token === "-translate-x-1/2") {
      translate.translateX -= 0.5
      return
    }
    if (token === "-translate-y-1/2") {
      translate.translateY -= 0.5
      return
    }
    if (token === "left-1/2") {
      style.left = width / 2
      return
    }
    if (token === "top-1/2") {
      style.top = height / 2
      return
    }
    if (token === "right-1/2") {
      style.right = width / 2
      return
    }
    if (token === "bottom-1/2") {
      style.bottom = height / 2
      return
    }
    const axisMatch = token.match(/^(top|bottom|left|right)-\[\s*(-?\d+)(px)?\s*\]$/)
    if (axisMatch) {
      const [, axis, valueRaw] = axisMatch
      style[axis as "top" | "bottom" | "left" | "right"] = Number(valueRaw)
      return
    }
    const axisPercentMatch = token.match(/^(top|bottom|left|right)-\[\s*(-?\d+(?:\.\d+)?)%\s*\]$/)
    if (axisPercentMatch) {
      const [, axis, valueRaw] = axisPercentMatch
      const numeric = Number(valueRaw) / 100
      const dimension = axis === "top" || axis === "bottom" ? height : width
      style[axis as "top" | "bottom" | "left" | "right"] = numeric * dimension
      return
    }
    const sizeMatch = token.match(/^(w|h)-\[\s*(-?\d+)(px)?\s*\]$/)
    if (sizeMatch) {
      const [, axis, valueRaw] = sizeMatch
      if (axis === "w") style.width = Number(valueRaw)
      else style.height = Number(valueRaw)
      return
    }
    const sizePercentMatch = token.match(/^(w|h)-\[\s*(-?\d+(?:\.\d+)?)%\s*\]$/)
    if (sizePercentMatch) {
      const [, axis, valueRaw] = sizePercentMatch
      const numeric = Number(valueRaw) / 100
      if (axis === "w") style.width = numeric * width
      else style.height = numeric * height
      return
    }
  })

  if (translate.translateX !== 0 && style.width) {
    style.left = (style.left ?? 0) + style.width * translate.translateX
  } else if (translate.translateX !== 0) {
    style.translateX = translate.translateX * width
  }
  if (translate.translateY !== 0 && style.height) {
    style.top = (style.top ?? 0) + style.height * translate.translateY
  } else if (translate.translateY !== 0) {
    style.translateY = translate.translateY * height
  }
  return style
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
  },
  label: {
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 12,
  },
  value: {
    fontSize: 12,
  },
  verticalContainer: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
  },
  horizontalContainer: {
    position: "absolute",
    alignItems: "center",
  },
  floating: {
    position: "absolute",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cornerContainer: {
    position: "absolute",
    alignItems: "center",
  },
  zLineContainer: {
    position: "absolute",
    alignItems: "center",
  },
})

