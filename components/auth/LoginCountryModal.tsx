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

type Country = (typeof COUNTRIES)[number]

type LoginCountryModalProps = {
  visible: boolean
  onClose: () => void
  onSelect: (country: Country) => void
  styles: any
}

export function LoginCountryModal({
  visible,
  onClose,
  onSelect,
  styles,
}: LoginCountryModalProps) {
  if (!visible) return null

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.countryModalBackdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.countryDropdownModal}>
              <ScrollView style={{ maxHeight: 240 }} keyboardShouldPersistTaps="handled">
                {COUNTRIES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={styles.countryItem}
                    activeOpacity={0.8}
                    onPress={() => {
                      onSelect(c)
                      onClose()
                    }}
                  >
                    <Text style={styles.countryItemName}>
                      {c.flag} {c.nameAr}
                    </Text>
                    <Text style={styles.countryItemDial}>{c.dial}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}
