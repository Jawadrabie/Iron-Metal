import React, { useEffect, useState } from "react"
import { Image, Text, View } from "react-native"
import CountryFlag from "react-native-country-flag"
import { parsePhoneNumberFromString } from "libphonenumber-js"
import { SvgXml } from "react-native-svg"

import { useI18n } from "../../contexts/I18nContext"
import { getLocalSvgXml } from "../../lib/localAssets"

type LoginHeaderProps = {
  step: "phone" | "code"
  fullPhone: string
  styles: any
}

export function LoginHeader({ step, fullPhone, styles }: LoginHeaderProps) {
  const { isRTL, t } = useI18n()
  const tt = t.auth.loginHeader

  const [logoSvgXml, setLogoSvgXml] = useState<string | null>(null)

  const title = step === "phone" ? tt.titlePhone : tt.titleCode

  const subtitleBase =
    step === "phone" ? tt.subtitlePhone : tt.subtitleCodeBase

  const shouldShowPhone = step === "code" && !!fullPhone

  let countryIso: string | null = null
  if (shouldShowPhone) {
    try {
      const parsed = parsePhoneNumberFromString(fullPhone)
      countryIso = parsed?.country ?? null
    } catch {
      countryIso = null
    }
  }

  useEffect(() => {
    let mounted = true
    getLocalSvgXml("/icons/logo.svg")
      .then((xml) => {
        if (!mounted) return
        setLogoSvgXml(xml)
      })
      .catch(() => {
        if (!mounted) return
        setLogoSvgXml(null)
      })
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      <View style={styles.logoBox}>
        {logoSvgXml ? (
          <SvgXml xml={logoSvgXml} width={styles.logoImage?.width ?? 120} height={styles.logoImage?.height ?? 80} />
        ) : (
          <Image
            source={require("../../assets/icon/logo2.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.headerTextBox}>
        <Text style={[styles.titleText, { textAlign: "center" }]}>{title}</Text>

        {step === "phone" || !shouldShowPhone ? (
          <Text style={[styles.subtitleText, { textAlign: "center" }]}>
            {subtitleBase}
          </Text>
        ) : (
          <View
            style={{
              flexDirection: isRTL ? "row-reverse" : "row",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            <Text style={[styles.subtitleText, { textAlign: "center" }]}>
              {subtitleBase}
            </Text>

            {countryIso ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginHorizontal: 4,
                }}
              >
                <CountryFlag isoCode={countryIso.toLowerCase()} size={14} />
                <Text
                  style={[
                    styles.subtitleText,
                    { writingDirection: "ltr", marginLeft: 4 },
                  ]}
                >
                  {`\u200E${fullPhone}`}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.subtitleText,
                  { writingDirection: "ltr", marginStart: 4 },
                ]}
              >
                {`\u200E${fullPhone}`}
              </Text>
            )}
          </View>
        )}
      </View>
    </>
  )
}
