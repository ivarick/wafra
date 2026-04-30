from django.core.management.base import BaseCommand
from django.db import transaction

from backend.offline_content.models import CropFactSheet, Disease


CROPS = [
    {
        "slug": "wheat",
        "name_fr": "Blé",
        "name_ar": "قمح",
        "name_en": "Wheat",
        "planting_calendar": {"sow": ["Oct", "Nov", "Dec"], "harvest": ["May", "Jun"]},
        "water_needs": {
            "liters_per_m2_per_week": 25,
            "notes_fr": "Besoins modérés, irrigation d'appoint à la montaison.",
            "notes_ar": "احتياجات معتدلة، ري تكميلي عند الإسبال.",
        },
        "avg_yield": "2.0 t/ha",
        "description_fr": "Céréale de base en Algérie, cultivée principalement dans les Hauts Plateaux.",
        "description_ar": "حبوب أساسية في الجزائر، تزرع أساسا في الهضاب العليا.",
    },
    {
        "slug": "barley",
        "name_fr": "Orge",
        "name_ar": "شعير",
        "name_en": "Barley",
        "planting_calendar": {"sow": ["Oct", "Nov"], "harvest": ["May", "Jun"]},
        "water_needs": {
            "liters_per_m2_per_week": 20,
            "notes_fr": "Rustique, tolère la sécheresse.",
            "notes_ar": "متحمل للجفاف نسبيا.",
        },
        "avg_yield": "1.6 t/ha",
        "description_fr": "Très adaptée aux zones semi-arides du sud algérien.",
        "description_ar": "متأقلم جدا مع المناطق شبه القاحلة في الجنوب الجزائري.",
    },
    {
        "slug": "tomato",
        "name_fr": "Tomate",
        "name_ar": "طماطم",
        "name_en": "Tomato",
        "planting_calendar": {"sow": ["Feb", "Mar"], "harvest": ["Jun", "Jul", "Aug"]},
        "water_needs": {
            "liters_per_m2_per_week": 35,
            "notes_fr": "Goutte-à-goutte recommandé pour éviter le mildiou.",
            "notes_ar": "يوصى بالري بالتنقيط لتجنب اللفحة.",
        },
        "avg_yield": "60 t/ha (irriguée)",
        "description_fr": "Culture intensive importante à Biskra et dans la Mitidja.",
        "description_ar": "محصول مكثف مهم في بسكرة ومتيجة.",
    },
    {
        "slug": "potato",
        "name_fr": "Pomme de terre",
        "name_ar": "بطاطا",
        "name_en": "Potato",
        "planting_calendar": {
            "sow": ["Feb", "Mar", "Aug"],
            "harvest": ["Jun", "Jul", "Nov", "Dec"],
        },
        "water_needs": {
            "liters_per_m2_per_week": 30,
            "notes_fr": "Sensible au stress hydrique pendant la tubérisation.",
            "notes_ar": "حساس للإجهاد المائي أثناء تكوين الدرنات.",
        },
        "avg_yield": "30 t/ha",
        "description_fr": "Culture stratégique, principal producteur : El Oued et Aïn Defla.",
        "description_ar": "محصول استراتيجي، أهم المنتجين: الوادي وعين الدفلى.",
    },
    {
        "slug": "olive",
        "name_fr": "Olivier",
        "name_ar": "زيتون",
        "name_en": "Olive",
        "planting_calendar": {"sow": ["Feb", "Mar"], "harvest": ["Oct", "Nov", "Dec"]},
        "water_needs": {
            "liters_per_m2_per_week": 15,
            "notes_fr": "Très résistant à la sécheresse une fois établi.",
            "notes_ar": "مقاوم جدا للجفاف بعد ترسخه.",
        },
        "avg_yield": "2.5 t/ha",
        "description_fr": "Pilier de l'agriculture kabyle, essentiel pour l'huile d'olive.",
        "description_ar": "ركيزة الزراعة القبائلية، أساسي لزيت الزيتون.",
    },
    {
        "slug": "date-palm",
        "name_fr": "Palmier dattier",
        "name_ar": "نخيل التمر",
        "name_en": "Date Palm",
        "planting_calendar": {"sow": ["Mar", "Apr"], "harvest": ["Sep", "Oct", "Nov"]},
        "water_needs": {
            "liters_per_m2_per_week": 40,
            "notes_fr": "Irrigation par submersion traditionnelle dans les oasis.",
            "notes_ar": "ري بالغمر تقليدي في الواحات.",
        },
        "avg_yield": "80 kg/arbre",
        "description_fr": "Symbole des oasis du sud, variété phare : Deglet Nour.",
        "description_ar": "رمز واحات الجنوب، الصنف الرائد: دقلة نور.",
    },
    {
        "slug": "onion",
        "name_fr": "Oignon",
        "name_ar": "بصل",
        "name_en": "Onion",
        "planting_calendar": {"sow": ["Sep", "Oct"], "harvest": ["May", "Jun"]},
        "water_needs": {
            "liters_per_m2_per_week": 22,
            "notes_fr": "Réduire l'irrigation 2 semaines avant la récolte.",
            "notes_ar": "خفّض الري أسبوعين قبل الحصاد.",
        },
        "avg_yield": "25 t/ha",
        "description_fr": "Culture maraîchère présente dans tout le nord du pays.",
        "description_ar": "محصول خضري منتشر في كامل شمال البلاد.",
    },
    {
        "slug": "pepper",
        "name_fr": "Poivron",
        "name_ar": "فلفل",
        "name_en": "Pepper",
        "planting_calendar": {"sow": ["Mar", "Apr"], "harvest": ["Jul", "Aug", "Sep"]},
        "water_needs": {
            "liters_per_m2_per_week": 30,
            "notes_fr": "Cultivé sous serre à Biskra et Adrar.",
            "notes_ar": "يزرع تحت البيوت البلاستيكية في بسكرة وأدرار.",
        },
        "avg_yield": "40 t/ha (sous serre)",
        "description_fr": "Variétés douces et piquantes très demandées au marché.",
        "description_ar": "أصناف حلوة وحارة مطلوبة جدا في السوق.",
    },
    {
        "slug": "watermelon",
        "name_fr": "Pastèque",
        "name_ar": "دلاع",
        "name_en": "Watermelon",
        "planting_calendar": {"sow": ["Mar", "Apr"], "harvest": ["Jul", "Aug"]},
        "water_needs": {
            "liters_per_m2_per_week": 35,
            "notes_fr": "Forts besoins en eau pendant la floraison.",
            "notes_ar": "احتياجات مائية كبيرة خلال الإزهار.",
        },
        "avg_yield": "35 t/ha",
        "description_fr": "Culture estivale phare dans le sud (El Oued, Biskra).",
        "description_ar": "محصول صيفي رئيسي في الجنوب (الوادي، بسكرة).",
    },
    {
        "slug": "citrus",
        "name_fr": "Agrumes",
        "name_ar": "حمضيات",
        "name_en": "Citrus",
        "planting_calendar": {
            "sow": ["Feb", "Mar"],
            "harvest": ["Nov", "Dec", "Jan", "Feb"],
        },
        "water_needs": {
            "liters_per_m2_per_week": 28,
            "notes_fr": "Sensibles au gel : protéger les jeunes plants.",
            "notes_ar": "حساسة للصقيع: احم الأشتال الصغيرة.",
        },
        "avg_yield": "25 t/ha",
        "description_fr": "Orangers et clémentiniers très présents en Mitidja et Boufarik.",
        "description_ar": "أشجار البرتقال والكلمنتين منتشرة في متيجة وبوفاريك.",
    },
]


