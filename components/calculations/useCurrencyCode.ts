import { useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getCurrencyByCountry, DEFAULT_CURRENCY } from "../../lib/currency-utils"
import { detectCountryCodeByIp } from "../../lib/detect-country"

const CURRENCY_STORAGE_KEY = "@ironmetal:auto_currency_code_v4"

let inMemoryCurrencyCode: string | null = null

export function useCurrencyCode() {
  const [currencyCode, setCurrencyCode] = useState(() => inMemoryCurrencyCode ?? DEFAULT_CURRENCY.code)

  useEffect(() => {
    if (inMemoryCurrencyCode) {
      setCurrencyCode(inMemoryCurrencyCode)
      return
    }

    const initCurrency = async () => {
      try {
        const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY)
        if (stored) {
          inMemoryCurrencyCode = stored
          setCurrencyCode(stored)
          return
        }

        const countryCode = await detectCountryCodeByIp({
          ipGeoApiKey: process.env.EXPO_PUBLIC_IPGEO_API_KEY,
          logPrefix: "[currency]",
        })
        if (!countryCode) return

        const currency = getCurrencyByCountry(countryCode)
        if (currency && currency.code) {
          inMemoryCurrencyCode = currency.code
          setCurrencyCode(currency.code)
          await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, currency.code)
        }
      } catch {
        // ignore
      }
    }

    void initCurrency()
  }, [])

  return currencyCode
}
