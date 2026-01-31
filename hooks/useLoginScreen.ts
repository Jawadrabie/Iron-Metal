import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigation } from "@react-navigation/native"

import { sendWhatsappOtpMobile, verifyWhatsappOtpMobile } from "../lib/auth"
import { useI18n } from "../contexts/I18nContext"

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error("TIMEOUT"))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      },
    )
  })
}

type UseLoginScreenOptions = {
  onClose?: () => void
}

type Step = "phone" | "code"

export function useLoginScreen(options: UseLoginScreenOptions = {}) {
  const navigation = useNavigation<any>()
  const { onClose } = options
  const { language, t } = useI18n()
  const texts = t.auth

  const [step, setStep] = useState<Step>("phone")
  const [phoneRaw, setPhoneRaw] = useState("")
  const [phoneFormatted, setPhoneFormatted] = useState("")
  const [code, setCode] = useState("")
  const [requestId, setRequestId] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const mountedRef = useRef(true)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
        successTimeoutRef.current = null
      }
    }
  }, [])

  const fullPhone = useMemo(() => {
    const formatted = phoneFormatted.trim()
    if (formatted) return formatted
    return phoneRaw.trim()
  }, [phoneFormatted, phoneRaw])

  const handleBack = useCallback(() => {
    if (onClose) onClose()
    else navigation.goBack()
  }, [navigation, onClose])

  const handleSendOtp = useCallback(async () => {
    if (!fullPhone) {
      setErrorMessage(texts.loginMessages.missingPhone)
      return
    }

    setErrorMessage(null)
    setIsPending(true)
    try {
      const res = await withTimeout(
        sendWhatsappOtpMobile(fullPhone, language),
        20000,
      )
      if (!mountedRef.current) return

      if (!res.success) {
        setErrorMessage(res.error || texts.loginMessages.sendOtpFailed)
        return
      }

      setRequestId(res.requestId || "")
      setStep("code")
    } catch (e: any) {
      if (!mountedRef.current) return
      const msg = String(e?.message || "")
      if (msg === "TIMEOUT") {
        setErrorMessage(texts.loginMessages.networkTimeout)
      } else {
        setErrorMessage(texts.loginMessages.sendOtpFailed)
      }
    } finally {
      if (!mountedRef.current) return
      setIsPending(false)
    }
  }, [fullPhone, language, texts.loginMessages.missingPhone, texts.loginMessages.networkTimeout, texts.loginMessages.sendOtpFailed])

  const handleVerifyOtp = useCallback(async () => {
    if (!code.trim()) {
      setErrorMessage(texts.loginMessages.missingCode)
      return
    }

    setErrorMessage(null)
    setIsPending(true)
    try {
      const res = await withTimeout(
        verifyWhatsappOtpMobile({
          phone: fullPhone,
          code: code.trim(),
          requestId,
        }, language),
        20000,
      )
      if (!mountedRef.current) return

      if (!res.success) {
        setErrorMessage(res.error || texts.loginMessages.invalidCode)
        return
      }

      setStep("phone")
      setCode("")
      setRequestId("")
      setSuccessMessage(texts.loginMessages.success)

      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }

      successTimeoutRef.current = setTimeout(() => {
        successTimeoutRef.current = null
        if (!mountedRef.current) return
        setSuccessMessage(null)
        navigation.reset({
          index: 0,
          routes: [
            {
              name: "Home" as never,
              params: { initialTab: "home" } as never,
            },
          ],
        })
      }, 800)
    } catch (e: any) {
      if (!mountedRef.current) return
      const msg = String(e?.message || "")
      if (msg === "TIMEOUT") {
        setErrorMessage(texts.loginMessages.networkTimeout)
      } else {
        setErrorMessage(texts.loginMessages.invalidCode)
      }
    } finally {
      if (!mountedRef.current) return
      setIsPending(false)
    }
  }, [code, fullPhone, language, navigation, requestId, texts.loginMessages.invalidCode, texts.loginMessages.missingCode, texts.loginMessages.networkTimeout, texts.loginMessages.success])

  const handleChangePhoneRaw = useCallback((value: string) => {
    setPhoneRaw(value)
  }, [])

  const handleChangePhoneFormatted = useCallback((value: string) => {
    setPhoneFormatted(value)
  }, [])

  const handleChangeCode = useCallback((value: string) => {
    const normalized = value
      .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
      .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
      .replace(/\D/g, "")
      .slice(0, 6)

    setCode(normalized)
  }, [])

  const handleUseDifferentNumber = useCallback(() => {
    setStep("phone")
    setCode("")
    setRequestId("")
  }, [])

  return {
    step,
    phoneRaw,
    phoneFormatted,
    code,
    isPending,
    successMessage,
    errorMessage,
    fullPhone,
    handleBack,
    handleSendOtp,
    handleVerifyOtp,
    handleChangePhoneRaw,
    handleChangePhoneFormatted,
    handleChangeCode,
    handleUseDifferentNumber,
    setCode,
  }
}

export type UseLoginScreenReturn = ReturnType<typeof useLoginScreen>
