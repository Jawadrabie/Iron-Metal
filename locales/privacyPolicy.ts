export type PrivacyPolicySection = {
  heading: string
  paragraphs?: string[]
  bullets?: string[]
}

export type PrivacyPolicyLocale = {
  title: string
  updatedAt: string
  intro: string[]
  sections: PrivacyPolicySection[]
  ui: {
    back: string
    copiedToClipboard: string
  }
}

export const privacyPolicyTexts: Record<"ar" | "en", PrivacyPolicyLocale> = {
  ar: {
    title: "سياسة الخصوصية لتطبيق Iron & Metal",
    updatedAt: "آخر تحديث: 12 كانون الثاني 2026",
    intro: [
      "نحن في Iron & Metal نولي أهمية قصوى لحماية خصوصية مستخدمينا. توضح سياسة الخصوصية هذه كيفية جمع واستخدام وحماية المعلومات عند استخدامكم للتطبيق.",
    ],
    ui: {
      back: "رجوع",
      copiedToClipboard: "تم النسخ إلى الحافظة",
    },
    sections: [
      {
        heading: "1. المعلومات التي نقوم بجمعها",
        paragraphs: [
          "نقوم بجمع الحد الأدنى من المعلومات الضرورية لتشغيل التطبيق وتقديم خدماته، وتشمل:",
        ],
        bullets: [
          "بيانات الهوية والحساب: مثل الاسم، رقم الجوال، الدولة، ومعلومات تسجيل الدخول.",
          "التفضيلات الشخصية: مثل اللغة، العملة، والقطاعات أو العناصر المفضلة داخل التطبيق.",
          "البيانات التقنية: مثل نوع الجهاز، نظام التشغيل، وعنوان IP، وذلك لأغراض تقنية مثل تحديد الموقع التقريبي أو العملة المناسبة.",
          "إشعارات الجهاز: عند تفعيل الإشعارات، يتم استخدام رموز تقنية خاصة بالجهاز (Push Tokens) لإيصال التنبيهات.",
        ],
      },
      {
        heading: "2. كيفية استخدام المعلومات",
        paragraphs: ["نستخدم المعلومات التي يتم جمعها للأغراض التالية:"],
        bullets: [
          "تشغيل الوظائف الأساسية للتطبيق وتقديم الخدمات.",
          "تخصيص تجربة المستخدم بناءً على الإعدادات والتفضيلات.",
          "تحسين أداء التطبيق وتحليل الأعطال والمشاكل التقنية.",
          "إرسال إشعارات متعلقة بالتحديثات أو الخدمات المهمة (بعد موافقة المستخدم).",
          "الامتثال للمتطلبات القانونية وحماية أمن المستخدمين.",
        ],
      },
      {
        heading: "3. الإشعارات",
        paragraphs: [
          "عند موافقتكم على تفعيل الإشعارات، يستخدم التطبيق خدمات إشعارات مقدمة من أطراف خارجية موثوقة مثل Google Firebase Cloud Messaging (FCM) وExpo لإرسال التنبيهات.",
        ],
        bullets: [
          "يتم استخدام رموز تقنية خاصة بالجهاز فقط لغرض إرسال الإشعارات.",
          "لا يتم استخدام هذه الرموز لتعريف المستخدم بشكل شخصي.",
          "يمكنكم إيقاف الإشعارات في أي وقت من خلال إعدادات الجهاز.",
        ],
      },
      {
        heading: "4. مشاركة البيانات مع أطراف خارجية",
        paragraphs: [
          "قد تتم مشاركة بعض البيانات التقنية مع مزودي خدمات موثوقين فقط، وذلك لأغراض تشغيلية، مثل:",
        ],
        bullets: [
          "خدمات الاستضافة وقواعد البيانات لتخزين البيانات بشكل آمن.",
          "خدمات الإشعارات (مثل Firebase وExpo).",
          "أدوات التحليل التقنية لتحسين أداء التطبيق وجودة الخدمة.",
          "لا يتم بيع أو مشاركة بياناتكم الشخصية مع أي أطراف خارجية لأغراض تسويقية.",
        ],
      },
      {
        heading: "5. حقوق المستخدم وإدارة البيانات",
        paragraphs: ["نمنح المستخدمين السيطرة الكاملة على بياناتهم، وتشمل:"],
        bullets: [
          "التعديل: إمكانية تحديث المعلومات الشخصية من داخل التطبيق.",
          "الحذف: إمكانية حذف بيانات التطبيق من الجهاز.",
          "حذف الحساب: يمكن طلب حذف الحساب من داخل التطبيق، وسيتم حذف البيانات الشخصية من أنظمتنا خلال فترة زمنية معقولة، مع الاحتفاظ فقط بالبيانات المطلوبة قانونيًا إن وجدت.",
        ],
      },
      {
        heading: "6. موافقة المستخدم",
        paragraphs: [
          "باستخدامكم للتطبيق، فإنكم توافقون على جمع واستخدام البيانات وفقًا لهذه السياسة.",
          "يتم طلب الموافقة الصريحة من المستخدم قبل تفعيل الإشعارات، ويمكن سحب هذه الموافقة في أي وقت.",
        ],
      },
      {
        heading: "7. التواصل معنا",
        paragraphs: [
          "لأي استفسارات أو طلبات متعلقة بالخصوصية، يمكنكم التواصل معنا عبر:",
          "البريد الإلكتروني: info@akafi.net",
          "واتساب: \u200E+966 11 269 0999",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Policy for Iron & Metal App",
    updatedAt: "Last Updated: January 12, 2026",
    intro: [
      "At Iron & Metal, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our application.",
    ],
    ui: {
      back: "Back",
      copiedToClipboard: "Copied to clipboard",
    },
    sections: [
      {
        heading: "1. Information We Collect",
        paragraphs: [
          "We collect only the information necessary to operate the app and provide its services, including:",
        ],
        bullets: [
          "Account and identity information: such as name, phone number, country, and login details.",
          "User preferences: including language, currency, and selected preferences within the app.",
          "Technical data: such as device type, operating system, and IP address, used for technical purposes like approximate location and currency detection.",
          "Device notifications: when enabled, technical push tokens are used to deliver notifications.",
        ],
      },
      {
        heading: "2. How We Use Information",
        paragraphs: ["We use the collected information to:"],
        bullets: [
          "Operate the core features and services of the application.",
          "Personalize the user experience based on preferences.",
          "Improve app performance and diagnose technical issues.",
          "Send important updates or service-related notifications (with user consent).",
          "Comply with legal obligations and ensure platform security.",
        ],
      },
      {
        heading: "3. Push Notifications",
        paragraphs: [
          "When you enable push notifications, the app uses third-party notification services such as Google Firebase Cloud Messaging (FCM) and Expo to deliver notifications.",
        ],
        bullets: [
          "Device-specific technical tokens are used solely for notification delivery.",
          "These tokens are not used to personally identify users.",
          "You may disable notifications at any time through your device settings.",
        ],
      },
      {
        heading: "4. Data Sharing with Third Parties",
        paragraphs: [
          "We may share limited technical data with trusted third-party service providers for operational purposes only, including:",
        ],
        bullets: [
          "Cloud hosting and database services.",
          "Notification services (such as Firebase and Expo).",
          "Analytics and performance monitoring tools.",
          "We do not sell or share personal data with third parties for marketing purposes.",
        ],
      },
      {
        heading: "5. User Rights and Data Management",
        paragraphs: ["Users have full control over their data, including:"],
        bullets: [
          "Edit: update personal information within the app.",
          "Delete: remove app data from the device.",
          "Account deletion: request account deletion from within the app. Personal data will be removed from our systems within a reasonable timeframe, except where legal retention is required.",
        ],
      },
      {
        heading: "6. User Consent",
        paragraphs: [
          "By using the app, you agree to the collection and use of information in accordance with this Privacy Policy.",
          "Explicit consent is requested before enabling push notifications, and consent can be withdrawn at any time.",
        ],
      },
      {
        heading: "7. Contact Us",
        paragraphs: [
          "If you have any questions regarding this Privacy Policy, please contact us:",
          "Email: info@akafi.net",
          "WhatsApp: +966 11 269 0999",
        ],
      },
    ],
  },
}
