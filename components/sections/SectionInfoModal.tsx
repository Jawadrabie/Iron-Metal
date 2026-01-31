import {
  Modal,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Linking,
  ActivityIndicator,
  Share,
  Platform,
} from "react-native"
import type { View as RNView } from "react-native"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import * as Sharing from "expo-sharing"
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons"
import { captureRef } from "react-native-view-shot"

import { resolveLocalAssetUri } from "../../lib/localAssets"
import { useSectionsCart } from "../../hooks/useSectionsCart"
import { useLanguage } from "../../hooks/useLanguage"
import type { SectionCartItem } from "../../types/cart"
import { generateSectionsPdf } from "../../lib/pdf/generateSectionsPdf"
import { getCurrentUser } from "../../lib/auth"
import { useTheme } from "../../contexts/ThemeContext"

type Props = {
  visible: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  infoPath?: string | null
  country?: string | null
  data: Record<string, unknown>
  sectionId?: number
  sectionType?: string
  variantIndex?: number
  sliderValue?: number
}

import { GROUPS, LABELS } from "../../lib/sectionInfoSchema"

const BANNER_STRINGS = {
  en: {
    mustLoginDownloadPdf: "You must sign in before downloading the PDF.",
  },
  ar: {
    mustLoginDownloadPdf: "يجب تسجيل الدخول قبل تنزيل ملف PDF.",
  },
} as const

