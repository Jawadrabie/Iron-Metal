export type SupportLocale = {
  ui: {
    title: string
    suggestionsTitle: string
    back: string
    intro: string
    suggestionsIntro: string
    messageLabel: string
    messagePlaceholder: string
    messagePlaceholderSuggestions: string
    imageLabel: string
    chooseImageSourceTitle: string
    chooseImageCamera: string
    chooseImageGallery: string
    chooseImageCancel: string
    pickImage: string
    removeImage: string
    send: string
    sending: string
    ok: string
    loginRequiredTitle: string
    loginRequiredBody: string
    loginRequiredBodySuggestions: string
    login: string
    successTitle: string
    successBody: string
    errorTitle: string
    unknownError: string
    messageTooShort: string
    imagePermission: string
    cameraPermission: string
    invalidImage: string
    imageTooLarge: string
    whatsappLabel: string
    emailLabel: string
    websiteLabel: string
  }
}

export const supportTexts: Record<"ar" | "en", SupportLocale> = {
  en: {
    ui: {
      title: "Support",
      suggestionsTitle: "Your suggestions",
      back: "Back",
      intro: "Send us your support request or inquiry and we will get back to you as soon as possible.",
      suggestionsIntro: "Send us your suggestions to help us improve the app.",
      messageLabel: "Message",
      messagePlaceholder: "Write your request or inquiry details...",
      messagePlaceholderSuggestions: "Write your suggestions...",
      imageLabel: "Optional image",
      chooseImageSourceTitle: "Add image",
      chooseImageCamera: "Camera",
      chooseImageGallery: "Photo library",
      chooseImageCancel: "Cancel",
      pickImage: "Add image",
      removeImage: "Remove",
      send: "Send",
      sending: "Sending...",
      ok: "OK",
      loginRequiredTitle: "Sign in required",
      loginRequiredBody: "You must be signed in to send a support request.",
      loginRequiredBodySuggestions: "You must be signed in to send a suggestion.",
      login: "Sign in",
      successTitle: "Sent",
      successBody: "Your request has been sent successfully.",
      errorTitle: "Error",
      unknownError: "Something went wrong. Please try again.",
      messageTooShort: "Message must be at least 10 characters.",
      imagePermission: "Please allow photo library access.",
      cameraPermission: "Please allow camera access.",
      invalidImage: "Invalid image format.",
      imageTooLarge: "Image is too large.",
      whatsappLabel: "WhatsApp",
      emailLabel: "Email",
      websiteLabel: "Website",
    },
  },
  ar: {
    ui: {
      title: "الدعم",
      suggestionsTitle: "اقتراحاتك",
      back: "رجوع",
      intro: "أرسل لنا طلب الدعم أو الاستفسار وسنقوم بالرد عليك في أقرب وقت ممكن.",
      suggestionsIntro: "أرسل لنا اقتراحاتك لمساعدتنا على تطوير وتحسين التطبيق...",
      messageLabel: "الرسالة",
      messagePlaceholder: "اكتب تفاصيل طلبك أو استفسارك...",
      messagePlaceholderSuggestions: "اكتب اقتراحاتك...",
      imageLabel: "صورة اختيارية",
      chooseImageSourceTitle: "إضافة صورة",
      chooseImageCamera: "الكاميرا",
      chooseImageGallery: "الاستوديو",
      chooseImageCancel: "إلغاء",
      pickImage: "إضافة صورة",
      removeImage: "إزالة",
      send: "إرسال",
      sending: "جاري الإرسال...",
      ok: "موافق",
      loginRequiredTitle: "يلزم تسجيل الدخول",
      loginRequiredBody: "يجب تسجيل الدخول لإرسال طلب دعم.",
      loginRequiredBodySuggestions: "يجب تسجيل الدخول لإرسال اقتراح.",
      login: "تسجيل الدخول",
      successTitle: "تم الإرسال",
      successBody: "تم إرسال طلبك بنجاح.",
      errorTitle: "خطأ",
      unknownError: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      messageTooShort: "يجب ألا تقل الرسالة عن 10 أحرف.",
      imagePermission: "يرجى السماح بالوصول إلى الصور.",
      cameraPermission: "يرجى السماح بالوصول إلى الكاميرا.",
      invalidImage: "صيغة الصورة غير صالحة.",
      imageTooLarge: "حجم الصورة كبير جداً.",
      whatsappLabel: "واتساب",
      emailLabel: "البريد الإلكتروني",
      websiteLabel: "الموقع",
    },
  },
}
