import { useEffect, useRef } from "react"
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Image,
  Text,
  Animated,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native"
import { Dropdown, type IDropdownRef } from "react-native-element-dropdown"

import { useTheme } from "../../contexts/ThemeContext"
import { useI18n } from "../../contexts/I18nContext"

type AppBarProps = {
  visitorCount?: number
  visitorCountries?: { country: string; count: number }[]
}

type CountryOption = {
  label: string
  value: string
  count: number
}

const COUNTRY_FLAG_OVERRIDES: Record<string, string> = {
  Syria: "🇸🇾",
  "Saudi Arabia": "🇸🇦",
  "United Arab Emirates": "🇦🇪",
  UAE: "🇦🇪",
  Egypt: "🇪🇬",
  Jordan: "🇯🇴",
  Lebanon: "🇱🇧",
  Iraq: "🇮🇶",
  Kuwait: "🇰🇼",
  Qatar: "🇶🇦",
  Bahrain: "🇧🇭",
  Oman: "🇴🇲",
  Yemen: "🇾🇪",
  Palestine: "🇵🇸",
  Turkey: "🇹🇷",
  Netherlands: "🇳🇱",
  "United States": "🇺🇸",
  USA: "🇺🇸",
  Germany: "🇩🇪",
  "United Kingdom": "🇬🇧",
  UK: "🇬🇧",
  France: "🇫🇷",
  Spain: "🇪🇸",
  Italy: "🇮🇹",
  Switzerland: "🇨🇭",
  Brazil: "🇧🇷",
  Poland: "🇵🇱",
  Sweden: "🇸🇪",
  Denmark: "🇩🇰",
  Finland: "🇫🇮",
  Russia: "🇷🇺",
  Canada: "🇨🇦",
  China: "🇨🇳",
  India: "🇮🇳",
  Japan: "🇯🇵",
  Norway: "🇳🇴",
  Ireland: "🇮🇪",
  Romania: "🇷🇴",
}

const COUNTRY_NAME_AR_OVERRIDES: Record<string, string> = {
  Syria: "سوريا",
  "Saudi Arabia": "السعودية",
  "United Arab Emirates": "الإمارات",
  UAE: "الإمارات",
  Kuwait: "الكويت",
  Qatar: "قطر",
  Bahrain: "البحرين",
  Oman: "عُمان",
  Yemen: "اليمن",
  Palestine: "فلسطين",
  Jordan: "الأردن",
  Lebanon: "لبنان",
  Iraq: "العراق",
  Egypt: "مصر",
  Turkey: "تركيا",
  Netherlands: "هولندا",
  "United States": "الولايات المتحدة",
  USA: "الولايات المتحدة",
  "United Kingdom": "المملكة المتحدة",
  UK: "المملكة المتحدة",
  Germany: "ألمانيا",
  France: "فرنسا",
  Spain: "إسبانيا",
  Italy: "إيطاليا",
  Switzerland: "سويسرا",
  Brazil: "البرازيل",
  Canada: "كندا",
  China: "الصين",
  India: "الهند",
  Japan: "اليابان",
  Russia: "روسيا",
  Sweden: "السويد",
  Denmark: "الدنمارك",
  Finland: "فنلندا",
  Norway: "النرويج",
  Ireland: "أيرلندا",
  Romania: "رومانيا",
}

function flagFromCountryName(name?: string | null): string {
  if (!name) return "🌍"
  return COUNTRY_FLAG_OVERRIDES[name] ?? "🌍"
}

function countryNameToArabic(name?: string | null): string {
  if (!name) return ""
  return COUNTRY_NAME_AR_OVERRIDES[name] ?? name
}

function PulsingDot() {
  const pulse = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()
    return () => animation.stop()
  }, [pulse])

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.35],
  })

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.65],
  })

  return (
    <Animated.View
      style={[styles.activityDot, { transform: [{ scale }], opacity }]}
    />
  )
}