DISEASES = [
    {
        "slug": "late-blight",
        "name_fr": "Mildiou (tardif)",
        "name_ar": "اللفحة المتأخرة",
        "name_en": "Late Blight",
        "symptoms_fr": "Taches brunes huileuses sur feuilles, duvet blanc en face inférieure, fruits qui pourrissent.",
        "symptoms_ar": "بقع بنية زيتية على الأوراق، زغب أبيض على السطح السفلي، تعفن الثمار.",
        "treatment_fr": "Fongicides à base de cuivre dès l'apparition. Détruire les plants atteints.",
        "treatment_ar": "مبيدات فطرية نحاسية عند الظهور. إتلاف النباتات المصابة.",
        "prevention_fr": "Espacer les plants, éviter l'irrigation par aspersion, rotation culturale.",
        "prevention_ar": "وسّع المسافات بين النباتات، تجنّب الرش العلوي، اعتمد دورة زراعية.",
        "severity": "high",
        "crops": ["tomato", "potato"],
    },
    {
        "slug": "powdery-mildew",
        "name_fr": "Oïdium",
        "name_ar": "البياض الدقيقي",
        "name_en": "Powdery Mildew",
        "symptoms_fr": "Poudre blanche sur les feuilles et tiges, déformation du feuillage.",
        "symptoms_ar": "مسحوق أبيض على الأوراق والسيقان، تشوّه المجموع الخضري.",
        "treatment_fr": "Soufre mouillable, bicarbonate de potassium, fongicides systémiques.",
        "treatment_ar": "كبريت قابل للبلل، بيكربونات البوتاسيوم، مبيدات جهازية.",
        "prevention_fr": "Bonne aération, éviter les excès d'azote.",
        "prevention_ar": "تهوية جيدة، تجنب الإفراط في التسميد الآزوتي.",
        "severity": "medium",
        "crops": ["tomato", "pepper", "watermelon"],
    },
    {
        "slug": "wheat-rust",
        "name_fr": "Rouille du blé",
        "name_ar": "صدأ القمح",
        "name_en": "Wheat Rust",
        "symptoms_fr": "Pustules orangées à brunes sur feuilles et tiges.",
        "symptoms_ar": "بثرات برتقالية إلى بنية على الأوراق والسيقان.",
        "treatment_fr": "Triazoles dès l'apparition des premières pustules.",
        "treatment_ar": "مبيدات الترايازول عند ظهور أولى البثرات.",
        "prevention_fr": "Variétés résistantes, éliminer les repousses.",
        "prevention_ar": "أصناف مقاومة، إزالة النباتات المتطوعة.",
        "severity": "high",
        "crops": ["wheat", "barley"],
    },
    {
        "slug": "fusarium-wilt",
        "name_fr": "Fusariose vasculaire",
        "name_ar": "ذبول الفيوزاريوم",
        "name_en": "Fusarium Wilt",
        "symptoms_fr": "Flétrissement unilatéral, jaunissement, brunissement des vaisseaux.",
        "symptoms_ar": "ذبول من جهة واحدة، اصفرار، اسمرار الأوعية.",
        "treatment_fr": "Pas de traitement curatif efficace : arracher et brûler les plants.",
        "treatment_ar": "لا يوجد علاج فعّال: اقتلع النباتات وأحرقها.",
        "prevention_fr": "Solarisation du sol, variétés résistantes, rotation longue.",
        "prevention_ar": "تشميس التربة، أصناف مقاومة، دورة زراعية طويلة.",
        "severity": "high",
        "crops": ["tomato", "watermelon"],
    },
    {
        "slug": "early-blight",
        "name_fr": "Alternariose",
        "name_ar": "اللفحة المبكرة",
        "name_en": "Early Blight",
        "symptoms_fr": "Taches brunes concentriques sur feuilles âgées, défoliation progressive.",
        "symptoms_ar": "بقع بنية بحلقات متحدة المركز على الأوراق المسنة، تساقط تدريجي.",
        "treatment_fr": "Fongicides à base de mancozèbe ou chlorothalonil.",
        "treatment_ar": "مبيدات قائمة على المانكوزيب أو الكلوروثالونيل.",
        "prevention_fr": "Paillage, arrosage au pied, rotation.",
        "prevention_ar": "تغطية التربة، الري عند الجذور، الدورة الزراعية.",
        "severity": "medium",
        "crops": ["tomato", "potato"],
    },
    {
        "slug": "citrus-canker",
        "name_fr": "Chancre des agrumes",
        "name_ar": "تقرّح الحمضيات",
        "name_en": "Citrus Canker",
        "symptoms_fr": "Lésions liégeuses brunes sur feuilles, fruits et rameaux.",
        "symptoms_ar": "تقرّحات بنية فلّينية على الأوراق والثمار والأغصان.",
        "treatment_fr": "Bouillie bordelaise, élagage des branches atteintes.",
        "treatment_ar": "محلول بوردو، تقليم الأفرع المصابة.",
        "prevention_fr": "Quarantaine des plants importés, désinfection des outils.",
        "prevention_ar": "حجر صحي للأشتال المستوردة، تعقيم الأدوات.",
        "severity": "high",
        "crops": ["citrus"],
    },
    {
        "slug": "olive-knot",
        "name_fr": "Tuberculose de l'olivier",
        "name_ar": "سل الزيتون",
        "name_en": "Olive Knot",
        "symptoms_fr": "Galles ligneuses sur les rameaux et le tronc, dépérissement.",
        "symptoms_ar": "أورام خشبية على الأغصان والساق، تدهور الشجرة.",
        "treatment_fr": "Élagage des galles, désinfection à la bouillie bordelaise.",
        "treatment_ar": "تقليم الأورام، تعقيم بمحلول بوردو.",
        "prevention_fr": "Éviter les blessures, taille par temps sec.",
        "prevention_ar": "تجنّب الجروح، التقليم في الطقس الجاف.",
        "severity": "medium",
        "crops": ["olive"],
    },
    {
        "slug": "aphid-infestation",
        "name_fr": "Pucerons",
        "name_ar": "المنّ",
        "name_en": "Aphid Infestation",
        "symptoms_fr": "Petits insectes verts/noirs sur les jeunes pousses, miellat collant, fumagine.",
        "symptoms_ar": "حشرات صغيرة خضراء/سوداء على البراعم، عسل لزج، عفن أسود.",
        "treatment_fr": "Savon noir, huile de neem, lâcher de coccinelles.",
        "treatment_ar": "صابون أسود، زيت النيم، إطلاق الدعسوقات.",
        "prevention_fr": "Surveillance précoce, plantes compagnes répulsives (capucines).",
        "prevention_ar": "متابعة مبكرة، نباتات مرافقة طاردة (الكبوسين).",
        "severity": "low",
        "crops": ["tomato", "pepper", "citrus"],
    },
    {
        "slug": "root-rot",
        "name_fr": "Pourriture racinaire",
        "name_ar": "تعفّن الجذور",
        "name_en": "Root Rot",
        "symptoms_fr": "Plants chétifs, jaunissement, racines brunes molles.",
        "symptoms_ar": "نباتات ضعيفة، اصفرار، جذور بنية طرية.",
        "treatment_fr": "Drainage, réduction des arrosages, fongicides systémiques.",
        "treatment_ar": "تحسين التصريف، تخفيف الري، مبيدات جهازية.",
        "prevention_fr": "Sols bien drainés, éviter l'excès d'eau.",
        "prevention_ar": "تربة جيدة الصرف، تجنّب الإفراط في الري.",
        "severity": "medium",
        "crops": ["onion", "pepper", "watermelon", "date-palm"],
    },
    {
        "slug": "bayoud",
        "name_fr": "Bayoud (palmier dattier)",
        "name_ar": "البيوض",
        "name_en": "Bayoud Disease",
        "symptoms_fr": "Palmes blanchâtres puis brunes en commençant par la base, mort progressive.",
        "symptoms_ar": "سعف أبيض ثم بني انطلاقا من القاعدة، موت تدريجي للنخلة.",
        "treatment_fr": "Pas de traitement curatif. Arracher et brûler les palmiers atteints.",
        "treatment_ar": "لا علاج شاف. اقتلاع النخيل المصاب وحرقه.",
        "prevention_fr": "Plantation de variétés résistantes (Takerboucht, Tamjouhert).",
        "prevention_ar": "غرس أصناف مقاومة (تاكربوشت، تامجوهرت).",
        "severity": "high",
        "crops": ["date-palm"],
    },
]


