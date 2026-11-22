// Three demo scenarios. Fictional patients; doses within US FDA labeling. `generic` is the OpenFDA key.
// slots: 'morning' | 'noon' | 'evening' | 'bedtime'
// withFood: 'with' | 'without' | 'before' (e.g. 30 min before breakfast) | 'any'
// water: true = "take with a full glass of water". days: course length (omit = ongoing). prn: as needed (no slots).

const t = (en, es, fr, zh) => ({ en, es, fr, zh });

export const SCENARIOS = [
  {
    id: 'cardiac',
    title: t('Senior Cardiac Discharge', 'Alta cardíaca de un adulto mayor', 'Sortie d’hôpital cardiaque (aîné)', '老年心脏病出院'),
    patient: t(
      'Walter, 78, is going home after a hospital stay for heart failure. He had swollen legs and trouble breathing. He also has type 2 diabetes and high cholesterol, and gets dizzy when he stands up fast. His daughter helps with his pills.',
      'Walter, de 78 años, vuelve a casa tras una hospitalización por insuficiencia cardíaca. Tenía las piernas hinchadas y le costaba respirar. También tiene diabetes tipo 2 y colesterol alto, y se marea si se levanta rápido. Su hija le ayuda con las pastillas.',
      'Walter, 78 ans, rentre chez lui après une hospitalisation pour insuffisance cardiaque. Il avait les jambes enflées et du mal à respirer. Il a aussi un diabète de type 2 et du cholestérol, et il a des vertiges s’il se lève vite. Sa fille l’aide avec ses médicaments.',
      '沃尔特，78岁，因心力衰竭住院后出院回家。他之前腿部水肿、呼吸困难。他还有2型糖尿病和高胆固醇，站起来太快会头晕。他的女儿帮他管理药物。'),
    raw: [
      'DISCHARGE DX: CHF exacerbation w/ BLE edema and dyspnea, HTN, T2DM, hyperlipidemia',
      'Hx: orthostatic hypotension - rise slowly. Allergies: NKDA',
      'Furosemide 40 mg PO QD in the morning',
      'Lisinopril 10 mg PO QD. Hold if SBP < 100',
      'Metformin 500 mg PO BID with meals',
      'Atorvastatin 20 mg PO QHS',
      'Daily weights. Call MD PRN wt gain > 2 lb/day or 5 lb/wk, worsening dyspnea or edema',
    ].join('\n'),
    meds: [
      { id: 'furosemide', name: 'Furosemide', generic: 'furosemide', dose: '40 mg', slots: ['morning'], withFood: 'any', water: false,
        purpose: t('Water pill: removes extra fluid', 'Diurético: saca el líquido de más', 'Diurétique : élimine l’excès de liquide', '利尿药：排出多余水分'),
        plain: t(
          'Take 1 pill (40 mg) by mouth every morning. It makes you pee a lot, so do not take it at night. Weigh yourself every morning. Call your doctor if you gain more than 2 pounds in a day or 5 pounds in a week.',
          'Tome 1 pastilla (40 mg) por la boca cada mañana. Le hará orinar mucho, así que no la tome de noche. Pésese cada mañana. Llame al médico si sube más de 1 kg en un día o más de 2 kg en una semana.',
          'Prenez 1 comprimé (40 mg) par la bouche chaque matin. Il fait beaucoup uriner : ne le prenez pas le soir. Pesez-vous chaque matin. Appelez le médecin si vous prenez plus de 1 kg en un jour ou plus de 2 kg en une semaine.',
          '每天早上口服1片（40毫克）。它会让你经常排尿，所以不要晚上吃。每天早上称体重。如果一天内增重超过1公斤或一周内超过2公斤，请联系医生。') },
      { id: 'lisinopril', name: 'Lisinopril', generic: 'lisinopril', dose: '10 mg', slots: ['morning'], withFood: 'any', water: false,
        purpose: t('Lowers blood pressure and helps the heart', 'Baja la presión y ayuda al corazón', 'Baisse la tension et aide le cœur', '降血压，帮助心脏'),
        plain: t(
          'Check your blood pressure first. If the top number is under 100, skip this pill and call your doctor. Otherwise take 1 pill (10 mg) by mouth every morning. Stand up slowly. Get help right away if your face, lips or tongue swell.',
          'Primero mida su presión. Si el número de arriba es menor de 100, no tome esta pastilla y llame al médico. Si no, tome 1 pastilla (10 mg) por la boca cada mañana. Levántese despacio. Busque ayuda de inmediato si se le hincha la cara, los labios o la lengua.',
          'Prenez d’abord votre tension. Si le chiffre du haut est sous 100, sautez ce comprimé et appelez le médecin. Sinon, prenez 1 comprimé (10 mg) par la bouche chaque matin. Levez-vous lentement. Obtenez de l’aide tout de suite si le visage, les lèvres ou la langue enflent.',
          '先量血压。如果高压（上面的数字）低于100，就不要吃这片药，并联系医生。否则每天早上口服1片（10毫克）。起身要慢。如果脸、嘴唇或舌头肿胀，请立即求助。') },
      { id: 'metformin', name: 'Metformin', generic: 'metformin', dose: '500 mg', slots: ['morning', 'evening'], withFood: 'with', water: false,
        purpose: t('Lowers blood sugar', 'Baja el azúcar en la sangre', 'Baisse le sucre dans le sang', '降血糖'),
        plain: t(
          'Take 1 pill (500 mg) by mouth 2 times a day, with breakfast and with dinner. Eating with it helps prevent an upset stomach.',
          'Tome 1 pastilla (500 mg) por la boca 2 veces al día, con el desayuno y con la cena. Comer al tomarla ayuda a evitar malestar de estómago.',
          'Prenez 1 comprimé (500 mg) par la bouche 2 fois par jour, au petit-déjeuner et au souper. Manger en le prenant évite les maux d’estomac.',
          '每天2次，每次口服1片（500毫克），随早餐和晚餐服用。随餐服用可减少胃部不适。') },
      { id: 'atorvastatin', name: 'Atorvastatin', generic: 'atorvastatin', dose: '20 mg', slots: ['bedtime'], withFood: 'any', water: false,
        purpose: t('Lowers cholesterol', 'Baja el colesterol', 'Baisse le cholestérol', '降胆固醇'),
        plain: t(
          'Take 1 pill (20 mg) by mouth at bedtime. Tell your doctor about muscle pain or weakness you cannot explain.',
          'Tome 1 pastilla (20 mg) por la boca a la hora de dormir. Avise al médico si tiene dolor o debilidad muscular sin motivo.',
          'Prenez 1 comprimé (20 mg) par la bouche au coucher. Signalez au médecin toute douleur ou faiblesse musculaire inexpliquée.',
          '睡前口服1片（20毫克）。如有不明原因的肌肉疼痛或无力，请告诉医生。') },
    ],
  },
  {
    id: 'pediatric',
    title: t('Pediatric Ear Infection + Allergy', 'Infección de oído infantil + alergia', 'Otite chez l’enfant + allergie', '儿童中耳炎 + 过敏'),
    patient: t(
      'Leo, 4, weighs 16 kg (35 lb). He has an ear infection and seasonal allergies (runny nose, itchy eyes). He is allergic to sulfa drugs. His grandmother gives his medicine.',
      'Leo, de 4 años, pesa 16 kg. Tiene una infección de oído y alergia de temporada (nariz que gotea, ojos que pican). Es alérgico a las sulfas. Su abuela le da la medicina.',
      'Léo, 4 ans, pèse 16 kg. Il a une otite et des allergies saisonnières (nez qui coule, yeux qui piquent). Il est allergique aux sulfamides. Sa grand-mère lui donne ses médicaments.',
      '小李奥，4岁，体重16公斤。他患了中耳炎，还有季节性过敏（流鼻涕、眼睛痒）。他对磺胺类药物过敏。由奶奶给他喂药。'),
    raw: [
      'DX: Acute otitis media (L), allergic rhinitis. Wt 16 kg',
      'Allergies: sulfa (rash). PCN tolerated',
      'Amoxicillin 250 mg/5 mL susp: 250 mg (5 mL) PO TID x10d',
      'Ibuprofen 100 mg/5 mL susp: 100 mg (5 mL) PO q6h PRN fever, give with food. Max 4 doses/24h',
      'Cetirizine 5 mg/5 mL syrup: 5 mg (5 mL) PO QHS',
    ].join('\n'),
    meds: [
      { id: 'amoxicillin', name: 'Amoxicillin liquid', generic: 'amoxicillin', dose: '250 mg (5 mL)', slots: ['morning', 'noon', 'bedtime'], withFood: 'any', water: false, days: 10,
        purpose: t('Antibiotic for the ear infection', 'Antibiótico para la infección de oído', 'Antibiotique contre l’otite', '治疗中耳炎的抗生素'),
        plain: t(
          'Shake well. Give 5 mL by mouth 3 times a day: morning, midday and bedtime. Use the dosing syringe, not a kitchen spoon. Give it for all 10 days, even if he feels better. Keep it in the fridge.',
          'Agite bien. Dé 5 mL por la boca 3 veces al día: mañana, mediodía y al dormir. Use la jeringa dosificadora, no una cuchara de cocina. Déselo los 10 días completos, aunque se sienta mejor. Guárdelo en el refrigerador.',
          'Bien agiter. Donnez 5 mL par la bouche 3 fois par jour : matin, midi et coucher. Utilisez la seringue doseuse, pas une cuillère de cuisine. Donnez-le pendant les 10 jours, même s’il va mieux. Gardez-le au réfrigérateur.',
          '使用前摇匀。每天口服3次，每次5毫升：早上、中午和睡前。请用量药注射器，不要用厨房汤匙。即使好转也要吃满10天。放在冰箱里保存。') },
      { id: 'ibuprofen', name: 'Ibuprofen liquid (children’s)', generic: 'ibuprofen', dose: '100 mg (5 mL)', slots: [], prn: true, withFood: 'with', water: false,
        purpose: t('For fever or ear pain', 'Para la fiebre o el dolor de oído', 'Contre la fièvre ou la douleur d’oreille', '退烧或缓解耳痛'),
        plain: t(
          'Only if he has a fever: give 5 mL by mouth with a little food. Wait at least 6 hours between doses. No more than 4 doses in 24 hours.',
          'Solo si tiene fiebre: dé 5 mL por la boca con un poco de comida. Espere al menos 6 horas entre dosis. No más de 4 dosis en 24 horas.',
          'Seulement s’il a de la fièvre : donnez 5 mL par la bouche avec un peu de nourriture. Attendez au moins 6 heures entre les doses. Pas plus de 4 doses en 24 heures.',
          '仅在发烧时使用：随少量食物口服5毫升。两次之间至少间隔6小时。24小时内不超过4次。') },
      { id: 'cetirizine', name: 'Cetirizine syrup', generic: 'cetirizine', dose: '5 mg (5 mL)', slots: ['bedtime'], withFood: 'any', water: false,
        purpose: t('Allergy medicine: runny nose, itchy eyes', 'Medicina para la alergia: nariz que gotea, ojos que pican', 'Contre l’allergie : nez qui coule, yeux qui piquent', '抗过敏药：缓解流鼻涕、眼睛痒'),
        plain: t(
          'Give 5 mL by mouth once a day at bedtime. It can make him sleepy.',
          'Dé 5 mL por la boca una vez al día a la hora de dormir. Puede darle sueño.',
          'Donnez 5 mL par la bouche une fois par jour au coucher. Il peut causer de la somnolence.',
          '每天睡前口服1次，每次5毫升。可能会让孩子犯困。') },
    ],
  },
  {
    id: 'diabetes-warfarin',
    title: t('Diabetes + Blood Thinner', 'Diabetes + anticoagulante', 'Diabète + anticoagulant', '糖尿病 + 抗凝药'),
    patient: t(
      'Rosa, 67, has type 2 diabetes and an uneven heartbeat (atrial fibrillation), so she takes a blood thinner. She also takes low-dose aspirin and a stomach-acid pill.',
      'Rosa, de 67 años, tiene diabetes tipo 2 y latido irregular (fibrilación auricular), por eso toma un anticoagulante. También toma aspirina en dosis baja y una pastilla para el ácido del estómago.',
      'Rosa, 67 ans, a un diabète de type 2 et un cœur qui bat de façon irrégulière (fibrillation auriculaire) : elle prend donc un anticoagulant. Elle prend aussi de l’aspirine à faible dose et un comprimé contre l’acidité.',
      '罗莎，67岁，患有2型糖尿病和房颤，因此在服用抗凝药。她还服用低剂量阿司匹林和一种抑制胃酸的药。'),
    raw: [
      'DX: T2DM, atrial fibrillation, GERD',
      'Warfarin 5 mg PO QD in the evening. INR goal 2-3; recheck INR in 1 wk. Keep vitamin K intake consistent',
      'Aspirin 81 mg PO QD with food',
      'Metformin 1000 mg PO BID with meals',
      'Omeprazole 20 mg PO QD AC breakfast (30 min before)',
    ].join('\n'),
    meds: [
      { id: 'warfarin', name: 'Warfarin', generic: 'warfarin', dose: '5 mg', slots: ['evening'], withFood: 'any', water: false,
        purpose: t('Blood thinner: prevents clots and stroke', 'Anticoagulante: previene coágulos y derrames', 'Anticoagulant : prévient les caillots et l’AVC', '抗凝药：预防血栓和中风'),
        plain: t(
          'Take 1 pill (5 mg) by mouth every evening at the same time. Get your INR blood test in 1 week. Keep the amount of green leafy vegetables (vitamin K) you eat about the same each week. Do not start or stop any medicine, vitamin or herbal product without asking.',
          'Tome 1 pastilla (5 mg) por la boca cada tarde-noche a la misma hora. Hágase el análisis INR en 1 semana. Coma más o menos la misma cantidad de verduras de hoja verde (vitamina K) cada semana. No empiece ni deje ninguna medicina, vitamina o hierba sin preguntar.',
          'Prenez 1 comprimé (5 mg) par la bouche chaque soir à la même heure. Faites votre prise de sang INR dans 1 semaine. Gardez à peu près la même quantité de légumes verts feuillus (vitamine K) chaque semaine. Ne commencez ni n’arrêtez aucun médicament, vitamine ou produit naturel sans demander.',
          '每天晚上同一时间口服1片（5毫克）。1周后做INR血液检测。每周吃的绿叶蔬菜（维生素K）量要保持大致相同。未经询问，不要开始或停用任何药物、维生素或草药。') },
      { id: 'aspirin', name: 'Aspirin (low dose)', generic: 'aspirin', dose: '81 mg', slots: ['morning'], withFood: 'with', water: false,
        purpose: t('Helps prevent heart attack and stroke', 'Ayuda a prevenir infartos y derrames', 'Aide à prévenir l’infarctus et l’AVC', '帮助预防心脏病发作和中风'),
        plain: t(
          'Take 1 small pill (81 mg) by mouth every morning with breakfast. Together with warfarin it raises bleeding risk, so only take it because your doctor said to.',
          'Tome 1 pastilla pequeña (81 mg) por la boca cada mañana con el desayuno. Junto con la warfarina aumenta el riesgo de sangrado; tómela solo porque su médico lo indicó.',
          'Prenez 1 petit comprimé (81 mg) par la bouche chaque matin au petit-déjeuner. Avec la warfarine, il augmente le risque de saignement : prenez-le seulement parce que votre médecin l’a demandé.',
          '每天早上随早餐口服1小片（81毫克）。与华法林一起用会增加出血风险，所以只能在医生要求下服用。') },
      { id: 'metformin', name: 'Metformin', generic: 'metformin', dose: '1000 mg', slots: ['morning', 'evening'], withFood: 'with', water: false,
        purpose: t('Lowers blood sugar', 'Baja el azúcar en la sangre', 'Baisse le sucre dans le sang', '降血糖'),
        plain: t(
          'Take 1000 mg by mouth 2 times a day, with breakfast and with dinner. Eating with it helps prevent an upset stomach.',
          'Tome 1000 mg por la boca 2 veces al día, con el desayuno y con la cena. Comer al tomarla ayuda a evitar malestar de estómago.',
          'Prenez 1000 mg par la bouche 2 fois par jour, au petit-déjeuner et au souper. Manger en le prenant évite les maux d’estomac.',
          '每天2次，每次口服1000毫克，随早餐和晚餐服用。随餐服用可减少胃部不适。') },
      { id: 'omeprazole', name: 'Omeprazole', generic: 'omeprazole', dose: '20 mg', slots: ['morning'], withFood: 'before', water: false,
        purpose: t('Lowers stomach acid; protects the stomach', 'Baja el ácido del estómago y lo protege', 'Réduit l’acidité et protège l’estomac', '减少胃酸，保护胃'),
        plain: t(
          'Take 1 capsule (20 mg) by mouth every morning, 30 minutes before breakfast. Swallow it whole.',
          'Tome 1 cápsula (20 mg) por la boca cada mañana, 30 minutos antes del desayuno. Tráguela entera.',
          'Prenez 1 gélule (20 mg) par la bouche chaque matin, 30 minutes avant le petit-déjeuner. Avalez-la entière.',
          '每天早上早餐前30分钟口服1粒胶囊（20毫克）。整粒吞服。') },
    ],
  },
];
