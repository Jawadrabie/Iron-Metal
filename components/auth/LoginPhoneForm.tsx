import React, { useMemo, useState } from "react"
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native"

import { getExampleNumber } from "libphonenumber-js"
import examples from "libphonenumber-js/examples.mobile.json"
import { useI18n } from "../../contexts/I18nContext"

import {
  PhoneNumberInput,
  PhoneNumberValue,
} from "./PhoneNumberInput"

type LoginPhoneFormProps = {
  phoneRaw: string
  isPending: boolean
  styles: any
  onChangePhoneRaw: (value: string) => void
  onChangePhoneFormatted: (value: string) => void
  onSubmit: () => void
}

export function LoginPhoneForm({
  phoneRaw,
  isPending,
  styles,
  onChangePhoneRaw,
  onChangePhoneFormatted,
  onSubmit,
}: LoginPhoneFormProps) {
  const { isRTL, t } = useI18n()

  const [phoneValue, setPhoneValue] = useState<PhoneNumberValue>({
    callingCode: "+966",
    nationalNumber: "",
    country: undefined,
    e164: undefined,
  })
  const [isValid, setIsValid] = useState(false)

  const expectedNationalLength = useMemo(() => {
    if (!phoneValue.country) return undefined
    try {
      const example = getExampleNumber(phoneValue.country, examples as any)
      return example?.nationalNumber.length
    } catch {
      return undefined
    }
  }, [phoneValue.country])

  const nationalDigitsCount = (phoneValue.nationalNumber || "")
    .replace(/\D/g, "")
    .replace(/^0+/, "").length
  const callingDigitsCount = (phoneValue.callingCode || "").replace(/\D/g, "").length

  const canSubmit =
    callingDigitsCount > 0 &&
    (expectedNationalLength
      ? nationalDigitsCount === expectedNationalLength
      : isValid)
  const isSubmitDisabled = !canSubmit || isPending

  const label = t.auth.loginPhoneForm.label
  const buttonText = t.auth.loginPhoneForm.buttonText

  const handleChange = (next: PhoneNumberValue) => {
    setPhoneValue(next)

    const nationalNoLeadingZero = (next.nationalNumber || "").replace(/^0+/, "")
    const fullPlain = `${next.callingCode}${nationalNoLeadingZero}`
    onChangePhoneRaw(fullPlain)
    onChangePhoneFormatted(next.e164 ?? fullPlain)
  }

  return (
    <View style={styles.formBox}>
      <View style={styles.fieldGroup}>
        <Text
          style={[
            styles.label,
            isRTL ? { textAlign: "right", alignSelf: "flex-end" } : null,
          ]}
        >
          {label}
        </Text>

        <PhoneNumberInput
          value={phoneValue}
          onChange={handleChange}
          onValidityChange={setIsValid}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          isSubmitDisabled ? styles.primaryButtonDisabled : null,
        ]}
        activeOpacity={0.9}
        onPress={onSubmit}
        disabled={isSubmitDisabled}
      >
        {isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>{buttonText}</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}
