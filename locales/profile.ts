export type ProfileLocale = {
  content: {
    accountVerified: string
    fullNameLabel: string
    fullNamePlaceholder: string
    emailLabel: string
    emailPlaceholder: string
    phoneLabel: string
    phonePlaceholder: string
    preferredLanguageLabel: string
    countryLabel: string
    saveChanges: string
    deleteAccount: string
    privacyPolicy: string
    guestTitle: string
    guestSubtitle: string
    guestName: string
    signIn: string
    languageArabic: string
    languageEnglish: string
  }
  logoutConfirm: {
    title: string
    subtitle: string
    cancel: string
    confirm: string
  }
  messages: {
    errorTitle: string
    noticeTitle: string
    loadAccountFailed: string
    photosPermission: string
    logoutSuccess: string
    saveSuccess: string
    saveFailed: string
    avatarUpdated: string
    avatarUpdateFailed: string
  }
}

export const profileTexts: Record<"ar" | "en", ProfileLocale> = {
  en: {
    content: {
      accountVerified: "Account verified",
      fullNameLabel: "Full name",
      fullNamePlaceholder: "Full name",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      phoneLabel: "Phone",
      phonePlaceholder: "+966...",
      preferredLanguageLabel: "Preferred language",
      countryLabel: "Country",
      saveChanges: "Save changes",
      deleteAccount: "Delete Account",
      privacyPolicy: "Privacy Policy",
      guestTitle: "Account",
      guestSubtitle: "You are not signed in yet.",
      guestName: "Guest",
      signIn: "Sign in",
      languageArabic: "Arabic",
      languageEnglish: "English",
    },
    logoutConfirm: {
      title: "Confirm logout",
      subtitle: "Are you sure you want to log out from your account?",
      cancel: "Cancel",
      confirm: "Log out",
    },
    messages: {
      errorTitle: "Error",
      noticeTitle: "Notice",
      loadAccountFailed: "Failed to load account details",
      photosPermission: "Please allow photo library access to change your profile picture",
      logoutSuccess: "Logged out successfully",
      saveSuccess: "Changes saved successfully",
      saveFailed: "Failed to save changes",
      avatarUpdated: "Profile photo updated successfully",
      avatarUpdateFailed: "Failed to update profile photo",
    },
  },
  ar: {
    content: {
      accountVerified: "تم توثيق الحساب",
      fullNameLabel: "الاسم الكامل",
      fullNamePlaceholder: "الاسم الكامل",
      emailLabel: "البريد الإلكتروني",
      emailPlaceholder: "email@example.com",
      phoneLabel: "رقم الهاتف",
      phonePlaceholder: "+966...",
      preferredLanguageLabel: "اللغة المفضلة",
      countryLabel: "الدولة",
      saveChanges: "حفظ التغييرات",
      deleteAccount: "حذف الحساب",
      privacyPolicy: "سياسة الخصوصية",
      guestTitle: "الحساب",
      guestSubtitle: "لم تقم بتسجيل الدخول بعد.",
      guestName: "زائر",
      signIn: "تسجيل الدخول",
      languageArabic: "العربية",
      languageEnglish: "English",
    },
    logoutConfirm: {
      title: "تأكيد تسجيل الخروج",
      subtitle: "هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟",
      cancel: "إلغاء",
      confirm: "تسجيل الخروج",
    },
    messages: {
      errorTitle: "خطأ",
      noticeTitle: "تنبيه",
      loadAccountFailed: "تعذر تحميل بيانات الحساب",
      photosPermission: "يجب السماح بالوصول إلى الصور لتغيير الصورة الشخصية",
      logoutSuccess: "تم تسجيل الخروج بنجاح",
      saveSuccess: "تم حفظ التغييرات بنجاح",
      saveFailed: "تعذر حفظ التغييرات",
      avatarUpdated: "تم تحديث الصورة الشخصية بنجاح",
      avatarUpdateFailed: "تعذر تحديث الصورة الشخصية",
    },
  },
}
