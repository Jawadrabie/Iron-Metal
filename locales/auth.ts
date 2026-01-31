export type AuthLocale = {
  loginHeader: {
    titlePhone: string
    titleCode: string
    subtitlePhone: string
    subtitleCodeBase: string
  }
  accountModal: {
    noticeTitle: string
    errorTitle: string
    title: string
    loggedInSubtitle: string
    unnamedUser: string
    phoneLabel: string
    countryLabel: string
    preferredLanguageLabel: string
    logout: string
    guestSubtitle: string
    guestName: string
    login: string
    languageArabic: string
    languageEnglish: string
    missingPhone: string
    missingCode: string
    sendOtpFailed: string
    invalidCode: string
    networkTimeout: string
  }
  loginPhoneForm: {
    label: string
    buttonText: string
  }
  loginCodeForm: {
    label: string
    placeholder: string
    buttonText: string
    secondaryText: string
  }
  loginMessages: {
    missingPhone: string
    sendOtpFailed: string
    networkTimeout: string
    missingCode: string
    invalidCode: string
    success: string
  }
}

export const authTexts: Record<"ar" | "en", AuthLocale> = {
  ar: {
    loginHeader: {
      titlePhone: "تسجيل الدخول",
      titleCode: "أدخل رمز التحقق",
      subtitlePhone: "يرجى تأكيد مفتاح الدولة ثم إدخال رقم الجوال.",
      subtitleCodeBase: "تم إرسال الرمز إلى",
    },
    accountModal: {
      noticeTitle: "تنبيه",
      errorTitle: "خطأ",
      title: "حسابي",
      loggedInSubtitle: "تم تسجيل الدخول عبر واتساب",
      unnamedUser: "مستخدم بدون اسم",
      phoneLabel: "رقم الجوال",
      countryLabel: "الدولة",
      preferredLanguageLabel: "اللغة المفضلة",
      logout: "تسجيل الخروج",
      guestSubtitle: "لم تقم بتسجيل الدخول بعد.",
      guestName: "ضيف",
      login: "تسجيل الدخول",
      languageArabic: "العربية",
      languageEnglish: "English",
      missingPhone: "يرجى إدخال رقم الجوال",
      missingCode: "يرجى إدخال رمز التحقق",
      sendOtpFailed: "فشل إرسال كود واتساب",
      invalidCode: "رمز تحقق غير صحيح",
      networkTimeout: "انتهت مهلة الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى",
    },
    loginPhoneForm: {
      label: "رقم الجوال",
      buttonText: "التالي",
    },
    loginCodeForm: {
      label: "رمز التحقق",
      placeholder: "رمز من 6 أرقام",
      buttonText: "تأكيد ومتابعة",
      secondaryText: "استخدام رقم جوال مختلف",
    },
    loginMessages: {
      missingPhone: "يرجى إدخال رقم الجوال",
      sendOtpFailed: "فشل إرسال كود واتساب",
      networkTimeout: "انتهت مهلة الاتصال. تأكد من الإنترنت ثم حاول مرة أخرى",
      missingCode: "يرجى إدخال رمز التحقق",
      invalidCode: "رمز تحقق غير صحيح",
      success: "تم تسجيل الدخول بنجاح",
    },
  },
  en: {
    loginHeader: {
      titlePhone: "Sign in",
      titleCode: "Enter verification code",
      subtitlePhone: "Please confirm your country code and enter your phone number.",
      subtitleCodeBase: "We've sent the code to",
    },
    accountModal: {
      noticeTitle: "Notice",
      errorTitle: "Error",
      title: "My account",
      loggedInSubtitle: "Signed in via WhatsApp",
      unnamedUser: "Unnamed user",
      phoneLabel: "Phone number",
      countryLabel: "Country",
      preferredLanguageLabel: "Preferred language",
      logout: "Sign out",
      guestSubtitle: "You are not signed in yet.",
      guestName: "Guest",
      login: "Sign in",
      languageArabic: "Arabic",
      languageEnglish: "English",
      missingPhone: "Please enter your phone number",
      missingCode: "Please enter the verification code",
      sendOtpFailed: "Failed to send WhatsApp code",
      invalidCode: "Invalid verification code",
      networkTimeout: "Connection timed out. Check your internet and try again.",
    },
    loginPhoneForm: {
      label: "Phone number",
      buttonText: "Next",
    },
    loginCodeForm: {
      label: "Verification code",
      placeholder: "6-digit code",
      buttonText: "Verify & continue",
      secondaryText: "Use a different phone number",
    },
    loginMessages: {
      missingPhone: "Please enter your phone number",
      sendOtpFailed: "Failed to send WhatsApp code",
      networkTimeout: "Connection timed out. Check your internet and try again.",
      missingCode: "Please enter the verification code",
      invalidCode: "Invalid verification code",
      success: "Signed in successfully",
    },
  },
}
