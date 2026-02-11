import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Alert, I18nManager, Image, Keyboard, Linking, Platform, Share, Text, TouchableOpacity, View } from "react-native"
import * as Sharing from "expo-sharing"
import * as Clipboard from "expo-clipboard"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { captureRef } from "react-native-view-shot"
import { Feather } from "@expo/vector-icons"
import { getCurrencyByCountry } from "../../lib/currency-utils"
import { useLanguage } from "../../hooks/useLanguage"
import { useTheme } from "../../contexts/ThemeContext"
import {
  deleteFeaturedSectorMobile,
  getFeaturedSectorsMobile,
  saveFeaturedSectorMobile,
} from "../../lib/featured-sectors"
import { getCurrentUser } from "../../lib/auth"
import { generateCalculatorPdf } from "../../lib/pdf/generateCalculatorPdf"

import type { Variant } from "../../types/sections"
import { type Dims, useSidebarCalculations } from "../../hooks/useSidebarCalculations"
import { BasicCalculatorModal } from "./BasicCalculatorModal"
import { calculatorStyles as styles } from "./styles"
import { DimInputsSection } from "./DimInputsSection"
import { LengthAndPiecesSection } from "./LengthAndPiecesSection"
import { TotalsSection } from "./TotalsSection"
import { ActionButtonsRow } from "./ActionButtonsRow"
import { ErrorReportModal } from "./ErrorReportModal"
import { DEFAULT_DIMS, isDimsSection } from "./constants"
import { buildFeaturedPayload, buildShareMessage, buildShareUrl } from "./utils"
import { getLocalAssetModuleId, resolveLocalBigIconUri } from "../../lib/localAssets"
import { Asset } from "expo-asset"

export type CalculatorPanelProps = {
  selectedSectionId: number | null
  selectedType: string
  selectedVariantIndex: number
  sliderValue: number
  currentVariant?: Variant | null
  initialDims?: Dims | null
  onDimsChange?: (dims: Dims) => void
  initialPricePerKgInput?: string
  initialRequiredInput?: string
  initialLengthInput?: string
  initialLengthUnit?: "m" | "mm"
  presetKey?: string | null
  prefillKey?: string | null
  prefillPricePerKgInput?: string
  prefillRequiredInput?: string
  prefillLengthInput?: string
  prefillLengthUnit?: "m" | "mm"
  prefillDims?: Dims
  onShowBanner?: (type: "success" | "error", message: string) => void
}

// استخدم مفتاحًا جديدًا لتخزين العملة التلقائية حتى لا نتأثر بأي قيمة قديمة تم اختيارها يدويًّا
const CURRENCY_STORAGE_KEY = "@ironmetal:auto_currency_code_v3"
const FEATURED_CALC_STORAGE_PREFIX = "@ironmetal:calc_featured_v1:"

// كاش في الذاكرة لعمر التطبيق حتى تظهر العملة مباشرة في نفس الجلسة بدون انتظار AsyncStorage
let inMemoryCurrencyCode: string | null = null

// كاش في الذاكرة لحالة التمييز (featured) حسب إعدادات الحاسبة الحالية
const featuredCache: Record<string, boolean> = {}

const BANNER_STRINGS = {
  en: {
    errorTitle: "Error",
    successTitle: "Success",
    copyFailed: "Copy failed",
    shareFailedTitle: "Share failed",
    shareFailedBody: "Unable to open share sheet.",
    downloadFailedTitle: "Download failed",
    downloadFailedBody: "Unable to generate PDF. Please try again.",
    mustLoginDownloadPdf: "You must sign in before downloading the PDF.",
    selectSectionFirst: "Select a section first",
    removedFromFeatured: "Removed from featured",
    savedToFeatured: "Saved to featured",
    paintCalculatorTitle: "Paint calculator",
    paintCalculatorBody: "Paint calculator is available on the website only for now.",
    scientificCalculatorTitle: "Scientific calculator",
    scientificCalculatorBody: "Scientific calculator is not available in the mobile app yet.",
  },
  ar: {
    errorTitle: "خطأ",
    successTitle: "تم",
    copyFailed: "فشل النسخ",
    shareFailedTitle: "فشل المشاركة",
    shareFailedBody: "تعذر فتح نافذة المشاركة.",
    downloadFailedTitle: "فشل التحميل",
    downloadFailedBody: "تعذر إنشاء ملف PDF. حاول مرة أخرى.",
    mustLoginDownloadPdf: "يجب تسجيل الدخول قبل تنزيل ملف PDF.",
    selectSectionFirst: "يرجى اختيار قطاع أولاً",
    removedFromFeatured: "تمت الإزالة من المميزة",
    savedToFeatured: "تم الحفظ في المميزة",
    paintCalculatorTitle: "حاسبة الدهان",
    paintCalculatorBody: "حاسبة الدهان متاحة على الموقع فقط حالياً.",
    scientificCalculatorTitle: "آلة حاسبة علمية",
    scientificCalculatorBody: "الآلة الحاسبة العلمية غير متاحة في تطبيق الموبايل حالياً.",
  },
} as const

