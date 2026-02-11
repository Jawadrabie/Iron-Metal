import React from "react"
import {
  ActivityIndicator,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { useNavigation } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import { Dropdown } from "react-native-element-dropdown"
import { COUNTRIES } from "../home/AccountModal"
import { useI18n } from "../../contexts/I18nContext"
import { useTheme } from "../../contexts/ThemeContext"

export type ProfileContentProps = {
  loading: boolean
  user: any | null
  fullName: string

  avatarUrl: string
  uploadingAvatar: boolean
  phone: string
  country: string
  saving: boolean
  canSave: boolean
  onPickAvatar: () => void
  onChangeFullName: (value: string) => void

  onChangePhone: (value: string) => void
  onSelectCountry: (code: string) => void
  onSave: () => void
  styles: any
}

type GuestContentProps = {
  onNavigateLogin: () => void
  styles: any
}

export function ProfileContent({
  loading,
  user,
  fullName,

  avatarUrl,
  uploadingAvatar,
  phone,
  country,
  saving,
  canSave,
  onPickAvatar,
  onChangeFullName,

  onChangePhone,
  onSelectCountry,
  onSave,
  styles,
}: ProfileContentProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const navigation = useNavigation<any>()
  const { language, setLanguage, isRTL, t } = useI18n()
  const tt = t.profile.content

  const rtlText = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  }

  const ltrText = {
    textAlign: "left" as const,
    writingDirection: "ltr" as const,
  }

  const languageOptions = [
    { label: tt.languageArabic, value: "ar" },
    { label: tt.languageEnglish, value: "en" },
  ]

  const countryOptions = COUNTRIES.map(
    (c: { name?: string; nameAr?: string; code: string; flag?: string }) => ({
      label:
        language === "ar" ? c.nameAr || c.name : c.name || c.nameAr,
      value: c.code,
      flag: c.flag,
    }),
  )
  const COUNTRY_ITEM_HEIGHT = 34

  const baseCountryFlatListProps = {
    showsVerticalScrollIndicator: false,
    bounces: false,
    overScrollMode: "never" as const,
  }

  const selectedCountryIndex = countryOptions.findIndex((c) => c.value === country)
  const countryFlatListProps =
    selectedCountryIndex > -1
      ? {
        ...baseCountryFlatListProps,
        initialScrollIndex: selectedCountryIndex,
        getItemLayout: (_data: any, index: number) => ({
          length: COUNTRY_ITEM_HEIGHT,
          offset: COUNTRY_ITEM_HEIGHT * index,
          index,
        }),
      }
      : baseCountryFlatListProps

  if (loading) {
    return (
      <View style={styles.loadingBox}>
        <ActivityIndicator size="large" color="#302C6D" />
      </View>
    )
  }

  if (!user) {
    return (
      <GuestContent
        onNavigateLogin={() => navigation.navigate("Login" as never)}
        styles={styles}
      />
    )
  }

  return (
    <View style={styles.card}>
      <View style={styles.profileHeader}>
        <TouchableOpacity
          style={styles.avatarWrapper}
          activeOpacity={0.9}
          onPress={onPickAvatar}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarCircle}>
              <Feather name="user" size={40} color="#302C6D" />
            </View>
          )}
          <View style={styles.avatarCameraBadge}>
            {uploadingAvatar ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Feather name="camera" size={14} color="#ffffff" />
            )}
          </View>
        </TouchableOpacity>
        {!!fullName && <Text style={[styles.profileName, isDark ? { color: theme.colors.text } : null]}>{fullName}</Text>}

      </View>

      <View style={styles.formSection}>
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, rtlText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.fullNameLabel}</Text>
          <TextInput
            style={[
              styles.input,
              rtlText,
              isDark
                ? {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
                : null,
            ]}
            value={fullName}
            onChangeText={onChangeFullName}
            placeholder={tt.fullNamePlaceholder}
            placeholderTextColor={isDark ? theme.colors.textSecondary : "#9CA3AF"}
            scrollEnabled={false}
          />
        </View>



        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, rtlText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.phoneLabel}</Text>
          <TextInput
            style={[
              styles.input,
              ltrText,
              isDark
                ? {
                  backgroundColor: theme.colors.surface2,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }
                : null,
            ]}
            value={phone}
            onChangeText={onChangePhone}
            keyboardType="phone-pad"
            placeholder={tt.phonePlaceholder}
            placeholderTextColor={isDark ? theme.colors.textSecondary : "#9CA3AF"}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, rtlText, isDark ? { color: theme.colors.textSecondary } : null]}>
            {tt.preferredLanguageLabel}
          </Text>
          <View style={styles.selectWrapper}>
            <Dropdown
              style={[
                styles.selectInput,
                isRTL ? { flexDirection: "row-reverse" } : null,
                isDark
                  ? {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  }
                  : null,
              ]}
              data={languageOptions}
              labelField="label"
              valueField="value"
              value={language}
              placeholder=""
              maxHeight={70}
              showsVerticalScrollIndicator={false}
              activeColor={isDark ? theme.colors.surface2 : "#F3F4F6"}
              itemContainerStyle={{ borderRadius: 8, overflow: "hidden", marginBottom: 4 }}
              containerStyle={[
                styles.languageDropdownContainer,
                isDark
                  ? {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  }
                  : null,
              ]}
              onChange={(item: { label: string; value: string }) => {
                setLanguage(item.value === "en" ? "en" : "ar")
              }}
              selectedTextStyle={[styles.selectValue, rtlText, isDark ? { color: theme.colors.text } : null]}
              placeholderStyle={[styles.selectValue, rtlText, isDark ? { color: theme.colors.text } : null]}
              renderRightIcon={() => (
                <Feather name="chevron-down" size={18} color={isDark ? theme.colors.textSecondary : "#6B7280"} />
              )}
              renderItem={(item: { label: string; value: string }) => {
                const isSelected = item.value === language
                return (
                  <View
                    style={[
                      styles.countryRow,
                      { marginBottom: 0 },
                      isRTL ? { flexDirection: "row-reverse" } : null,
                      isDark ? { backgroundColor: theme.colors.surface2 } : null,
                      isSelected
                        ? isDark
                          ? { backgroundColor: theme.colors.background }
                          : styles.countryRowActive
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countryRowText,
                        rtlText,
                        isDark ? { color: theme.colors.text } : null,
                        isSelected ? styles.countryRowTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )
              }}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, rtlText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.countryLabel}</Text>
          <View style={styles.selectWrapper}>
            <Dropdown
              style={[
                styles.selectInput,
                isRTL ? { flexDirection: "row-reverse" } : null,
                isDark
                  ? {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  }
                  : null,
              ]}
              data={countryOptions}
              labelField="label"
              valueField="value"
              value={country}
              placeholder=""
              maxHeight={140}
              showsVerticalScrollIndicator={false}
              activeColor={isDark ? theme.colors.surface2 : "#F3F4F6"}
              itemContainerStyle={{ borderRadius: 8, overflow: "hidden", marginBottom: 4 }}
              containerStyle={[
                styles.countryDropdownContainer,
                isDark
                  ? {
                    backgroundColor: theme.colors.surface2,
                    borderColor: theme.colors.border,
                  }
                  : null,
              ]}
              autoScroll={false}
              flatListProps={countryFlatListProps}
              onChange={(item: { label: string; value: string }) => {
                onSelectCountry(item.value)
              }}
              selectedTextStyle={[styles.selectValue, rtlText, isDark ? { color: theme.colors.text } : null]}
              placeholderStyle={[styles.selectValue, rtlText, isDark ? { color: theme.colors.text } : null]}
              renderRightIcon={() => (
                <Feather name="chevron-down" size={18} color={isDark ? theme.colors.textSecondary : "#6B7280"} />
              )}
              renderItem={(item: { label: string; value: string; flag: string }) => {
                const isSelected = item.value === country
                return (
                  <View
                    style={[
                      styles.countryRow,
                      { marginBottom: 0 },
                      isRTL ? { flexDirection: "row-reverse" } : null,
                      isDark ? { backgroundColor: theme.colors.surface2 } : null,
                      isSelected
                        ? isDark
                          ? { backgroundColor: theme.colors.background }
                          : styles.countryRowActive
                        : null,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countryFlag,
                        isRTL ? { marginRight: 0, marginLeft: 8 } : null,
                      ]}
                    >
                      {item.flag}
                    </Text>
                    <Text
                      style={[
                        styles.countryRowText,
                        rtlText,
                        isDark ? { color: theme.colors.text } : null,
                        isSelected ? styles.countryRowTextActive : null,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                )
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canSave && styles.primaryButtonDisabled,
            saving && { opacity: 0.7 },
          ]}
          activeOpacity={0.9}
          onPress={onSave}
          disabled={saving || !canSave}
        >
          <View style={styles.primaryButtonContent}>
            {saving && (
              <ActivityIndicator color="#ffffff" style={styles.primaryButtonSpinner} />
            )}
            <Text
              style={[
                styles.primaryButtonText,
                saving && styles.primaryButtonTextHidden,
              ]}
            >
              {tt.saveChanges}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate(
              "PrivacyPolicy" as never,
              {
                language: language === "en" ? "en" : "ar",
              } as never,
            )
          }
          activeOpacity={0.7}
        >
          <Text style={[styles.privacyLinkText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.privacyPolicy}</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function GuestContent({ onNavigateLogin, styles }: GuestContentProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { isRTL, t } = useI18n()
  const tt = t.profile.content

  const rtlText = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  }

  const rtlCenteredText = {
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  }

  return (
    <View style={styles.card}>
      <Text style={[styles.title, rtlCenteredText, isDark ? { color: theme.colors.text } : null]}>{tt.guestTitle}</Text>
      <Text style={[styles.subtitle, rtlCenteredText, isDark ? { color: theme.colors.textSecondary } : null]}>{tt.guestSubtitle}</Text>

      <View style={styles.profileBox}>
        <View style={[styles.avatarCircle, isDark ? { backgroundColor: theme.colors.surface } : null]}>
          <Feather name="user" size={36} color={isDark ? theme.colors.text : "#302C6D"} />
        </View>
        <Text style={[styles.profileName, rtlText, isDark ? { color: theme.colors.text } : null]}>{tt.guestName}</Text>
      </View>

      <TouchableOpacity
        style={[styles.primaryButton, styles.guestPrimaryButton, { backgroundColor: theme.colors.secondary }]}
        activeOpacity={0.9}
        onPress={onNavigateLogin}
      >
        <Text style={[styles.primaryButtonText, rtlText]}>{tt.signIn}</Text>
      </TouchableOpacity>
    </View>
  )
}
