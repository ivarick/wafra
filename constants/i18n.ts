export type Lang = "en" | "fr" | "ar";

export const GREETINGS = {
  en: "Hello! How can I help with your farm today?",
  fr: "Bonjour ! Comment puis-je vous aider avec votre ferme aujourd'hui ?",
  ar: "مرحباً! كيف يمكنني مساعدة مزرعتك اليوم؟",
};

// ─── Central UI translations ──────────────────────────────────────────────────
// Usage: const t = UI[lang];
export const UI = {
  en: {
    // ── Common ──────────────────────────────────────────────────────────────
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    close: "Close",
    search: "Search",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    confirm: "Confirm",
    retry: "Retry",
    noResults: "No results found",
    viewDetails: "View Details",
    all: "All",

    // ── Sheets / Crop Fact Sheets ────────────────────────────────────────────
    sheets: {
      title: "Crop Fact Sheets",
      searchPlaceholder: "Search crops, diseases, season…",
      commonDiseases: "10 Most Common Diseases (Offline)",
      noResults: "No crops found for",
      waterNeeds: "Water needs",
      plantingSeason: "Planting",
      harvestSeason: "Harvest",
    },

    // ── Map / Aid Centers ────────────────────────────────────────────────────
    map: {
      title: "Aid Centers",
      filters: {
        all: "All Centers",
        nearest: "Nearest to Me",
        chamber: "Chamber",
        cooperative: "Cooperative",
        itdas: "ITDAS",
      },
      createBtn: "Create Locator Here",
      viewDetails: "View Full Details",
      youAreHere: "You are here",
      newLocator: "New Locator",
      createHere: "Create a center here",
    },

    // ── Journal ──────────────────────────────────────────────────────────────
    journal: {
      title: "Field Journal",
      newEntry: "New Entry",
      addEntry: "Add Entry",
      noEntries: "No journal entries yet",
      noEntriesHint: "Tap + to record your first field observation",
      entryTitle: "Entry title",
      notes: "Notes",
      mood: "Season",
      date: "Date",
      weather: "Weather",
      deleteConfirm: "Delete this entry?",
    },

    // ── Gallery ──────────────────────────────────────────────────────────────
    gallery: {
      title: "Disease Gallery",
      upload: "Upload Photo",
      myPosts: "My Posts",
      filterByCrop: "Filter by crop",
      filterByWilaya: "Filter by wilaya",
      noPhotos: "No photos yet",
      noPhotosHint: "Be the first to share a disease photo",
      caption: "Caption",
      crop: "Crop",
      wilaya: "Wilaya",
      shareAnonymously: "Share anonymously",
    },

    // ── Reports ──────────────────────────────────────────────────────────────
    reports: {
      title: "Field Reports",
      newReport: "New Report",
      noReports: "No reports yet",
      export: "Export PDF",
      date: "Date",
      field: "Field",
      observations: "Observations",
      recommendations: "Recommendations",
    },

    // ── Calculator ───────────────────────────────────────────────────────────
    calculator: {
      title: "Farm Calculator",
      area: "Field Area",
      areaUnit: "Hectares",
      crop: "Crop",
      seedRate: "Seed Rate",
      fertilizer: "Fertilizer Need",
      water: "Water Need",
      calculate: "Calculate",
      result: "Results",
      seedNeeded: "Seed needed",
      fertilizerNeeded: "Fertilizer needed",
      waterNeeded: "Water needed",
    },

    // ── Pricing ──────────────────────────────────────────────────────────────
    pricing: {
      title: "Choose Your Plan",
      free: "Free",
      pro: "Pro Farmer",
      perMonth: "/ month",
      currentPlan: "Current Plan",
      upgrade: "Upgrade to Pro",
      features: "Features",
    },

    // ── Account ──────────────────────────────────────────────────────────────
    account: {
      title: "My Account",
      editProfile: "Edit Profile",
      name: "Name",
      email: "Email",
      phone: "Phone",
      wilaya: "Wilaya",
      joinedOn: "Joined",
      plan: "Plan",
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    auth: {
      login: "Sign In",
      register: "Create Account",
      email: "Email address",
      password: "Password",
      forgotPassword: "Forgot Password?",
      noAccount: "Don't have an account?",
      hasAccount: "Already have an account?",
      resetPassword: "Reset Password",
      sendResetLink: "Send Reset Link",
      resetSent: "Reset link sent! Check your inbox.",
    },

    // ── Create Locator ────────────────────────────────────────────────────────
    createLocator: {
      title: "Add Aid Center",
      name: "Center name",
      type: "Type",
      wilaya: "Wilaya",
      address: "Address",
      phone: "Phone number",
      email: "Email",
      submit: "Add Center",
    },

    // ── Change Password ───────────────────────────────────────────────────────
    changePassword: {
      title: "Change Password",
      current: "Current password",
      new: "New password",
      confirm: "Confirm new password",
      submit: "Update Password",
    },

    // ── Diagnosis ─────────────────────────────────────────────────────────────
    diagnosis: {
      title: "Crop Diagnosis",
      takePhoto: "Take Photo",
      choosePhoto: "Choose from Gallery",
      analyze: "Analyze",
      result: "Diagnosis Result",
      confidence: "Confidence",
      treatment: "Treatment",
      noImage: "Select a photo to analyze",
    },

    // ── Home ──────────────────────────────────────────────────────────────────
    home: {
      greeting: "Good morning",
      weather: "Today's weather",
      quickActions: "Quick Actions",
      recentActivity: "Recent Activity",
    },
  },

  fr: {
    back: "Retour",
    save: "Enregistrer",
    cancel: "Annuler",
    delete: "Supprimer",
    edit: "Modifier",
    close: "Fermer",
    search: "Rechercher",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    confirm: "Confirmer",
    retry: "Réessayer",
    noResults: "Aucun résultat trouvé",
    viewDetails: "Voir les détails",
    all: "Tout",

    sheets: {
      title: "Fiches Cultures",
      searchPlaceholder: "Rechercher cultures, maladies, saison…",
      commonDiseases: "10 Maladies les Plus Fréquentes (Hors ligne)",
      noResults: "Aucune culture trouvée pour",
      waterNeeds: "Besoins en eau",
      plantingSeason: "Plantation",
      harvestSeason: "Récolte",
    },

    map: {
      title: "Centres d'Aide",
      filters: {
        all: "Tous les Centres",
        nearest: "Les Plus Proches",
        chamber: "Chambre",
        cooperative: "Coopérative",
        itdas: "ITDAS",
      },
      createBtn: "Créer un Localisateur",
      viewDetails: "Voir les Détails",
      youAreHere: "Vous êtes ici",
      newLocator: "Nouveau localisateur",
      createHere: "Créer un centre ici",
    },

    journal: {
      title: "Journal de Terrain",
      newEntry: "Nouvelle Entrée",
      addEntry: "Ajouter",
      noEntries: "Aucune entrée de journal",
      noEntriesHint: "Appuyez sur + pour enregistrer votre première observation",
      entryTitle: "Titre de l'entrée",
      notes: "Notes",
      mood: "Saison",
      date: "Date",
      weather: "Météo",
      deleteConfirm: "Supprimer cette entrée ?",
    },

    gallery: {
      title: "Galerie des Maladies",
      upload: "Uploader une Photo",
      myPosts: "Mes Publications",
      filterByCrop: "Filtrer par culture",
      filterByWilaya: "Filtrer par wilaya",
      noPhotos: "Aucune photo pour l'instant",
      noPhotosHint: "Soyez le premier à partager une photo de maladie",
      caption: "Légende",
      crop: "Culture",
      wilaya: "Wilaya",
      shareAnonymously: "Partager anonymement",
    },

    reports: {
      title: "Rapports de Terrain",
      newReport: "Nouveau Rapport",
      noReports: "Aucun rapport pour l'instant",
      export: "Exporter PDF",
      date: "Date",
      field: "Champ",
      observations: "Observations",
      recommendations: "Recommandations",
    },

    calculator: {
      title: "Calculateur Agricole",
      area: "Surface du Champ",
      areaUnit: "Hectares",
      crop: "Culture",
      seedRate: "Taux de Semis",
      fertilizer: "Besoin en Engrais",
      water: "Besoin en Eau",
      calculate: "Calculer",
      result: "Résultats",
      seedNeeded: "Semences nécessaires",
      fertilizerNeeded: "Engrais nécessaires",
      waterNeeded: "Eau nécessaire",
    },

    pricing: {
      title: "Choisissez votre Forfait",
      free: "Gratuit",
      pro: "Pro Agriculteur",
      perMonth: "/ mois",
      currentPlan: "Forfait Actuel",
      upgrade: "Passer au Pro",
      features: "Fonctionnalités",
    },

    account: {
      title: "Mon Compte",
      editProfile: "Modifier le Profil",
      name: "Nom",
      email: "E-mail",
      phone: "Téléphone",
      wilaya: "Wilaya",
      joinedOn: "Inscrit le",
      plan: "Forfait",
    },

    auth: {
      login: "Se Connecter",
      register: "Créer un Compte",
      email: "Adresse e-mail",
      password: "Mot de passe",
      forgotPassword: "Mot de passe oublié ?",
      noAccount: "Pas encore de compte ?",
      hasAccount: "Déjà un compte ?",
      resetPassword: "Réinitialiser le mot de passe",
      sendResetLink: "Envoyer le lien",
      resetSent: "Lien envoyé ! Vérifiez votre boîte mail.",
    },

    createLocator: {
      title: "Ajouter un Centre",
      name: "Nom du centre",
      type: "Type",
      wilaya: "Wilaya",
      address: "Adresse",
      phone: "Numéro de téléphone",
      email: "E-mail",
      submit: "Ajouter le Centre",
    },

    changePassword: {
      title: "Modifier le Mot de Passe",
      current: "Mot de passe actuel",
      new: "Nouveau mot de passe",
      confirm: "Confirmer le nouveau mot de passe",
      submit: "Mettre à Jour",
    },

    diagnosis: {
      title: "Diagnostic des Cultures",
      takePhoto: "Prendre une Photo",
      choosePhoto: "Choisir dans la Galerie",
      analyze: "Analyser",
      result: "Résultat du Diagnostic",
      confidence: "Confiance",
      treatment: "Traitement",
      noImage: "Sélectionnez une photo à analyser",
    },

    home: {
      greeting: "Bonjour",
      weather: "Météo du jour",
      quickActions: "Actions Rapides",
      recentActivity: "Activité Récente",
    },
  },

  ar: {
    back: "رجوع",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    close: "إغلاق",
    search: "بحث",
    loading: "جاري التحميل...",
    error: "خطأ",
    success: "نجاح",
    confirm: "تأكيد",
    retry: "إعادة المحاولة",
    noResults: "لا توجد نتائج",
    viewDetails: "عرض التفاصيل",
    all: "الكل",

    sheets: {
      title: "بطاقات المحاصيل",
      searchPlaceholder: "ابحث عن محاصيل، أمراض، موسم...",
      commonDiseases: "أكثر 10 أمراض شيوعاً (بدون انترنت)",
      noResults: "لا توجد محاصيل لـ",
      waterNeeds: "الاحتياجات المائية",
      plantingSeason: "موسم الزراعة",
      harvestSeason: "موسم الحصاد",
    },

    map: {
      title: "مراكز الدعم",
      filters: {
        all: "جميع المراكز",
        nearest: "الأقرب إليّ",
        chamber: "غرفة",
        cooperative: "تعاونية",
        itdas: "ITDAS",
      },
      createBtn: "إنشاء موقع هنا",
      viewDetails: "عرض التفاصيل الكاملة",
      youAreHere: "موقعك الحالي",
      newLocator: "موقع جديد",
      createHere: "إنشاء مركز هنا",
    },

    journal: {
      title: "مجلة الحقل",
      newEntry: "إدخال جديد",
      addEntry: "إضافة",
      noEntries: "لا توجد إدخالات بعد",
      noEntriesHint: "اضغط + لتسجيل أول ملاحظة ميدانية",
      entryTitle: "عنوان الإدخال",
      notes: "ملاحظات",
      mood: "الموسم",
      date: "التاريخ",
      weather: "الطقس",
      deleteConfirm: "حذف هذا الإدخال؟",
    },

    gallery: {
      title: "معرض الأمراض",
      upload: "رفع صورة",
      myPosts: "منشوراتي",
      filterByCrop: "تصفية حسب المحصول",
      filterByWilaya: "تصفية حسب الولاية",
      noPhotos: "لا توجد صور بعد",
      noPhotosHint: "كن أول من يشارك صورة مرض",
      caption: "تعليق",
      crop: "المحصول",
      wilaya: "الولاية",
      shareAnonymously: "المشاركة بشكل مجهول",
    },

    reports: {
      title: "تقارير الحقل",
      newReport: "تقرير جديد",
      noReports: "لا توجد تقارير بعد",
      export: "تصدير PDF",
      date: "التاريخ",
      field: "الحقل",
      observations: "الملاحظات",
      recommendations: "التوصيات",
    },

    calculator: {
      title: "الآلة الحاسبة الزراعية",
      area: "مساحة الحقل",
      areaUnit: "هكتار",
      crop: "المحصول",
      seedRate: "معدل البذر",
      fertilizer: "الاحتياج من الأسمدة",
      water: "الاحتياج من المياه",
      calculate: "احسب",
      result: "النتائج",
      seedNeeded: "البذور المطلوبة",
      fertilizerNeeded: "الأسمدة المطلوبة",
      waterNeeded: "المياه المطلوبة",
    },

    pricing: {
      title: "اختر خطتك",
      free: "مجاني",
      pro: "المزارع المحترف",
      perMonth: "/ شهر",
      currentPlan: "الخطة الحالية",
      upgrade: "ترقية إلى Pro",
      features: "المزايا",
    },

    account: {
      title: "حسابي",
      editProfile: "تعديل الملف الشخصي",
      name: "الاسم",
      email: "البريد الإلكتروني",
      phone: "الهاتف",
      wilaya: "الولاية",
      joinedOn: "تاريخ الانضمام",
      plan: "الخطة",
    },

    auth: {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      forgotPassword: "نسيت كلمة المرور؟",
      noAccount: "ليس لديك حساب؟",
      hasAccount: "لديك حساب بالفعل؟",
      resetPassword: "إعادة تعيين كلمة المرور",
      sendResetLink: "إرسال رابط الإعادة",
      resetSent: "تم الإرسال! تحقق من بريدك الإلكتروني.",
    },

    createLocator: {
      title: "إضافة مركز دعم",
      name: "اسم المركز",
      type: "النوع",
      wilaya: "الولاية",
      address: "العنوان",
      phone: "رقم الهاتف",
      email: "البريد الإلكتروني",
      submit: "إضافة المركز",
    },

    changePassword: {
      title: "تغيير كلمة المرور",
      current: "كلمة المرور الحالية",
      new: "كلمة المرور الجديدة",
      confirm: "تأكيد كلمة المرور الجديدة",
      submit: "تحديث",
    },

    diagnosis: {
      title: "تشخيص المحاصيل",
      takePhoto: "التقاط صورة",
      choosePhoto: "اختيار من المعرض",
      analyze: "تحليل",
      result: "نتيجة التشخيص",
      confidence: "الثقة",
      treatment: "العلاج",
      noImage: "اختر صورة للتحليل",
    },

    home: {
      greeting: "صباح الخير",
      weather: "طقس اليوم",
      quickActions: "الإجراءات السريعة",
      recentActivity: "النشاط الأخير",
    },
  },
} as const;

export type Translations = (typeof UI)[Lang];
