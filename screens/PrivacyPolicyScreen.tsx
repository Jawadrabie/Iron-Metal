import React from "react"
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native"
import * as Clipboard from "expo-clipboard"
import { useNavigation } from "@react-navigation/native"
import { Feather } from "@expo/vector-icons"
import { useI18n } from "../contexts/I18nContext"
import { useTheme } from "../contexts/ThemeContext"

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation()
  const theme = useTheme()
  const isDark = theme.isDark
  const { isRTL, ready, t } = useI18n()
  const isArabic = isRTL
  const isReady = ready

  const tt = t.privacyPolicy

  const handleCopy = async (value: string) => {
    try {
      await Clipboard.setStringAsync(value)
      const message = tt.ui.copiedToClipboard

      if (Platform.OS === "android") {
        ToastAndroid.show(message, ToastAndroid.SHORT)
      } else {
        Alert.alert("", message)
      }
    } catch {
      // نتجاهل الأخطاء البسيطة في النسخ حتى لا نقطع تجربة القراءة
    }
  }

  if (!isReady) {
    return (
      <View style={[styles.root, isDark ? { backgroundColor: theme.colors.background } : null]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.secondary} />
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.root, isDark ? { backgroundColor: theme.colors.background } : null]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={22} color={isDark ? theme.colors.text : "#111827"} />
          <Text style={[styles.backText, isDark ? { color: theme.colors.text } : null]}>{tt.ui.back}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <Text style={[styles.title, isDark ? { color: theme.colors.text } : null]}>{tt.title}</Text>

        <Text
          style={[
            styles.paragraph,
            isDark ? { color: theme.colors.textSecondary } : null,
            isArabic && styles.paragraphRtl,
          ]}
        >
          {tt.updatedAt}
        </Text>

        {tt.intro.map((p, index) => (
          <Text
            key={`intro-${index}`}
            style={[
              styles.paragraph,
              isDark ? { color: theme.colors.textSecondary } : null,
              isArabic && styles.paragraphRtl,
            ]}
          >
            {p}
          </Text>
        ))}

        {tt.sections.map((section, index) => (
          <View key={`section-${index}`}>
            <Text
              style={[
                styles.sectionTitle,
                isDark ? { color: theme.colors.text } : null,
                isArabic && styles.sectionTitleRtl,
              ]}
            >
              {section.heading}
            </Text>

            {section.paragraphs?.map((p, pIndex) => {
              const isEmailLine =
                p.includes("info@akafi.net") || p.trim().startsWith("Email:")
              const isWhatsappLine =
                p.includes("+966 11 269 0999") ||
                p.trim().startsWith("WhatsApp:")

              if (isEmailLine || isWhatsappLine) {
                const value = isEmailLine
                  ? "info@akafi.net"
                  : "+966 11 269 0999"

                return (
                  <View
                    key={`sec-${index}-p-${pIndex}`}
                    style={[styles.copyRow, isArabic && styles.copyRowRtl]}
                  >
                    <Text
                      style={[
                        styles.paragraph,
                        isDark ? { color: theme.colors.textSecondary } : null,
                        isArabic && styles.paragraphRtl,
                        { flex: 1 },
                      ]}
                    >
                      {p}
                    </Text>
                    <TouchableOpacity
                      style={styles.copyIconButton}
                      activeOpacity={0.7}
                      onPress={() => handleCopy(value)}
                    >
                      <Feather name="copy" size={16} color={isDark ? theme.colors.icon : "#000000"} />
                    </TouchableOpacity>
                  </View>
                )
              }

              return (
                <Text
                  key={`sec-${index}-p-${pIndex}`}
                  style={[
                    styles.paragraph,
                    isDark ? { color: theme.colors.textSecondary } : null,
                    isArabic && styles.paragraphRtl,
                  ]}
                >
                  {p}
                </Text>
              )
            })}

            {section.bullets?.map((b, bIndex) => (
              <Text
                key={`sec-${index}-b-${bIndex}`}
                style={[
                  styles.bullet,
                  isDark ? { color: theme.colors.textSecondary } : null,
                  isArabic && styles.bulletRtl,
                ]}
              >
                {`• ${b}`}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    fontSize: 15,
    color: "#111827",
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  copyRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  copyRowRtl: {
    flexDirection: "row-reverse",
  },
  copyIconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitleRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  paragraph: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 8,
  },
  paragraphRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  bullet: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 4,
  },
  bulletRtl: {
    textAlign: "right",
    writingDirection: "rtl",
  },
})
