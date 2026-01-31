import React from "react"
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native"
import { COUNTRIES } from "../home/AccountModal"
import { useI18n } from "../../contexts/I18nContext"

export type CountryModalProps = {
  visible: boolean
  country: string
  onSelectCountry: (code: string) => void
  onClose: () => void
  styles: any
}

export function CountryModal({
  visible,
  country,
  onSelectCountry,
  onClose,
  styles,
}: CountryModalProps) {
  if (!visible) return null

  const { language, isRTL } = useI18n()
  const rtlText = {
    textAlign: isRTL ? ("right" as const) : ("left" as const),
    writingDirection: isRTL ? ("rtl" as const) : ("ltr" as const),
  }

  const countries = COUNTRIES as unknown as any[]
  const selectedIndex = countries.findIndex((c: any) => c.code === country)
  // يجب أن يتماشى هذا مع تصميم countryRow و countryListContent في ProfileScreen
  const ROW_STRIDE = 48 // height: 44 + marginBottom: 4 لكل صف
  const TOP_PADDING = 4 // paddingVertical: 4 في countryListContent (أعلى + أسفل)
  const initialYOffset =
    selectedIndex > -1 ? TOP_PADDING + selectedIndex * ROW_STRIDE : 0

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalBackdrop, styles.countryModalBackdrop]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalCard, styles.countryModalCard]}>
              <ScrollView
                style={styles.countryList}
                contentContainerStyle={styles.countryListContent}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
                overScrollMode="never"
                contentOffset={{ x: 0, y: initialYOffset }}
              >
                {countries.map((c: any) => {
                  const isActive = c.code === country
                  return (
                    <TouchableOpacity
                      key={c.code}
                      style={[
                        styles.countryRow,
                        isRTL ? { flexDirection: "row-reverse" } : null,
                        isActive && styles.countryRowActive,
                      ]}
                      activeOpacity={0.9}
                      onPress={() => {
                        onSelectCountry(c.code)
                        onClose()
                      }}
                    >
                      <Text
                        style={[
                          styles.countryFlag,
                          isRTL ? { marginRight: 0, marginLeft: 8 } : null,
                        ]}
                      >
                        {c.flag}
                      </Text>
                      <Text
                        style={[
                          styles.countryRowText,
                          rtlText,
                          isActive && styles.countryRowTextActive,
                        ]}
                      >
                        {language === "ar" ? c.nameAr || c.name : c.name || c.nameAr}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
