import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"

import { useLanguage } from "../../hooks/useLanguage"
import { reportSectionError } from "../../lib/section-errors"
import { useTheme } from "../../contexts/ThemeContext"

export type ErrorReportModalProps = {
  isOpen: boolean
  onClose: () => void
  sectionId: number
  sectionName: string
  currentValue?: string
  variantIndex?: number
  sliderValues?: string
  calculationParams?: any
  selectedType: string
  notify: (type: "success" | "error", message: string) => void
}

export function ErrorReportModal({
  isOpen,
  onClose,
  sectionId,
  sectionName,
  currentValue,
  variantIndex,
  sliderValues,
  calculationParams,
  selectedType,
  notify,
}: ErrorReportModalProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const { language } = useLanguage()
  const isArabic = language === "ar"

  const [correctValue, setCorrectValue] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sectionLabel = useMemo(() => {
    const typeLabel = selectedType?.trim() ? selectedType.trim() : ""
    const nameLabel = sectionName?.trim() ? sectionName.trim() : ""

    if (typeLabel && nameLabel) return `${typeLabel} - ${nameLabel}`
    return typeLabel || nameLabel
  }, [sectionName, selectedType])

  const handleClose = useCallback(() => {
    setCorrectValue("")
    setDescription("")
    setIsSubmitting(false)
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) {
      setCorrectValue("")
      setDescription("")
      setIsSubmitting(false)
    }
  }, [isOpen])

  const handleSubmit = useCallback(async () => {
    if (!correctValue.trim()) {
      notify(
        "error",
        isArabic ? "الرجاء إدخال القيمة الصحيحة" : "Please enter the correct value",
      )
      return
    }

    setIsSubmitting(true)
    try {
      const result = await reportSectionError({
        section_id: sectionId,
        section_name: sectionName,
        reported_value: currentValue,
        correct_value: correctValue,
        error_description: description,
        variant_index: variantIndex,
        slider_values: sliderValues,
        calculation_params: calculationParams,
      })

      if (result.success) {
        notify(
          "success",
          isArabic ? "شكراً لك! تم إرسال التقرير بنجاح" : "Thank you! Report submitted successfully",
        )
        handleClose()
      } else {
        notify("error", isArabic ? "فشل إرسال التقرير" : "Failed to submit report")
      }
    } catch (error) {
      console.error("[ErrorReportModal] submit failed:", error)
      notify("error", isArabic ? "حدث خطأ أثناء الإرسال" : "An error occurred while submitting")
    } finally {
      setIsSubmitting(false)
    }
  }, [
    correctValue,
    calculationParams,
    currentValue,
    description,
    handleClose,
    isArabic,
    notify,
    sectionId,
    sectionName,
    sliderValues,
    variantIndex,
  ])

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType={Platform.OS === "android" ? "fade" : "slide"}
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={[styles.backdrop, isDark ? { backgroundColor: "rgba(0,0,0,0.65)" } : null]}>
          <TouchableWithoutFeedback>
            <View style={styles.cardContainer}>
              <View
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
                <View style={[styles.headerRow, isArabic && styles.headerRowRtl]}>
                  <View style={[styles.headerTitleRow, isArabic && styles.headerTitleRowRtl]}>
                    <Feather name="alert-triangle" size={18} color="#F08C21" />
                    <Text
                      style={[
                        styles.headerTitle,
                        isDark ? { color: theme.colors.text } : null,
                        isArabic && styles.rtlText,
                      ]}
                    >
                      {isArabic ? "الإبلاغ عن خطأ" : "Report Error"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.8}>
                    <Feather name="x" size={18} color={isDark ? theme.colors.textSecondary : "#6b7280"} />
                  </TouchableOpacity>
                </View>

                <View style={styles.body}>
                  <Text
                    style={[
                      styles.label,
                      isDark ? { color: theme.colors.textSecondary } : null,
                      isArabic && styles.rtlText,
                    ]}
                  >
                    {isArabic ? "اسم القطاع" : "Section Name"}
                  </Text>
                  <TextInput
                    value={sectionLabel}
                    editable={false}
                    style={[
                      styles.input,
                      styles.inputDisabled,
                      isDark
                        ? {
                            backgroundColor: theme.colors.surface2,
                            borderColor: theme.colors.border,
                            color: theme.colors.textSecondary,
                          }
                        : null,
                      isArabic && styles.rtlInput,
                    ]}
                    placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
                  />

                  <Text style={[styles.label, styles.labelRequired, isArabic && styles.rtlText]}>
                    {isArabic ? "القيمة الصحيحة *" : "Correct Value *"}
                  </Text>
                  <TextInput
                    value={correctValue}
                    onChangeText={setCorrectValue}
                    style={[
                      styles.input,
                      styles.inputDanger,
                      isDark
                        ? {
                            backgroundColor: theme.colors.surface2,
                            borderColor: theme.colors.secondary,
                            color: theme.colors.text,
                          }
                        : null,
                      isArabic && styles.rtlInput,
                    ]}
                    placeholder={isArabic ? "أدخل القيمة الصحيحة" : "Enter correct value"}
                    placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
                    keyboardType="default"
                  />

                  <Text
                    style={[
                      styles.label,
                      isDark ? { color: theme.colors.textSecondary } : null,
                      isArabic && styles.rtlText,
                    ]}
                  >
                    {isArabic ? "وصف الخطأ (اختياري)" : "Error Description (Optional)"}
                  </Text>
                  <TextInput
                    value={description}
                    onChangeText={setDescription}
                    style={[
                      styles.textArea,
                      isDark
                        ? {
                            backgroundColor: theme.colors.surface2,
                            borderColor: theme.colors.border,
                            color: theme.colors.text,
                          }
                        : null,
                      isArabic && styles.rtlInput,
                    ]}
                    placeholder={isArabic ? "اشرح الخطأ الذي وجدته..." : "Explain the error you found..."}
                    placeholderTextColor={isDark ? theme.colors.textSecondary : "#9ca3af"}
                    multiline
                    textAlignVertical="top"
                  />

                  <View style={[styles.buttonsRow, isArabic && styles.buttonsRowRtl]}>
                    <TouchableOpacity
                      onPress={handleSubmit}
                      disabled={isSubmitting}
                      activeOpacity={0.85}
                      style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {isArabic ? "إرسال التقرير" : "Submit Report"}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleClose}
                      activeOpacity={0.85}
                      style={[
                        styles.secondaryButton,
                        isDark
                          ? {
                              borderColor: theme.colors.border,
                              backgroundColor: theme.colors.surface2,
                            }
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.secondaryButtonText,
                          isDark ? { color: theme.colors.text } : null,
                          isArabic && styles.rtlText,
                        ]}
                      >
                        {isArabic ? "إلغاء" : "Cancel"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
  cardContainer: {
    backgroundColor: "transparent",
    width: "90%",
    maxWidth: 420,
    maxHeight: "80%",
    alignSelf: "center",
  },
  card: {
    marginTop: 32,
    marginBottom: 24,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRowRtl: {
    flexDirection: "row-reverse",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitleRowRtl: {
    flexDirection: "row-reverse",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 999,
  },
  body: {
    gap: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  labelRequired: {
    color: "#dc2626",
  },
  input: {
    width: "100%",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  inputDisabled: {
    backgroundColor: "#f9fafb",
    color: "#4b5563",
  },
  inputDanger: {
    borderColor: "#fecaca",
  },
  textArea: {
    width: "100%",
    minHeight: 84,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: "#111827",
    backgroundColor: "#ffffff",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 8,
  },
  buttonsRowRtl: {
    flexDirection: "row-reverse",
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "transparent",
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlInput: {
    textAlign: "right",
    writingDirection: "rtl",
  },
})