const getFeatureKey = (
  selectedSectionId: number | null,
  selectedType: string,
  selectedVariantIndex: number,
  sliderValue: number,
) => {
  if (selectedSectionId == null) return null

  const normalizedVariantIndex = Number.isFinite(selectedVariantIndex) ? selectedVariantIndex : undefined
  const normalizedSliderValue = Number.isFinite(sliderValue) ? String(sliderValue) : undefined

  return `${selectedSectionId}:${selectedType || ""}:${normalizedVariantIndex ?? ""}:${
    normalizedSliderValue ?? ""
  }`
}

export function CalculatorPanel({
  selectedSectionId,
  selectedType,
  selectedVariantIndex,
  sliderValue,
  currentVariant,
  initialDims,
  onDimsChange,
  initialPricePerKgInput,
  initialRequiredInput,
  initialLengthInput,
  initialLengthUnit,
  presetKey,
  prefillKey,
  prefillPricePerKgInput,
  prefillRequiredInput,
  prefillLengthInput,
  prefillLengthUnit,
  prefillDims,
  onShowBanner,
}: CalculatorPanelProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { language } = useLanguage("en")
  const t = BANNER_STRINGS[language]
  const [pricePerKgInput, setPricePerKgInput] = useState("1")
  const [requiredInput, setRequiredInput] = useState("1")
  const [lengthInput, setLengthInput] = useState("12")
  const [lengthUnit, setLengthUnit] = useState<"m" | "mm">("m")
  const [currencyCode, setCurrencyCode] = useState(() => inMemoryCurrencyCode ?? "")
  const [dims, setDims] = useState<Dims>(initialDims ?? DEFAULT_DIMS)
  const [isActualWeight, setIsActualWeight] = useState(false)
  const [dimsUnitDropdownOpen, setDimsUnitDropdownOpen] = useState(false)
  const [densityDropdownOpen, setDensityDropdownOpen] = useState(false)
  const [lengthUnitDropdownOpen, setLengthUnitDropdownOpen] = useState(false)
  const [basicCalcOpen, setBasicCalcOpen] = useState(false)
  const [errorReportOpen, setErrorReportOpen] = useState(false)
  const [presetKeyApplied, setPresetKeyApplied] = useState<string | null>(null)
  const [presetSectionId, setPresetSectionId] = useState<number | null>(null)
  const [prefillKeyApplied, setPrefillKeyApplied] = useState<string | null>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const sectorImageCaptureRef = useRef<View | null>(null)
  const cardRef = useRef<View | null>(null)

  const initialFeatureKey = getFeatureKey(
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    sliderValue,
  )
  const [isFeatured, setIsFeatured] = useState(() =>
    initialFeatureKey ? featuredCache[initialFeatureKey] ?? false : false,
  )

  useEffect(() => {
    if (!isDimsSection(selectedSectionId)) return
    setDims(initialDims ?? DEFAULT_DIMS)
  }, [selectedSectionId])

  useEffect(() => {
    setIsActualWeight(false)
  }, [selectedSectionId, selectedType, selectedVariantIndex, sliderValue])

  useEffect(() => {
    if (!presetKey) return
    if (presetKeyApplied === presetKey) return

    setPresetKeyApplied(presetKey)
    setPresetSectionId(selectedSectionId ?? null)

    if (initialPricePerKgInput != null) setPricePerKgInput(initialPricePerKgInput)
    if (initialRequiredInput != null) setRequiredInput(initialRequiredInput)
    if (initialLengthInput != null) setLengthInput(initialLengthInput)
    if (initialLengthUnit != null) setLengthUnit(initialLengthUnit)
    if (isDimsSection(selectedSectionId) && initialDims) {
      setDims(initialDims)
    }
  }, [
    presetKey,
    presetKeyApplied,
    initialPricePerKgInput,
    initialRequiredInput,
    initialLengthInput,
    initialLengthUnit,
    initialDims,
    selectedSectionId,
  ])

  useEffect(() => {
    if (!presetKeyApplied) return
    if (presetKey) return

  useEffect(() => {
    if (!prefillKey) return
    if (prefillKeyApplied === prefillKey) return

    setPrefillKeyApplied(prefillKey)
    if (prefillPricePerKgInput != null) setPricePerKgInput(prefillPricePerKgInput)
    if (prefillRequiredInput != null) setRequiredInput(prefillRequiredInput)
    if (prefillLengthInput != null) setLengthInput(prefillLengthInput)
    if (prefillLengthUnit != null) setLengthUnit(prefillLengthUnit)
    if (isDimsSection(selectedSectionId) && prefillDims) {
      setDims(prefillDims)
    }
  }, [
    prefillKey,
    prefillKeyApplied,
    prefillPricePerKgInput,
    prefillRequiredInput,
    prefillLengthInput,
    prefillLengthUnit,
    prefillDims,
    selectedSectionId,
  ])

  useEffect(() => {
    if (prefillKey) return
    if (!prefillKeyApplied) return
    setPrefillKeyApplied(null)
  }, [prefillKey, prefillKeyApplied])

    setPresetKeyApplied(null)
    setPresetSectionId(null)
    setPricePerKgInput("1")
    setRequiredInput("1")
    setLengthInput("12")
    setLengthUnit("m")
  }, [presetKey, presetKeyApplied])

  useEffect(() => {
    if (!presetKeyApplied) return
    if (presetSectionId == null) return
    if (selectedSectionId == null) return
    if (selectedSectionId === presetSectionId) return

    setPricePerKgInput("1")
    setRequiredInput("1")
    setLengthInput("12")
    setLengthUnit("m")
  }, [selectedSectionId, presetKeyApplied, presetSectionId])

  useEffect(() => {
    if (!isDimsSection(selectedSectionId)) return
    if (!onDimsChange) return

    const hasAny =
      dims.h != null || dims.w != null || dims.th != null || ("t" in dims && dims.t != null)

    if (!hasAny) return
    onDimsChange(dims)
  }, [dims, selectedSectionId])

  useEffect(() => {
    // إذا كان لدينا كاش في الذاكرة، استخدمه مباشرة ولا تعيد الاتصال أو قراءة AsyncStorage
    if (inMemoryCurrencyCode) {
      setCurrencyCode(inMemoryCurrencyCode)
      return
    }

    const initCurrency = async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY)
        if (stored) {
          inMemoryCurrencyCode = stored
          setCurrencyCode(stored)
          return
        }

        const apiKey = process.env.EXPO_PUBLIC_IPGEO_API_KEY
        if (!apiKey) {
          console.warn("[currency] missing EXPO_PUBLIC_IPGEO_API_KEY, skipping IP detection")
          return
        }

        console.log("[currency] fetching IP info from ipgeolocation.io ...")
        const response = await fetch(
          `https://api.ipgeolocation.io/ipgeo?apiKey=${apiKey}&fields=ip,country_name,country_code2`,
        )
        console.log("[currency] ipgeolocation status", response.status)
        if (!response.ok) {
          console.warn("[currency] ipgeolocation response not ok")
          return
        }
        const data = await response.json()
        console.log("[currency] ipgeolocation payload", data)
        const countryCode = (data && (data.country_code2 as string)) || null
        if (!countryCode) {
          console.warn("[currency] missing country_code2 in ipgeolocation payload")
          return
        }
        const currency = getCurrencyByCountry(countryCode)
        if (currency && currency.code) {
          console.log("[currency] resolved from country", countryCode, "->", currency.code)
          inMemoryCurrencyCode = currency.code
          setCurrencyCode(currency.code)
          await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code)
        }
      } catch (error) {
        console.warn("[currency] failed to detect country", error)
      }
    }

    void initCurrency()
  }, [])

  const notifyBanner = useCallback(
    (type: "success" | "error", message: string) => {
      if (onShowBanner) {
        onShowBanner(type, message)
      } else {
        Alert.alert(type === "error" ? t.errorTitle : t.successTitle, message)
      }
    },
    [onShowBanner, t.errorTitle, t.successTitle],
  )

  const handleCopyToClipboard = useCallback(
    async (value: string) => {
      try {
        await Clipboard.setStringAsync(value)
      } catch {
        notifyBanner("error", t.copyFailed)
      }
    },
    [notifyBanner, t.copyFailed],
  )

  const closeAllDropdowns = useCallback(() => {
    setDimsUnitDropdownOpen(false)
    setDensityDropdownOpen(false)
    setLengthUnitDropdownOpen(false)
    Keyboard.dismiss()
  }, [])

  const toggleDimsUnitDropdown = useCallback(() => {
    setDensityDropdownOpen(false)
    setLengthUnitDropdownOpen(false)
    setDimsUnitDropdownOpen((prev) => !prev)
  }, [])

  const toggleDensityDropdown = useCallback(() => {
    setDimsUnitDropdownOpen(false)
    setLengthUnitDropdownOpen(false)
    setDensityDropdownOpen((prev) => !prev)
  }, [])

  const toggleLengthUnitDropdown = useCallback(() => {
    setDimsUnitDropdownOpen(false)
    setDensityDropdownOpen(false)
    setLengthUnitDropdownOpen((prev) => !prev)
  }, [])

  const handleLengthUnitSelect = useCallback((unit: "m" | "mm") => {
    setLengthUnit(unit)
    setLengthUnitDropdownOpen(false)
  }, [])

  const handleDimUnitSelect = useCallback((unit: Dims["unit"]) => {
    setDims((prev) => ({ ...prev, unit }))
    setDimsUnitDropdownOpen(false)
  }, [])

  const handleDensitySelect = useCallback((value: string) => {
    setDims((prev) => ({ ...prev, density: value }))
    setDensityDropdownOpen(false)
  }, [])

  const handleDimFieldChange = useCallback((field: "h" | "w" | "th", value: string) => {
    setDims((prev) => ({
      ...prev,
      [field]: value === "" ? null : Number(value),
    }))
  }, [])

  const handleQuickLengthToggle = useCallback(() => {
    const current = Number.parseFloat(lengthInput)
    const isSixInMeters = lengthUnit === "m" && Math.abs(current - 6) < 1e-9
    const next = isSixInMeters ? 12 : 6
    setLengthUnit("m")
    setLengthInput(String(next))
  }, [lengthInput, lengthUnit])

  const dimsMode = isDimsSection(selectedSectionId)

  const hasBothWeights = useMemo(() => {
    return (
      currentVariant != null &&
      typeof currentVariant.theoreticalWeight === "number" &&
      typeof currentVariant.actualWeight === "number"
    )
  }, [currentVariant])

  const effectiveWeightPerMeter = useMemo(() => {
    if (!currentVariant) return null

    if (hasBothWeights) {
      return isActualWeight ? currentVariant.actualWeight : currentVariant.theoreticalWeight
    }

    return typeof currentVariant.weight === "number" ? currentVariant.weight : null
  }, [currentVariant, hasBothWeights, isActualWeight])

  const actualLinearWeightKgPerMForPdf = useMemo(() => {
    if (selectedSectionId !== 7 && selectedSectionId !== 8) return undefined
    if (!hasBothWeights) return undefined
    return typeof currentVariant?.actualWeight === "number" ? currentVariant.actualWeight : undefined
  }, [currentVariant, hasBothWeights, selectedSectionId])

  const weightPerMeter: number | null | undefined = dimsMode ? null : effectiveWeightPerMeter

  const lengthMeters = useMemo(() => {
    const raw = Number.parseFloat(lengthInput)
    const n = Number.isFinite(raw) && raw > 0 ? raw : 0
    if (lengthUnit === "mm") return n / 1000
    return n
  }, [lengthInput, lengthUnit])

  const required = useMemo(() => {
    const raw = Number.parseInt(requiredInput, 10)
    return Number.isFinite(raw) && raw > 0 ? raw : 0
  }, [requiredInput])

  const pricePerKg = useMemo(() => {
    const raw = Number.parseFloat(pricePerKgInput || "1")
    return Number.isFinite(raw) && raw > 0 ? raw : 1
  }, [pricePerKgInput])

  const { isDimsMode, linearMeterWeightKgPerM, weightOfPieceKg, priceOfPiece, totalWeightKg, totalPrice } =
    useSidebarCalculations({
      dims: dimsMode ? dims : undefined,
      weightPerMeter,
      pricePerKg,
      lengthMeters,
      required,
    })

  const sectorName = useMemo(() => {
    if (!currentVariant) return ""
    if (currentVariant.name && currentVariant.name.en) return currentVariant.name.en
    if (currentVariant.nameEn) return currentVariant.nameEn
    return currentVariant.size
  }, [currentVariant])

  const sectorImagePath = useMemo(() => {
    const infoPath = currentVariant?.info ?? null
    if (infoPath) return infoPath

    let path = currentVariant?.bigImg ?? null

    // استخدام نسخ PNG مخصصة للـ PDF فقط لهذه القطاعات كما في المنطق السابق
    if (selectedSectionId === 7) {
      // SHS
      path = "/icons/pdf-b-she.svg"
    } else if (selectedSectionId === 8) {
      // RHS
      path = "/icons/pdf-b-rhe.svg"
    } else if (selectedSectionId === 14) {
      // CHS
      path = "/icons/pdf-b-pipe.svg"
    }

    return path
  }, [currentVariant, selectedSectionId])

  const sectorImagePreviewUri = useMemo(() => {
    if (!sectorImagePath) return null
    return resolveLocalBigIconUri(sectorImagePath)
  }, [sectorImagePath])

  useEffect(() => {
    if (selectedSectionId == null) {
      setIsFeatured(false)
      return
    }

    let isCancelled = false

    const loadFeaturedState = async () => {
      const featureKey = getFeatureKey(
        selectedSectionId,
        selectedType,
        selectedVariantIndex,
        sliderValue,
      )

      if (!featureKey) {
        setIsFeatured(false)
        return
      }

      try {
        const stored = await AsyncStorage.getItem(FEATURED_CALC_STORAGE_PREFIX + featureKey)
        if (isCancelled) return

        if (stored === "1") {
          featuredCache[featureKey] = true
          setIsFeatured(true)
          return
        }
      } catch {
        setIsFeatured(false)
      }

      try {
        const { items } = await getFeaturedSectorsMobile(language)
        if (isCancelled) return

        const match = items.find((item) => {
          const normalizedVariantIndex = Number.isFinite(selectedVariantIndex)
            ? selectedVariantIndex
            : undefined
          const normalizedSliderValue = Number.isFinite(sliderValue) ? String(sliderValue) : undefined

          if (item.section_id !== selectedSectionId) return false
          if ((item.section_type || "") !== (selectedType || "")) return false
          if ((item.variant_index ?? undefined) !== (normalizedVariantIndex ?? undefined)) return false
          if ((item.slider_value ?? undefined) !== (normalizedSliderValue ?? undefined)) return false
          return true
        })

        setIsFeatured(!!match)

        if (match) {
          try {
            await AsyncStorage.setItem(FEATURED_CALC_STORAGE_PREFIX + featureKey, "1")
            featuredCache[featureKey] = true
          } catch {}
        }
      } catch {
        setIsFeatured(false)
      }
    }

    void loadFeaturedState()

    return () => {
      isCancelled = true
    }
  }, [language, selectedSectionId, selectedType, selectedVariantIndex, sliderValue])

  const handleShare = useCallback(async () => {
    const url = buildShareUrl({
      selectedSectionId,
      selectedType,
      selectedVariantIndex,
      sliderValue,
      isDimsMode,
      dims,
      pricePerKgInput,
      requiredInput,
      lengthInput,
      lengthUnit,
    })
    const message = buildShareMessage({
      isDimsMode,
      weightOfPieceKg,
      priceOfPiece,
      required,
      totalWeightKg,
      totalPrice,
      linearMeterWeightKgPerM,
      lengthMeters,
      currencyCode,
      sectorName,
    })

    try {
      await Share.share({
        message,
        url,
        title: "Steel Calculator",
      })
    } catch {
      Alert.alert(t.shareFailedTitle, t.shareFailedBody)
    }
  }, [
    currencyCode,
    dims,
    isDimsMode,
    lengthInput,
    lengthMeters,
    lengthUnit,
    linearMeterWeightKgPerM,
    priceOfPiece,
    pricePerKgInput,
    required,
    requiredInput,
    sectorName,
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    sliderValue,
    totalPrice,
    totalWeightKg,
    t.shareFailedBody,
    t.shareFailedTitle,
    weightOfPieceKg,
  ])

  const handleDownloadPdf = useCallback(async () => {
    if (isGeneratingPdf) return

    try {
      const { user } = await getCurrentUser()
      if (!user) {
        notifyBanner("error", t.mustLoginDownloadPdf)
        return
      }
    } catch {
      notifyBanner("error", t.mustLoginDownloadPdf)
      return
    }

    setIsGeneratingPdf(true)

    try {
      let sectorImageForPdf: string | null = sectorImagePath

      const moduleIdForPdf = getLocalAssetModuleId(sectorImagePath)
      if (moduleIdForPdf) {
        const asset = Asset.fromModule(moduleIdForPdf)
        try {
          if (!asset.localUri && asset.downloadAsync) {
            await asset.downloadAsync()
          }
        } catch {
          // ignore
        }
        sectorImageForPdf = asset.localUri ?? sectorImageForPdf
      }

      if (Platform.OS === "ios") {
        const moduleId = getLocalAssetModuleId(sectorImagePath)
        if (moduleId) {
          const asset = Asset.fromModule(moduleId)
          try {
            if (!asset.localUri && asset.downloadAsync) {
              await asset.downloadAsync()
            }
          } catch {
            // ignore
          }
          sectorImageForPdf = asset.localUri ?? sectorImageForPdf
        }
      }

      if (__DEV__) {
        console.log("[calculator] pdf sector image", {
          platform: Platform.OS,
          sectorImagePath,
          sectorImagePreviewUri,
          sectorImageForPdf,
        })
      }

      if (Platform.OS === "android" && !moduleIdForPdf && sectorImageCaptureRef.current && sectorImagePreviewUri) {
        try {
          const capturedUri = await captureRef(sectorImageCaptureRef.current, {
            format: "png",
            quality: 1,
          })
          sectorImageForPdf = capturedUri
        } catch {
          sectorImageForPdf = sectorImagePath
        }
      }

      const uri = await generateCalculatorPdf({
        companyName: "Iron & Metal",
        companyExtra: "",
        currencyCode,
        fileBaseName: sectorName || undefined,
        sectionId: selectedSectionId ?? undefined,
        sectionType: selectedType ?? undefined,
        variantIndex: selectedVariantIndex,
        sliderValue,
        linearWeightKgPerM: linearMeterWeightKgPerM,
        actualLinearWeightKgPerM: actualLinearWeightKgPerMForPdf,
        lengthMeters,
        unitWeightKg: weightOfPieceKg,
        required,
        unitPricePerPiece: priceOfPiece,
        totalWeightKg,
        totalPrice,
        sectorBigImg: sectorImageForPdf,
      })

      let canShare = false
      try {
        canShare = await Sharing.isAvailableAsync()
      } catch {
        canShare = false
      }

      if (canShare && !uri.startsWith("data:")) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share calculator PDF",
        } as any)
      } else {
        await Linking.openURL(uri)
      }
    } catch (error) {
      console.warn("[calculator] Failed to generate/share PDF", error)
      Alert.alert(t.downloadFailedTitle, t.downloadFailedBody)
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [
    currencyCode,
    isGeneratingPdf,
    lengthMeters,
    linearMeterWeightKgPerM,
    priceOfPiece,
    required,
    actualLinearWeightKgPerMForPdf,
    sectorImagePath,
    sectorImagePreviewUri,
    t.downloadFailedBody,
    t.downloadFailedTitle,
    totalPrice,
    totalWeightKg,
    weightOfPieceKg,
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    sliderValue,
  ])

  const handleSaveFeatured = useCallback(async () => {
    const featureKey = getFeatureKey(
      selectedSectionId,
      selectedType,
      selectedVariantIndex,
      sliderValue,
    )

    if (!featureKey) {
      notifyBanner("error", t.selectSectionFirst)
      return
    }

    // إذا كانت مميزة بالفعل، اعتبر الضغط الثاني إلغاء للتمييز
    if (isFeatured) {
      setIsFeatured(false)
      featuredCache[featureKey] = false

      try {
        await AsyncStorage.removeItem(FEATURED_CALC_STORAGE_PREFIX + featureKey)
      } catch {}

      // حاول أيضًا إزالة السجل المناظر من Supabase حتى لا يعود التمييز بعد إعادة الفتح
      try {
        const { items } = await getFeaturedSectorsMobile(language)
        const normalizedVariantIndex = Number.isFinite(selectedVariantIndex)
          ? selectedVariantIndex
          : undefined
        const normalizedSliderValue = Number.isFinite(sliderValue) ? String(sliderValue) : undefined

        const match = items.find((item) => {
          if (item.section_id !== selectedSectionId) return false
          if ((item.section_type || "") !== (selectedType || "")) return false
          if ((item.variant_index ?? undefined) !== (normalizedVariantIndex ?? undefined)) return false
          if ((item.slider_value ?? undefined) !== (normalizedSliderValue ?? undefined)) return false
          return true
        })

        if (match) {
          await deleteFeaturedSectorMobile(match.id, language)
        }
      } catch {}

      notifyBanner("success", t.removedFromFeatured)
      return
    }

    const payload = buildFeaturedPayload({
      selectedSectionId,
      selectedType,
      selectedVariantIndex,
      sliderValue,
      dims,
      lengthUnit,
      lengthMeters,
      pricePerKg,
      required,
      weightOfPieceKg,
      totalWeightKg,
      priceOfPiece,
      totalPrice,
      isDimsMode,
    })

    if (!payload) {
      notifyBanner("error", t.selectSectionFirst)
      return
    }

    // تلوين النجمة مباشرة (منطق متفائل)
    setIsFeatured(true)
    featuredCache[featureKey] = true

    const result = await saveFeaturedSectorMobile(payload, language)

    if (!result.success) {
      setIsFeatured(false)
      featuredCache[featureKey] = false
      notifyBanner("error", result.error || String(t.selectSectionFirst))
      return
    }

    notifyBanner("success", t.savedToFeatured)

    try {
      await AsyncStorage.setItem(FEATURED_CALC_STORAGE_PREFIX + featureKey, "1")
    } catch {}
  }, [
    dims,
    isDimsMode,
    isFeatured,
    lengthMeters,
    lengthUnit,
    language,
    notifyBanner,
    priceOfPiece,
    pricePerKg,
    required,
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    sliderValue,
    totalPrice,
    totalWeightKg,
    weightOfPieceKg,
  ])

  const handlePaintCalculator = useCallback(() => {
    Alert.alert(t.paintCalculatorTitle, t.paintCalculatorBody)
  }, [t.paintCalculatorBody, t.paintCalculatorTitle])

  const handleScientificCalculator = useCallback(() => {
    Alert.alert(
      t.scientificCalculatorTitle,
      t.scientificCalculatorBody,
    )
  }, [t.scientificCalculatorBody, t.scientificCalculatorTitle])

  const handleBasicCalculator = useCallback(() => {
    setBasicCalcOpen(true)
  }, [])

  const handleErrorReport = useCallback(() => {
    if (selectedSectionId == null) {
      notifyBanner("error", t.selectSectionFirst)
      return
    }

    setErrorReportOpen(true)
  }, [notifyBanner, selectedSectionId, t.selectSectionFirst])

  const reportCurrentValue = useMemo(() => {
    if (isDimsMode) {
      return weightOfPieceKg.toFixed(2)
    }

    return weightOfPieceKg.toFixed(2)
  }, [isDimsMode, weightOfPieceKg])

  const reportSliderValues = useMemo(() => {
    return Number.isFinite(sliderValue) ? String(sliderValue) : undefined
  }, [sliderValue])

  const reportCalculationParams = useMemo(() => {
    return {
      selected_section_id: selectedSectionId,
      selected_type: selectedType,
      variant_index: Number.isFinite(selectedVariantIndex) ? selectedVariantIndex : undefined,
      slider_value: Number.isFinite(sliderValue) ? sliderValue : undefined,
      is_dims_section: dimsMode,
      is_dims_mode: isDimsMode,
      dims: dimsMode ? dims : undefined,
      inputs: {
        price_per_kg: pricePerKg,
        price_per_kg_input: pricePerKgInput,
        required,
        required_input: requiredInput,
        length_input: lengthInput,
        length_unit: lengthUnit,
        length_meters: lengthMeters,
        currency_code: currencyCode,
      },
      outputs: {
        linear_meter_weight_kg_per_m: linearMeterWeightKgPerM,
        weight_of_piece_kg: weightOfPieceKg,
        price_of_piece: priceOfPiece,
        total_weight_kg: totalWeightKg,
        total_price: totalPrice,
      },
    }
  }, [
    currencyCode,
    dims,
    dimsMode,
    isDimsMode,
    lengthInput,
    lengthMeters,
    lengthUnit,
    linearMeterWeightKgPerM,
    priceOfPiece,
    pricePerKg,
    pricePerKgInput,
    required,
    requiredInput,
    selectedSectionId,
    selectedType,
    selectedVariantIndex,
    sliderValue,
    totalPrice,
    totalWeightKg,
    weightOfPieceKg,
  ])

  const handleDimsReset = useCallback(() => {
    setDims((prev) => ({
      ...prev,
      h: null,
      w: null,
      th: null,
      t: null,
    }))

    if (isDimsSection(selectedSectionId) && onDimsChange) {
      onDimsChange({
        ...dims,
        h: null,
        w: null,
        th: null,
        t: null,
      })
    }
    setDimsUnitDropdownOpen(false)
    setDensityDropdownOpen(false)
  }, [dims, onDimsChange, selectedSectionId])

  const renderLinearInfo = () => {
    if (dimsMode) {
      return (
        <View style={[styles.section, isDark ? { borderTopColor: theme.colors.border } : null]}>
          <View style={styles.row}>
            <Text style={[styles.label, isDark ? { color: theme.colors.textSecondary } : null]}>Unit Weight</Text>
            <View style={styles.totalPriceValueContainer}>
              <Text style={styles.value}>{weightOfPieceKg.toFixed(3)} kg</Text>
              <TouchableOpacity
                style={styles.copyIconButton}
                onPress={() => handleCopyToClipboard(`${weightOfPieceKg.toFixed(3)} kg`)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="copy" size={14} color={isDark ? theme.colors.icon : "#000000"} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )
    }

    return (
      <View style={[styles.section, isDark ? { borderTopColor: theme.colors.border } : null]}>
        <View style={styles.row}>
          <View style={styles.linearWeightLabelContainer}>
            <Text style={[styles.label, { flex: 0 }, isDark ? { color: theme.colors.textSecondary } : null]}>
              {hasBothWeights && isActualWeight ? "Actual Weight" : "Linear Weight"}
            </Text>
            {hasBothWeights && (
              <TouchableOpacity
                style={[
                  styles.linearWeightToggleButton,
                  isDark
                    ? {
                        backgroundColor: theme.colors.surface2,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
                onPress={() => setIsActualWeight((prev) => !prev)}
                activeOpacity={0.7}
              >
                <Feather
                  name={isActualWeight ? "refresh-ccw" : "refresh-cw"}
                  size={14}
                  color={isDark ? theme.colors.secondary : "#302C6D"}
                />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.totalPriceValueContainer}>
            <Text style={styles.value}>{linearMeterWeightKgPerM.toFixed(3)} kg/m</Text>
            <TouchableOpacity
              style={styles.copyIconButton}
              onPress={() => handleCopyToClipboard(`${linearMeterWeightKgPerM.toFixed(3)} kg/m`)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="copy" size={14} color={isDark ? theme.colors.icon : "#000000"} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.cardWrapper}>
      <View
        ref={cardRef}
        style={[
          styles.card,
          isDark
            ? {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              }
            : null,
        ]}
      >
        <Text style={[styles.title, isDark ? { color: theme.colors.text } : null]}>Calculator</Text>

        {sectorImagePreviewUri && (
          <View
            ref={sectorImageCaptureRef}
            collapsable={false}
            pointerEvents="none"
            style={{ position: "absolute", top: -1000, left: 0, width: 140, height: 100, opacity: 0 }}
          >
            <Image
              source={{ uri: sectorImagePreviewUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>
        )}

        <DimInputsSection
          dimsMode={dimsMode}
          dims={dims}
          dimsUnitDropdownOpen={dimsUnitDropdownOpen}
          densityDropdownOpen={densityDropdownOpen}
          cardRef={cardRef}
          onToggleUnitDropdown={toggleDimsUnitDropdown}
          onToggleDensityDropdown={toggleDensityDropdown}
          onSelectUnit={handleDimUnitSelect}
          onSelectDensity={handleDensitySelect}
          onChangeField={handleDimFieldChange}
          onReset={handleDimsReset}
        />

        {renderLinearInfo()}

        <LengthAndPiecesSection
          dimsMode={dimsMode}
          lengthInput={lengthInput}
          lengthUnit={lengthUnit}
          lengthUnitDropdownOpen={lengthUnitDropdownOpen}
          requiredInput={requiredInput}
          pricePerKgInput={pricePerKgInput}
          currencyCode={currencyCode}
          onToggleLengthUnitDropdown={toggleLengthUnitDropdown}
          onSelectLengthUnit={handleLengthUnitSelect}
          onChangeLengthInput={setLengthInput}
          onChangeRequiredInput={setRequiredInput}
          onChangePricePerKgInput={setPricePerKgInput}
          onQuickLengthToggle={handleQuickLengthToggle}
        />

        <TotalsSection
          totalWeightKg={totalWeightKg}
          totalPrice={totalPrice}
          currencyCode={currencyCode}
          onCopyTotalWeight={() => handleCopyToClipboard(`${totalWeightKg.toFixed(2)} kg`)}
          onCopyTotalPrice={() =>
            handleCopyToClipboard(`${totalPrice.toFixed(2)}${currencyCode ? ` ${currencyCode}` : ""}`)
          }
        />

        <ActionButtonsRow
          onPaint={handlePaintCalculator}
          onShare={handleShare}
          onDownload={handleDownloadPdf}
          onSave={handleSaveFeatured}
          onScientific={handleScientificCalculator}
          onBasic={handleBasicCalculator}
          onReport={handleErrorReport}
          isGeneratingPdf={isGeneratingPdf}
          isFeatured={isFeatured}
        />

        <BasicCalculatorModal isOpen={basicCalcOpen} onClose={() => setBasicCalcOpen(false)} />

        <ErrorReportModal
          isOpen={errorReportOpen}
          onClose={() => setErrorReportOpen(false)}
          sectionId={selectedSectionId ?? 0}
          sectionName={sectorName || "Unknown Section"}
          currentValue={reportCurrentValue}
          variantIndex={Number.isFinite(selectedVariantIndex) ? selectedVariantIndex : undefined}
          sliderValues={reportSliderValues}
          calculationParams={reportCalculationParams}
          selectedType={selectedType || ""}
          notify={notifyBanner}
        />
      </View>
    </View>
  )
}