export function SectionInfoModal({
  visible,
  onClose,
  title,
  subtitle,
  infoPath,
  country,
  data,
  sectionId,
  sectionType,
  variantIndex,
  sliderValue,
}: Props) {
  const theme = useTheme()
  const { language } = useLanguage("en")
  const t = BANNER_STRINGS[language]

  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const [bannerType, setBannerType] = useState<"success" | "error" | null>(null)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showBanner = useCallback((type: "success" | "error", message: string) => {
    setBannerType(type)
    setBannerMessage(message)

    if (bannerTimeoutRef.current) {
      clearTimeout(bannerTimeoutRef.current)
    }

    bannerTimeoutRef.current = setTimeout(() => {
      setBannerMessage(null)
      setBannerType(null)
      bannerTimeoutRef.current = null
    }, 2500)
  }, [])

  useEffect(() => {
    return () => {
      if (bannerTimeoutRef.current) {
        clearTimeout(bannerTimeoutRef.current)
      }
    }
  }, [])

  const cleaned = useMemo(() => {
    const out: Record<string, string> = {}
    Object.entries(data || {}).forEach(([key, value]) => {
      if (value == null || typeof value === "object") return
      const formatted =
        typeof value === "number"
          ? Number.isInteger(value)
            ? String(value)
            : (value as number).toFixed(3)
          : String(value)
      out[key] = formatted
    })
    return out
  }, [data])

  const shareText = useMemo(() => {
    const lines: string[] = []

    if (title) {
      lines.push(String(title))
    }
    if (subtitle) {
      lines.push(String(subtitle))
    }

    GROUPS.forEach((group) => {
      const groupLines: string[] = []
      group.rows.forEach(({ key, unit }) => {
        const val = cleaned[key]
        if (val == null || val === "") return
        const label = LABELS[key] ?? key
        const unitText = unit ? ` ${unit}` : ""
        groupLines.push(`${label}: ${val}${unitText}`)
      })

      if (groupLines.length > 0) {
        if (lines.length > 0) {
          lines.push("")
        }
        lines.push(group.title)
        groupLines.forEach((ln) => lines.push(`- ${ln}`))
      }
    })

    return lines.join("\n")
  }, [title, subtitle, cleaned])

  const { items: cartItems, addItem, removeItem, clear } = useSectionsCart()
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [cartModalOpen, setCartModalOpen] = useState(false)
  const shareCaptureRef = useRef<RNView | null>(null)

  const flagPath = country ? `/icons/${country}.png` : undefined
  const localFlag = flagPath ? resolveLocalAssetUri(flagPath) : null
  const flagSource = localFlag ? { uri: localFlag } : undefined

  const localInfo = infoPath ? resolveLocalAssetUri(infoPath) : null
  const remoteInfoUrl = infoPath ? `https://iron-metal.net${infoPath}` : null

  const currentItem: SectionCartItem = useMemo(() => {
    const raw = data as any
    const itemImg = typeof raw?.img === "string" ? raw.img : undefined
    const itemBigImg = typeof raw?.bigImg === "string" ? raw.bigImg : undefined
    const itemInfoPath = typeof raw?.info === "string" ? raw.info : infoPath ?? null

    // في الكارت نفضّل تخزين مسار محلي كامل (file:/ أو asset:/) لصورة info إن توفر
    // حتى يستطيع مولّد الـ PDF قراءته مباشرة بدون الاعتماد على expo-asset داخل الـ APK
    let infoForPdf: string | null = itemInfoPath
    if (
      typeof localInfo === "string" &&
      (localInfo.startsWith("file:") ||
        localInfo.startsWith("asset:") ||
        localInfo.startsWith("content:"))
    ) {
      infoForPdf = localInfo
    }

    return {
      id: `${title || "section"}-${country || ""}-${cleaned.size || ""}`,
      title,
      subtitle,
      img: itemImg,
      bigImg: itemBigImg,
      info: infoForPdf,
      country: country || undefined,
      data,
      sectionId,
      sectionType,
      variantIndex,
      sliderValue,
    }
  }, [title, subtitle, country, data, cleaned, infoPath, localInfo])

  const isInCart = cartItems.some((it) => it.id === currentItem.id)

  const handleAddToCart = async () => {
    let infoForPdf: string | null | undefined = currentItem.info

    if (shareCaptureRef.current) {
      try {
        const uri = await captureRef(shareCaptureRef.current, {
          format: "png",
          quality: 1,
        })
        infoForPdf = uri
      } catch {
        infoForPdf = currentItem.info
      }
    }

    addItem({
      ...currentItem,
      info: infoForPdf ?? null,
    })
  }

  const handleRemoveFromCart = () => {
    removeItem(currentItem.id)
  }

  const handleClearCart = () => {
    clear()
  }

  const handleShare = async () => {
    const hasShareText = shareText.trim().length > 0
    if (!localInfo && !remoteInfoUrl && !hasShareText) return

    try {
      const shareTitle = title || "Section details"

      // على أندرويد: نشارك صورة فقط، نلتقطها من الـ View بخلفية بيضاء إن أمكن
      if (Platform.OS === "android") {
        let imageUri: string | null = null

        // نحاول أولاً التقاط صورة من الـ View الذي يحتوي على الرسمة مع خلفية بيضاء
        if (shareCaptureRef.current) {
          try {
            const uri = await captureRef(shareCaptureRef.current, {
              format: "png",
              quality: 1,
            })
            imageUri = uri
          } catch {
            imageUri = null
          }
        }

        // إن فشل الالتقاط نستخدم ملف الصورة المحلي كما كان سابقًا
        if (!imageUri && localInfo) {
          imageUri = localInfo
        }

        if (imageUri) {
          try {
            await Sharing.shareAsync(imageUri, { dialogTitle: shareTitle })
            // نشارك صورة فقط على أندرويد كما طلبت
            return
          } catch {
            // إذا فشلت مشاركة الصورة سنسقط إلى مشاركة النص فقط إن وجد
          }
        }

        // في حال لم تتوفر صورة أو فشل كل شيء، نشارك النص فقط كاحتياطي
        if (hasShareText) {
          await Share.share({
            message: shareText,
            title: shareTitle,
          })
        }

        return
      }

      // iOS والمنصات الأخرى: نلتقط صورة من الـ View المحلي ونشاركها مع النص
      let imageUri: string | null = null

      if (localInfo) {
        if (shareCaptureRef.current) {
          const uri = await captureRef(shareCaptureRef.current, {
            format: "png",
            quality: 1,
          })
          imageUri = uri
        } else {
          imageUri = localInfo
        }
      }

      if (imageUri && hasShareText) {
        await Share.share({
          message: shareText,
          url: imageUri,
          title: shareTitle,
        })
      } else if (imageUri) {
        await Share.share({
          url: imageUri,
          title: shareTitle,
        })
      } else if (hasShareText) {
        await Share.share({
          message: shareText,
          title: shareTitle,
        })
      }
    } catch (e) {
      console.warn("[section-info] Failed to share details", e)
    }
  }

  const handleDownloadPdf = async () => {
    if (!cartItems.length || isGeneratingPdf) return

    try {
      const { user } = await getCurrentUser()
      if (!user) {
        showBanner("error", t.mustLoginDownloadPdf)
        return
      }
    } catch {
      showBanner("error", t.mustLoginDownloadPdf)
      return
    }

    try {
      setIsGeneratingPdf(true)
      const uri = await generateSectionsPdf(cartItems)
      let canShare = false
      try {
        canShare = await Sharing.isAvailableAsync()
      } catch {
        canShare = false
      }

      // إذا كان هناك تطبيق مشاركة متاح والمسار يشير إلى ملف محلي، نستخدم مشاركة النظام
      if (canShare && !uri.startsWith("data:")) {
        await Sharing.shareAsync(uri)
      } else {
        // في الويب أو عند غياب مجلد قابل للكتابة نفتح الرابط مباشرة (data URL أو غيره)
        await Linking.openURL(uri)
      }
      // بعد إتمام إنشاء ومشاركة/فتح ملف الـ PDF بنجاح نغلق نافذة التفاصيل
      onClose()
    } catch (e) {
      console.warn("[section-info] Failed to generate/share PDF", e)
    } finally {
      setIsGeneratingPdf(false)
      setDownloadDialogOpen(false)
    }
  }

  const handleCloseAll = () => {
    setCartModalOpen(false)
    setDownloadDialogOpen(false)
    onClose()
  }

  if (!visible) return null

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleCloseAll}>
      <View style={[styles.backdrop, theme.isDark ? { backgroundColor: "rgba(30,30,30,0.9)" } : null]}>
        {bannerMessage && (
          <View
            style={[
              styles.banner,
              bannerType === "success" ? styles.bannerSuccess : styles.bannerError,
              theme.isDark
                ? {
                    backgroundColor:
                      bannerType === "success" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                  }
                : null,
            ]}
          >
            <Feather
              name={bannerType === "success" ? "check-circle" : "alert-circle"}
              size={16}
              color={
                bannerType === "success"
                  ? theme.isDark
                    ? theme.colors.success
                    : "#16A34A"
                  : theme.isDark
                    ? theme.colors.error
                    : "#b91c1b"
              }
            />
            <Text
              style={[
                styles.bannerText,
                bannerType === "error" && styles.bannerTextError,
                theme.isDark ? { color: theme.colors.text } : null,
              ]}
            >
              {bannerMessage}
            </Text>
          </View>
        )}

        <TouchableWithoutFeedback onPress={handleCloseAll}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        <View
          style={[
            styles.card,
            theme.isDark
              ? {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                }
              : null,
          ]}
        >
          {/* Header ثابت */}
          <View style={[styles.header, theme.isDark ? { borderBottomColor: theme.colors.border } : null]}>
            <View style={styles.headerText}>
              <Text style={[styles.title, theme.isDark ? { color: theme.colors.text } : null]}>{title || "Section details"}</Text>
              {subtitle ? (
                <Text style={[styles.subtitle, theme.isDark ? { color: theme.colors.textSecondary } : null]}>{subtitle}</Text>
              ) : null}
            </View>
            {flagSource && <Image source={flagSource} style={styles.flag} />}
            <TouchableOpacity onPress={handleCloseAll} style={styles.closeButton}>
              <Text style={[styles.closeText, theme.isDark ? { color: theme.colors.textSecondary } : null]}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Content قابل للتمرير داخل flex:1 */}
          <View style={styles.content}>
            <ScrollView
              style={styles.left}
              contentContainerStyle={styles.leftContent}
              overScrollMode="never"
              bounces={false}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {GROUPS.map((group) => {
                const hasAny = group.rows.some(({ key }) => cleaned[key] != null && cleaned[key] !== "")
                if (!hasAny) return null

                return (
                  <View key={group.title} style={[styles.group, theme.isDark ? { borderColor: theme.colors.border } : null]}>
                    <View style={[styles.groupHeader, theme.isDark ? { backgroundColor: theme.colors.surface2 } : null]}>
                      <Text style={[styles.groupTitle, theme.isDark ? { color: theme.colors.text } : null]}>{group.title}</Text>
                    </View>
                    {group.rows.map(({ key, unit }) => {
                      const val = cleaned[key]
                      if (val == null || val === "") return null
                      return (
                        <View key={key} style={styles.row}>
                          <Text style={[styles.rowLabel, theme.isDark ? { color: theme.colors.textSecondary } : null]}>{
                            LABELS[key] ?? key
                          }</Text>
                          <Text style={[styles.rowValue, theme.isDark ? { color: theme.colors.text } : null]}>{val}</Text>
                          <Text style={[styles.rowUnit, theme.isDark ? { color: theme.colors.textSecondary } : null]}>{unit || ""}</Text>
                        </View>
                      )
                    })}
                  </View>
                )
              })}
            </ScrollView>

            <View style={styles.right}>
              {localInfo ? (
                <View
                  ref={shareCaptureRef}
                  style={styles.shareCaptureContainer}
                  collapsable={false}
                >
                  <Image source={{ uri: localInfo }} style={styles.infoImage} resizeMode="contain" />
                </View>
              ) : (
                <Text style={[styles.placeholderText, theme.isDark ? { color: theme.colors.textSecondary } : null]}>
                  No extra details available.
                </Text>
              )}
            </View>
          </View>

          {/* Footer ثابت */}
          <View style={[styles.footer, theme.isDark ? { borderTopColor: theme.colors.border } : null]}>
            <View style={styles.footerLeft}>
              {!isInCart ? (
                <TouchableOpacity
                  onPress={handleAddToCart}
                  style={[
                    styles.footerButton,
                    styles.footerButtonPrimary,
                  ]}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={18} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={handleAddToCart}
                    style={[
                      styles.footerButton,
                      styles.footerButtonPrimary,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Feather name="plus" size={18} color="#ffffff" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleRemoveFromCart}
                    style={[
                      styles.footerButton,
                      styles.footerButtonDanger,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Feather name="trash-2" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                onPress={handleShare}
                style={[
                  styles.footerButton,
                  styles.footerButtonSecondary,
                  theme.isDark ? { backgroundColor: theme.colors.surface2 } : null,
                ]}
                activeOpacity={0.8}
              >
                <Feather name="share-2" size={18} color={theme.isDark ? theme.colors.neutral : "#111827"} />
              </TouchableOpacity>
            </View>

            <View style={styles.footerRight}>
              <TouchableOpacity
                onPress={() => setCartModalOpen(true)}
                style={[
                  styles.footerButton,
                  styles.footerButtonSecondary,
                  theme.isDark ? { backgroundColor: theme.colors.surface2 } : null,
                ]}
                activeOpacity={0.8}
              >
                <View style={styles.cartButtonContent}>
                  <Feather name="archive" size={16} color={theme.isDark ? theme.colors.neutral : "#111827"} />
                  <Text style={[styles.cartButtonText, theme.isDark ? { color: theme.colors.neutral } : null]}>({cartItems.length})</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setDownloadDialogOpen(true)}
                style={[
                  styles.footerButton,
                  styles.footerButtonDownload,
                ]}
                activeOpacity={0.8}
                disabled={!cartItems.length || isGeneratingPdf}
              >
                <View style={styles.pdfButtonContent}>
                  <MaterialCommunityIcons
                    name="file-download-outline"
                    size={18}
                    color="#ffffff"
                  />
                  {cartItems.length > 0 && (
                    <View style={styles.pdfBadge}>
                      <Text style={styles.pdfBadgeText}>
                        {String(cartItems.length)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Modal السلة داخل مودال التفاصيل */}
          {cartModalOpen && (
            <View
              style={[
                styles.cartOverlay,
                theme.isDark ? { backgroundColor: "rgba(0,0,0,0.35)" } : null,
              ]}
            >
              <TouchableWithoutFeedback onPress={() => setCartModalOpen(false)}>
                <View style={StyleSheet.absoluteFillObject} />
              </TouchableWithoutFeedback>

              <View
                style={[
                  styles.cartModal,
                  theme.isDark
                    ? {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
              >
                <View style={styles.cartHeader}>
                  <Text style={[styles.cartTitle, theme.isDark ? { color: theme.colors.text } : null]}>Selected sectors</Text>
                  {cartItems.length > 0 && (
                    <TouchableOpacity
                      onPress={handleClearCart}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.cartClearText}>Clear all</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.cartContent}>
                  <ScrollView
                    style={styles.cartList}
                    contentContainerStyle={styles.cartListContent}
                    overScrollMode="never"
                    bounces={false}
                    nestedScrollEnabled
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {cartItems.length === 0 ? (
                      <Text style={[styles.cartEmptyText, theme.isDark ? { color: theme.colors.textSecondary } : null]}>
                        No items in cart.
                      </Text>
                    ) : (
                      cartItems.map((item) => {
                        // في الكارت نعرض صورة bigImg أولاً ثم img كاحتياطي لجميع القطاعات
                        const rawThumb = (item.bigImg ?? item.img) || null
                        let thumbUri: string | null = null
                        if (rawThumb) {
                          if (rawThumb.startsWith("file:") || rawThumb.startsWith("asset:")) {
                            thumbUri = rawThumb
                          } else {
                            const resolved = resolveLocalAssetUri(rawThumb)
                            thumbUri = resolved || null
                          }
                        }

                        // نستثني القطاعات 7 و 8 و 14 (SHE, RHE, CHS) من التلوين الأسود حتى تبقى مجوفة
                        const shouldTint =
                          !!rawThumb &&
                          !(
                            rawThumb.includes("b-she.svg") ||
                            rawThumb.includes("b-rhe.svg") ||
                            rawThumb.includes("b-pipe.svg")
                          )

                        return (
                          <View
                            key={item.id}
                            style={[
                              styles.cartRow,
                              theme.isDark
                                ? {
                                    backgroundColor: theme.colors.surface2,
                                    borderColor: theme.colors.border,
                                  }
                                : null,
                            ]}
                          >
                            {thumbUri ? (
                              <Image
                                source={{ uri: thumbUri }}
                                style={[
                                  styles.cartThumb,
                                  shouldTint ? styles.cartThumbTinted : null,
                                ]}
                                resizeMode="contain"
                              />
                            ) : (
                              <View
                                style={[
                                  styles.cartThumbPlaceholder,
                                  theme.isDark ? { backgroundColor: theme.colors.surface2 } : null,
                                ]}
                              />
                            )}

                            <View style={styles.cartRowText}>
                              <Text style={[styles.cartRowTitle, theme.isDark ? { color: theme.colors.text } : null]}>
                                {item.title || "Section"}
                              </Text>
                              {item.subtitle ? (
                                <Text style={[styles.cartRowSubtitle, theme.isDark ? { color: theme.colors.textSecondary } : null]}>
                                  {item.subtitle}
                                </Text>
                              ) : null}
                            </View>

                            <TouchableOpacity
                              onPress={() => removeItem(item.id)}
                              style={styles.cartRowDelete}
                              activeOpacity={0.8}
                            >
                              <Feather name="trash-2" size={18} color="#dc2626" />
                            </TouchableOpacity>
                          </View>
                        )
                      })
                    )}
                  </ScrollView>
                </View>

                <View style={styles.cartActions}>
                  <TouchableOpacity
                    onPress={() => setCartModalOpen(false)}
                    style={[
                      styles.footerButton,
                      styles.footerButtonPrimary,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.footerButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Modal تحميل الـ PDF */}
          {downloadDialogOpen && (
            <View
              style={[
                styles.cartOverlay,
                theme.isDark ? { backgroundColor: "rgba(0,0,0,0.35)" } : null,
              ]}
            >
              <TouchableWithoutFeedback onPress={() => setDownloadDialogOpen(false)}>
                <View style={StyleSheet.absoluteFillObject} />
              </TouchableWithoutFeedback>

              <TouchableWithoutFeedback onPress={() => {}}>
              <View
                style={[
                  styles.downloadModal,
                  theme.isDark
                    ? {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                      }
                    : null,
                ]}
              >
                <Text style={[styles.downloadTitle, theme.isDark ? { color: theme.colors.text } : null]}>Download PDF</Text>
                <Text style={[styles.downloadText, theme.isDark ? { color: theme.colors.textSecondary } : null]}>
                  A PDF will be generated for all sections currently in the cart.
                </Text>
                <View style={styles.downloadActions}>
                  <TouchableOpacity
                    onPress={() => setDownloadDialogOpen(false)}
                    style={[
                      styles.footerButton,
                      styles.footerButtonSecondary,
                      theme.isDark ? { backgroundColor: theme.colors.surface2 } : null,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.downloadSecondaryText, theme.isDark ? { color: theme.colors.neutral } : null]}>
                      Add more sections
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDownloadPdf}
                    style={[
                      styles.footerButton,
                      styles.footerButtonDownload,
                      styles.downloadPrimaryButton,
                    ]}
                    activeOpacity={0.8}
                    disabled={isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.footerButtonText}>Download now</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
              </TouchableWithoutFeedback>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  banner: {
    position: "absolute",
    top: 32,
    alignSelf: "center",
    zIndex: 50,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerSuccess: {
    backgroundColor: "rgba(22,163,74,0.08)",
  },
  bannerError: {
    backgroundColor: "rgba(231, 18, 18, 0.2)",
  },
  bannerText: {
    fontSize: 13,
    color: "#166534",
    fontWeight: "600",
  },
  bannerTextError: {
    color: "#cc1717ff",
  },
  card: {
    width: 350,
    height: 500,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: "#6b7280",
  },
  flag: {
    width: 21,
    height: 21,
    borderRadius: 2,
    marginHorizontal: 8,
  },
  closeButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closeText: {
    fontSize: 20,
    color: "#6b7280",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  left: {
  //  backgroundColor: "red",
    flex: 2,
  },
  leftContent: {
    paddingRight: 8,
    paddingBottom: 8,
  },
  right: {
    //backgroundColor: "green",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  infoImage: {
    width: 150,
    height: 150,
  },
  placeholderText: {
    fontSize: 14,
    color: "#9ca3af",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  footerLeft: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  footerButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  footerButtonPrimary: {
    backgroundColor: "#059669",
  },
  footerButtonDanger: {
    backgroundColor: "#dc2626",
  },
  footerButtonSecondary: {
    backgroundColor: "#e5e7eb",
  },
  footerButtonDownload: {
    backgroundColor: "#0284c7",
  },
  downloadPrimaryButton: {
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  footerButtonText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  group: {
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
  },
  groupHeader: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  groupTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowLabel: {
    flex: 1,
    fontSize: 12,
    color: "#475569",
  },
  rowValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0f172a",
    textAlign: "right",
    minWidth: 60,
  },
  rowUnit: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 6,
  },
  shareCaptureContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cartButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 4,
  },
  cartButtonText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  pdfButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 6,
  },
  pdfBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  pdfBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
  },
  cartOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  cartModal: {
    width: 250,
    maxHeight: 320,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    padding: 7,

    // ظل قوي ليظهر الكارت كطبقة عائمة فوق Modal التفاصيل
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  cartContent: {
    maxHeight: 230,
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cartTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  cartClearText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#dc2626",
  },
  cartList: {
    marginBottom: 8,
  },
  cartListContent: {
    paddingVertical: 2,
    rowGap: 6,
  },
  cartEmptyText: {
    fontSize: 13,
    color: "#6b7280",
  },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    borderRadius: 8, borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  cartThumb: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  cartThumbTinted: {
    tintColor: "#000000",
  },
  cartThumbPlaceholder: {
    width: 40,
    height: 40,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  cartRowText: {
    flex: 1,
    paddingRight: 8,
  },
  cartRowTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  cartRowSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  cartRowDelete: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cartActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  cartActionText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
  downloadModal: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    padding: 12,

    // ظل قوي ليظهر كرت Download PDF كطبقة عائمة
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  downloadTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  downloadText: {
    fontSize: 13,
    color: "#4b5563",
    marginBottom: 10,
  },
  downloadActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  downloadSecondaryText: {
    color: "#111827",
    fontSize: 13,
    fontWeight: "600",
  },
})