class Command(BaseCommand):
    help = "Seed 10 Algerian crops and 10 common diseases."

    @transaction.atomic
    def handle(self, *args, **options):
        crop_objs = {}
        for crop in CROPS:
            obj, created = CropFactSheet.objects.update_or_create(
                slug=crop["slug"],
                defaults={
                    "name_fr": crop["name_fr"],
                    "name_ar": crop["name_ar"],
                    "name_en": crop["name_en"],
                    "planting_calendar": crop["planting_calendar"],
                    "water_needs": crop["water_needs"],
                    "avg_yield": crop["avg_yield"],
                    "description_fr": crop["description_fr"],
                    "description_ar": crop["description_ar"],
                    "image_url": crop.get("image_url", ""),
                    "is_active": True,
                },
            )
            crop_objs[crop["slug"]] = obj
            self.stdout.write(f"  {'+' if created else '~'} crop: {obj.name_fr} ({obj.slug})")

        for disease in DISEASES:
            obj, created = Disease.objects.update_or_create(
                slug=disease["slug"],
                defaults={
                    "name_fr": disease["name_fr"],
                    "name_ar": disease["name_ar"],
                    "name_en": disease["name_en"],
                    "symptoms_fr": disease["symptoms_fr"],
                    "symptoms_ar": disease["symptoms_ar"],
                    "treatment_fr": disease["treatment_fr"],
                    "treatment_ar": disease["treatment_ar"],
                    "prevention_fr": disease["prevention_fr"],
                    "prevention_ar": disease["prevention_ar"],
                    "severity": disease["severity"],
                    "image_url": disease.get("image_url", ""),
                    "is_active": True,
                },
            )
            related = [crop_objs[s] for s in disease.get("crops", []) if s in crop_objs]
            obj.affected_crops.set(related)
            self.stdout.write(f"  {'+' if created else '~'} disease: {obj.name_fr} ({obj.slug})")

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {CropFactSheet.objects.count()} crops, "
                f"{Disease.objects.count()} diseases."
            )
        )
