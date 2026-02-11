import { memo, useEffect, useMemo, useRef, useState } from "react"
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native"
import { SvgXml } from "react-native-svg"

import { getLocalSvgXml, prefetchLocalAssets, prefetchLocalSvgXml } from "../../lib/localAssets"

type SplashOverlayProps = {
  visible: boolean
  onDone: () => void
}

const LOGO_ASSETS = [
  "/icons/square I.svg",
  "/icons/I.svg",
  "/icons/square M.svg",
  "/icons/M.svg",
  "/icons/&.svg",
  "/icons/IRON&METAL.svg",
]

const useMounted = () => {
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])
  return mounted
}

export const SplashOverlay = memo(function SplashOverlay({ visible, onDone }: SplashOverlayProps) {
  const mounted = useMounted()
  const [svgs, setSvgs] = useState<Record<string, string | null>>({})
  const [assetsReady, setAssetsReady] = useState(false)

  const overlayOpacity = useRef(new Animated.Value(1)).current
  const entryAnimationRef = useRef<Animated.CompositeAnimation | null>(null)

  const squareI = useMemo(
    () => ({
      x: new Animated.Value(-200),
      y: new Animated.Value(-200),
      scale: new Animated.Value(0.5),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const letterI = useMemo(
    () => ({
      y: new Animated.Value(-200),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const squareM = useMemo(
    () => ({
      x: new Animated.Value(200),
      y: new Animated.Value(-200),
      scale: new Animated.Value(0.5),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const letterM = useMemo(
    () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(200),
      rotation: new Animated.Value(-90),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const ampersand = useMemo(
    () => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      scale: new Animated.Value(0),
      rotation: new Animated.Value(-180),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const wordmark = useMemo(
    () => ({
      y: new Animated.Value(100),
      opacity: new Animated.Value(0),
    }),
    [],
  )

  const loadingOpacity = useRef(new Animated.Value(0.7)).current
  const barTranslate = useRef(new Animated.Value(-1)).current

  useEffect(() => {
    if (!visible) return

    overlayOpacity.setValue(1)

    const loadSvgs = async () => {
      try {
        await prefetchLocalAssets(LOGO_ASSETS)
        await prefetchLocalSvgXml(LOGO_ASSETS)
      } catch {
        // ignore
      }

      const entries = await Promise.all(
        LOGO_ASSETS.map(async (path) => [path, await getLocalSvgXml(path)] as const),
      )
      if (!mounted.current) return
      const next: Record<string, string | null> = {}
      entries.forEach(([path, xml]) => {
        next[path] = xml
      })
      setSvgs(next)
      setAssetsReady(true)
    }

    loadSvgs().catch(() => undefined)
  }, [mounted, overlayOpacity, visible])

  useEffect(() => {
    if (visible) return
    setAssetsReady(false)
  }, [visible])

  useEffect(() => {
    if (!visible) return

    const loadingPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingOpacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(loadingOpacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
      ]),
    )

    const barLoop = Animated.loop(
      Animated.timing(barTranslate, {
        toValue: 1,
        duration: 2200,
        useNativeDriver: true,
      }),
    )

    barTranslate.setValue(-1)
    loadingPulse.start()
    barLoop.start()

    return () => {
      loadingPulse.stop()
      barLoop.stop()
    }
  }, [barTranslate, loadingOpacity, visible])

  useEffect(() => {
    if (!visible) return
    if (!assetsReady) return

    squareI.x.setValue(-200)
    squareI.y.setValue(-200)
    squareI.scale.setValue(0.5)
    squareI.opacity.setValue(0)

    letterI.y.setValue(-200)
    letterI.opacity.setValue(0)

    squareM.x.setValue(200)
    squareM.y.setValue(-200)
    squareM.scale.setValue(0.5)
    squareM.opacity.setValue(0)

    letterM.x.setValue(0)
    letterM.y.setValue(200)
    letterM.rotation.setValue(-90)
    letterM.opacity.setValue(0)

    ampersand.x.setValue(0)
    ampersand.y.setValue(0)
    ampersand.scale.setValue(0)
    ampersand.rotation.setValue(-180)
    ampersand.opacity.setValue(0)

    wordmark.y.setValue(100)
    wordmark.opacity.setValue(0)

    const easeOut = Easing.out(Easing.cubic)
    const ENTRY_DURATION = 1000
    const ENTRY_OPACITY_DURATION = 1000
    const DELAY_LETTER_I = 300
    const DELAY_SQUARE_M = 600
    const DELAY_LETTER_M = 900
    const DELAY_AMPERSAND = 1200
    const DELAY_WORDMARK = 1600
    const EXIT_DELAY = 200
    const EXIT_DURATION = 300
    const delayed = (delayMs: number, animation: Animated.CompositeAnimation) =>
      delayMs > 0 ? Animated.sequence([Animated.delay(delayMs), animation]) : animation

    const animateSquareI = Animated.parallel([
      Animated.timing(squareI.x, { toValue: 0, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareI.y, { toValue: 0, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareI.scale, { toValue: 1, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareI.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    const animateLetterI = Animated.parallel([
      Animated.timing(letterI.y, { toValue: 0, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(letterI.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    const animateSquareM = Animated.parallel([
      Animated.timing(squareM.x, { toValue: 130, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareM.y, { toValue: 130, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareM.scale, { toValue: 1, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(squareM.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    const animateLetterM = Animated.parallel([
      Animated.timing(letterM.x, { toValue: 130, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(letterM.y, { toValue: 130, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(letterM.rotation, { toValue: 0, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(letterM.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    const animateAmpersand = Animated.parallel([
      Animated.timing(ampersand.x, { toValue: 60, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(ampersand.y, { toValue: 130, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(ampersand.scale, { toValue: 1, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(ampersand.rotation, { toValue: 0, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(ampersand.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    const animateWordmark = Animated.parallel([
      Animated.timing(wordmark.y, { toValue: 240, duration: ENTRY_DURATION, easing: easeOut, useNativeDriver: true }),
      Animated.timing(wordmark.opacity, { toValue: 1, duration: ENTRY_OPACITY_DURATION, easing: easeOut, useNativeDriver: true }),
    ])

    entryAnimationRef.current?.stop()

    const entries = Animated.parallel([
      delayed(0, animateSquareI),
      delayed(DELAY_LETTER_I, animateLetterI),
      delayed(DELAY_SQUARE_M, animateSquareM),
      delayed(DELAY_LETTER_M, animateLetterM),
      delayed(DELAY_AMPERSAND, animateAmpersand),
      delayed(DELAY_WORDMARK, animateWordmark),
    ])

    entryAnimationRef.current = entries

    entries.start(({ finished }) => {
      if (!finished) return
      Animated.sequence([
        Animated.delay(EXIT_DELAY),
        Animated.timing(overlayOpacity, { toValue: 0, duration: EXIT_DURATION, useNativeDriver: true }),
      ]).start(({ finished: faded }) => {
        if (!faded) return
        if (mounted.current) {
          onDone()
        }
      })
    })

    return () => {
      entryAnimationRef.current?.stop()
      entryAnimationRef.current = null
    }
  }, [ampersand, assetsReady, letterI, letterM, mounted, onDone, overlayOpacity, squareI, squareM, visible, wordmark])

  if (!visible) return null

  const rotationM = letterM.rotation.interpolate({
    inputRange: [-90, 0],
    outputRange: ["-90deg", "0deg"],
  })

  const rotationAmp = ampersand.rotation.interpolate({
    inputRange: [-180, 0],
    outputRange: ["-180deg", "0deg"],
  })

  const { width } = Dimensions.get("window")
  const barWidth = Math.min(208, width * 0.55)

  const progressTranslateX = barTranslate.interpolate({
    inputRange: [-1, 1],
    outputRange: [-barWidth, barWidth],
  })

  return (
    <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} pointerEvents="auto">
      <View style={styles.centerWrap}>
        <View style={styles.contentWrap}>
          <View style={styles.logoStage}>
            <Animated.View
              style={[
                styles.squareI,
                {
                  opacity: squareI.opacity,
                  transform: [
                    { translateX: squareI.x },
                    { translateY: squareI.y },
                    { scale: squareI.scale },
                  ],
                },
              ]}
            >
              {svgs["/icons/square I.svg"] ? (
                <SvgXml xml={svgs["/icons/square I.svg"] as string} width={100} height={100} />
              ) : null}
            </Animated.View>

            <Animated.View style={[styles.letterI, { opacity: letterI.opacity, transform: [{ translateY: letterI.y }] }]}>
              {svgs["/icons/I.svg"] ? <SvgXml xml={svgs["/icons/I.svg"] as string} width={100} height={80} /> : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.squareM,
                {
                  opacity: squareM.opacity,
                  transform: [
                    { translateX: squareM.x },
                    { translateY: squareM.y },
                    { scale: squareM.scale },
                  ],
                },
              ]}
            >
              {svgs["/icons/square M.svg"] ? (
                <SvgXml xml={svgs["/icons/square M.svg"] as string} width={100} height={100} />
              ) : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.letterM,
                {
                  opacity: letterM.opacity,
                  transform: [
                    { translateX: letterM.x },
                    { translateY: letterM.y },
                    { rotate: rotationM },
                  ],
                },
              ]}
            >
              {svgs["/icons/M.svg"] ? <SvgXml xml={svgs["/icons/M.svg"] as string} width={80} height={80} /> : null}
            </Animated.View>

            <Animated.View
              style={[
                styles.ampersand,
                {
                  opacity: ampersand.opacity,
                  transform: [
                    { translateX: ampersand.x },
                    { translateY: ampersand.y },
                    { scale: ampersand.scale },
                    { rotate: rotationAmp },
                  ],
                },
              ]}
            >
              {svgs["/icons/&.svg"] ? <SvgXml xml={svgs["/icons/&.svg"] as string} width={80} height={80} /> : null}
            </Animated.View>

            <Animated.View style={[styles.wordmark, { opacity: wordmark.opacity, transform: [{ translateY: wordmark.y }] }]}>
              {svgs["/icons/IRON&METAL.svg"] ? (
                <SvgXml xml={svgs["/icons/IRON&METAL.svg"] as string} width={200} height={36} />
              ) : null}
            </Animated.View>
          </View>

          <View style={styles.loadingWrap}>
            <Animated.Text style={[styles.loadingText, { opacity: loadingOpacity }]}>Welcome back</Animated.Text>
            <View style={[styles.progressBar, { width: barWidth }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    transform: [{ translateX: progressTranslateX }],
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  )
})

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  centerWrap: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  contentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoStage: {
    width: 260,
    height: 260,
    position: "relative",
    left: 30,
  },
  squareI: {
    position: "absolute",
    left: 0,
    top: 0,
  },
  letterI: {
    position: "absolute",
    left: 0,
    top: 12,
  },
  squareM: {
    position: "absolute",
    width: 100,
    height: 100,
    left: -29,
    top: -32,
  },
  letterM: {
    position: "absolute",
    left: -20,
    top: -20,
  },
  ampersand: {
    position: "absolute",
    left: -36,
    top: -16,
  },
  wordmark: {
    position: "absolute",
    left: 8,
    top: -16,
  },
  loadingWrap: {
    marginTop: 28,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#302C6D",
    letterSpacing: 0.4,
  },
  progressBar: {
    marginTop: 10,
    height: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.6)",
    overflow: "hidden",
  },
  progressFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#302C6D",
    borderRadius: 999,
  },
})