export function AppBar({ visitorCount, visitorCountries }: AppBarProps) {
  const theme = useTheme()
  const { isRTL } = useI18n()
  const hasCountries = !!visitorCountries && visitorCountries.length > 0
  const dropdownRef = useRef<IDropdownRef>(null)

  const ITEM_HEIGHT = 32
  const MAX_VISIBLE_ITEMS = 4
  const DROPDOWN_WIDTH = 190
  const RIGHT_MARGIN = 6

  const { width: screenWidth } = useWindowDimensions()
  const dropdownLeft = Math.max(0, screenWidth - DROPDOWN_WIDTH - RIGHT_MARGIN)

  const data: CountryOption[] =
    visitorCountries
      ?.filter((item): item is { country: string; count: number } => !!item?.country)
      .map((item) => ({
        label: item.country,
        value: item.country,
        count: item.count,
      })) ?? []

  const renderDropdownHeader = () => (
    <View style={[styles.dropdownItem, isRTL ? styles.dropdownItemRtl : null]}>
      <View style={[styles.dropdownCountryLeft, isRTL ? styles.dropdownCountryLeftRtl : null]}>
        <Text style={[styles.dropdownFlag, isRTL ? styles.dropdownFlagRtl : null]}>🌐</Text>
        <Text
          numberOfLines={1}
          style={[
            styles.dropdownCountry,
            { color: theme.colors.text },
            isRTL ? styles.dropdownTextRtl : null,
          ]}
        >
          {isRTL ? "أكثر الدول (آخر 30 يوم)" : "Top Countries (last 30 days)"}
        </Text>
      </View>
    </View>
  )

  const renderCountryItem = (item: CountryOption) => {
    const countryName = isRTL ? countryNameToArabic(item.label) : item.label

    return (
      <View style={[styles.dropdownItem, isRTL ? styles.dropdownItemRtl : null]}>
        <View style={[styles.dropdownCountryLeft, isRTL ? styles.dropdownCountryLeftRtl : null]}>
          <Text style={[styles.dropdownFlag, isRTL ? styles.dropdownFlagRtl : null]}>
            {flagFromCountryName(item.label)}
          </Text>
          <Text
            style={[
              styles.dropdownCountry,
              { color: theme.colors.text },
              isRTL ? styles.dropdownTextRtl : null,
            ]}
          >
            {countryName}
          </Text>
        </View>
        <Text
          style={[
            styles.dropdownCount,
            { color: theme.colors.secondary },
            isRTL ? styles.dropdownCountRtl : null,
          ]}
        >
          {item.count}
        </Text>
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]} >
      <View style={styles.centerLogo}>
        <Image
          source={require("../../assets/icon/IRON&METAL.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.rightStatus}>
        {hasCountries ? (
          <>
            <View style={styles.countriesTriggerWrap}>
              <TouchableOpacity
                style={styles.onlineButton}
                activeOpacity={0.85}
                onPress={() => dropdownRef.current?.open()}
              >
                <PulsingDot />
                {visitorCount != null && (
                  <Text style={[styles.visitorCount, { color: theme.colors.success }]}>{visitorCount}</Text>
                )}
              </TouchableOpacity>

              <View pointerEvents="none" style={styles.dropdownAnchor}>
                <Dropdown
                  ref={dropdownRef}
                  data={data}
                  labelField="label"
                  valueField="value"
                  value={null}
                  style={StyleSheet.absoluteFillObject}
                  containerStyle={[
                    styles.dropdown,
                    {
                      width: DROPDOWN_WIDTH,
                      left: dropdownLeft,
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.border,
                      borderWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                  placeholder=""
                  selectedTextStyle={styles.dropdownSelectedText}
                  itemContainerStyle={{ paddingHorizontal: 0, height: ITEM_HEIGHT }}
                  itemTextStyle={styles.dropdownCountry}
                  maxHeight={ITEM_HEIGHT * (MAX_VISIBLE_ITEMS + 1) - 8}
                  showsVerticalScrollIndicator={false}
                  activeColor="transparent"
                  closeModalWhenSelectedItem
                  onChange={() => {
                    dropdownRef.current?.close()
                  }}
                  flatListProps={{
                    bounces: false,
                    overScrollMode: "never",
                    showsVerticalScrollIndicator: false,
                    ListHeaderComponent: renderDropdownHeader,
                    contentContainerStyle: { paddingVertical: 0 },
                  }}
                  renderLeftIcon={() => null}
                  renderRightIcon={() => null}
                  renderItem={(item) => renderCountryItem(item as CountryOption)}
                  dropdownPosition="bottom"
                />
              </View>
            </View>
          </>
        ) : (
          <View style={styles.onlineButton}>
            <PulsingDot />
            {visitorCount != null && (
              <Text style={[styles.visitorCount, { color: theme.colors.success }]}>{visitorCount}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  centerLogo: {
    flex: 1,
    alignItems: "center",
  },
  logoImage: {
    width: 140,
    height: 28,
  },
  rightStatus: {
    position: "absolute",
    right: 16,
    top: 2,
    flexDirection: "column",
    alignItems: "flex-end",
    zIndex: 999,
    elevation: 24,
  },
  onlineButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  countriesTriggerWrap: {
    alignItems: "flex-end",
  },
  activityDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#32d296",
    marginRight: 6,
  },
  visitorCount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#10a37f",
  },
  dropdownTrigger: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  dropdownAnchor: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: -1000,
    zIndex: 500,
  },
  dropdownWrapper: {
    marginTop: 8,
  },
  dropdown: {
    width: 190,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingTop: 0,
    paddingHorizontal: 6,
    paddingBottom: 0,
    elevation: 16,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownList: {
    width: "100%",
  },
  dropdownTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dropdownHeader: {
    paddingBottom: 6,
  },
  dropdownHeaderRow: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownHeaderIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  dropdownHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  dropdownHeaderSubText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  dropdownHeaderDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "#e5e7eb",
  },
  dropdownSelectedText: {
    fontSize: 0,
    height: 0,
    color: "transparent",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 0,
    height: 32,
  },
  dropdownCountryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  dropdownCountryLeftRtl: {
    flexDirection: "row-reverse",
  },
  dropdownFlag: {
    fontSize: 16,
    marginRight: 4,
  },
  dropdownFlagRtl: {
    marginRight: 0,
    marginLeft: 4,
  },
  dropdownCountry: {
    fontSize: 13,
    color: "#374151",
  },
  dropdownTextRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  dropdownCount: {
    fontSize: 13,
    fontWeight: "600",
    color: "#f97316",
  },
  dropdownCountRtl: {
    textAlign: "left",
  },
  dropdownItemRtl: {
    flexDirection: "row-reverse",
  },
})
