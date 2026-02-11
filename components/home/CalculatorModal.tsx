import { memo, useCallback, useEffect, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { Feather } from "@expo/vector-icons"

import { CalculatorPanel } from "../calculator/CalculatorPanel"
import type { Variant } from "../../types/sections"
import type { Dims } from "../../hooks/useSidebarCalculations"
import { useTheme } from "../../contexts/ThemeContext"

type CalculatorModalProps = {
  visible: boolean
  onClose: () => void
  selectedSectionId: number | null
  selectedType: string
  selectedVariantIndex: number
  sliderValue: number      
  currentVariant?: Variant 
  dims?: Dims
  onDimsChange?: (dims: Dims) => void
  presetKey?: string | null
  initialPricePerKgInput?: string
  initialRequiredInput?: string
  initialLengthInput?: string
  initialLengthUnit?: "m" | "mm"
  prefillKey?: string | null
  prefillPricePerKgInput?: string
  prefillRequiredInput?: string
  prefillLengthInput?: string
  prefillLengthUnit?: "m" | "mm"
  prefillDims?: Dims
}

export const CalculatorModal = memo(function CalculatorModal({
  visible,
  onClose,
  selectedSectionId,
  selectedType,
  selectedVariantIndex,
  sliderValue,
  currentVariant,
  dims,
  onDimsChange,
  presetKey,
  initialPricePerKgInput,
  initialRequiredInput,
  initialLengthInput,
  initialLengthUnit,
  prefillKey,
  prefillPricePerKgInput,
  prefillRequiredInput,
  prefillLengthInput,
  prefillLengthUnit,
  prefillDims,
}: CalculatorModalProps) {
  const theme = useTheme()
  const isDark = theme.isDark
  const [bannerMessage, setBannerMessage] = useState<string | null>(null)
  const [bannerType, setBannerType] = useState<"success" | "error" | null>(null)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleShowBanner = useCallback((type: "success" | "error", message: string) => {
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

  return (
    <Modal visible={visible} animationType="none" transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalBackdrop}>
          {bannerMessage && (
            <View
              style={[
                styles.banner,
                bannerType === "success" ? styles.bannerSuccess : styles.bannerError,
                isDark
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
                    ? isDark
                      ? theme.colors.success
                      : "#16A34A"
                    : isDark
                      ? theme.colors.error
                      : "#b91c1b"
                }
              />
              <Text
                style={[
                  styles.bannerText,
                  bannerType === "error" && styles.bannerTextError,
                  isDark
                    ? {
                        color: bannerType === "success" ? theme.colors.text : theme.colors.text,
                      }
                    : null,
                ]}
              >
                {bannerMessage}
              </Text>
            </View>
          )}

          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalCard}>
              <KeyboardAvoidingView
                style={styles.keyboardAvoiding}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
              >
                <ScrollView
                  contentContainerStyle={styles.modalContent}
                  showsVerticalScrollIndicator={false}
                  overScrollMode="never"
                  bounces={false}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  <CalculatorPanel
                    selectedSectionId={selectedSectionId}
                    selectedType={selectedType}
                    selectedVariantIndex={selectedVariantIndex}
                    sliderValue={sliderValue}
                    currentVariant={currentVariant}
                    initialDims={dims ?? null}
                    onDimsChange={onDimsChange}
                    presetKey={presetKey}
                    initialPricePerKgInput={initialPricePerKgInput}
                    initialRequiredInput={initialRequiredInput}
                    initialLengthInput={initialLengthInput}
                    initialLengthUnit={initialLengthUnit}
                    prefillKey={prefillKey}
                    prefillPricePerKgInput={prefillPricePerKgInput}
                    prefillRequiredInput={prefillRequiredInput}
                    prefillLengthInput={prefillLengthInput}
                    prefillLengthUnit={prefillLengthUnit}
                    prefillDims={prefillDims}
                    onShowBanner={handleShowBanner}
                  />
                </ScrollView>
              </KeyboardAvoidingView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
})

const styles = StyleSheet.create({
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "transparent",
    width: "90%",
    maxWidth: 420,
    maxHeight: "80%",
    alignSelf: "center",
  },
  modalContent: {
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: "center",
  },
  keyboardAvoiding: {
    width: "100%",
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
})



