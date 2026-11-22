// Small local helpers for the safety check. Real label text lives in labels-snapshot.json.

// Words that mean "this drug" inside another drug's label text (generic + class words).
// Lowercase; matched as substrings, so 'anticoagula' hits anticoagulant/anticoagulation.
export const DRUG_KEYWORDS = {
  warfarin: ['warfarin', 'anticoagula', 'blood thinning', 'blood thinner', 'coumarin'],
  aspirin: ['aspirin', 'salicylate', 'antiplatelet'],
  ibuprofen: ['ibuprofen', 'nsaid', 'nonsteroidal anti-inflammatory'],
  acetaminophen: ['acetaminophen'],
  lisinopril: ['lisinopril', 'ace inhibitor', 'angiotensin converting'],
  furosemide: ['furosemide', 'loop diuretic', 'diuretic'],
  metoprolol: ['metoprolol', 'beta-blocker', 'beta blocker', 'beta-adrenergic block'],
  atorvastatin: ['atorvastatin', 'statin', 'hmg-coa reductase'],
  metformin: ['metformin'],
  azithromycin: ['azithromycin', 'macrolide'],
  amoxicillin: ['amoxicillin', 'penicillin'],
  cephalexin: ['cephalexin', 'cephalosporin'],
  cetirizine: ['cetirizine', 'antihistamine'],
  omeprazole: ['omeprazole', 'proton pump inhibitor'],
};

export const keywordsFor = (generic) => DRUG_KEYWORDS[generic.toLowerCase()] ?? [generic.toLowerCase()];

// Curated rules: severity + plain-language explanation for pairs we know matter (key = sorted generics joined by '+').
const t = (en, es, fr, zh) => ({ en, es, fr, zh });
export const INTERACTION_RULES = {
  'ibuprofen+warfarin': { severity: 'High', plain: t(
    'Ibuprofen plus warfarin raises the risk of serious bleeding, like stomach bleeding. Ask your doctor or pharmacist before taking ibuprofen. Acetaminophen is often a safer pain choice — ask first.',
    'Ibuprofeno más warfarina aumenta el riesgo de sangrado grave, como sangrado en el estómago. Pregunte a su médico o farmacéutico antes de tomar ibuprofeno. El acetaminofén suele ser una opción más segura; pregunte primero.',
    'Ibuprofène plus warfarine augmente le risque de saignement grave, comme un saignement de l’estomac. Demandez à votre médecin ou pharmacien avant d’en prendre. L’acétaminophène est souvent un choix plus sûr — demandez d’abord.',
    '布洛芬和华法林一起用会增加严重出血（如胃出血）的风险。服用布洛芬前请先问医生或药剂师。对乙酰氨基酚通常是更安全的止痛选择——请先询问。') },
  'aspirin+warfarin': { severity: 'High', plain: t(
    'Aspirin plus warfarin raises the risk of bleeding. Only take both if your doctor told you to.',
    'Aspirina más warfarina aumenta el riesgo de sangrado. Tome ambas solo si su médico se lo indicó.',
    'Aspirine plus warfarine augmente le risque de saignement. Ne prenez les deux que si votre médecin l’a demandé.',
    '阿司匹林和华法林一起用会增加出血风险。只有医生要求时才同时服用。') },
  'aspirin+ibuprofen': { severity: 'Moderate', plain: t(
    'Ibuprofen can make heart-protecting aspirin work less well and adds stomach-bleeding risk. Ask your pharmacist how to time them.',
    'El ibuprofeno puede hacer que la aspirina que protege el corazón funcione peor y aumenta el riesgo de sangrado de estómago. Pregunte al farmacéutico cómo tomarlas.',
    'L’ibuprofène peut rendre l’aspirine protectrice du cœur moins efficace et augmente le risque de saignement de l’estomac. Demandez au pharmacien comment les espacer.',
    '布洛芬会让保护心脏的阿司匹林效果变差，并增加胃出血风险。请问药剂师如何错开服用时间。') },
  'furosemide+lisinopril': { severity: 'Moderate', plain: t(
    'These are often prescribed together on purpose. Together they can lower blood pressure a lot — stand up slowly and tell your doctor if you feel faint. Do not stop either one on your own.',
    'A menudo se recetan juntas a propósito. Juntas pueden bajar mucho la presión: levántese despacio y avise al médico si se siente débil. No deje ninguna por su cuenta.',
    'Ils sont souvent prescrits ensemble exprès. Ensemble, ils peuvent beaucoup baisser la tension : levez-vous lentement et prévenez le médecin si vous vous sentez faible. N’arrêtez aucun des deux vous-même.',
    '这两种药常被有意一起开。一起用可能让血压降得较多——请慢慢站起来，如感觉要晕倒请告诉医生。不要自行停用任何一种。') },
  'aspirin+furosemide': { severity: 'Low', plain: t(
    'Low-dose aspirin (81 mg) is usually fine with furosemide; the label warning is about high aspirin doses. Do not stop either one on your own.',
    'La aspirina en dosis baja (81 mg) suele estar bien con furosemida; la advertencia es para dosis altas. No deje ninguna por su cuenta.',
    'L’aspirine à faible dose (81 mg) va généralement avec le furosémide ; l’avertissement concerne les fortes doses. N’arrêtez aucun des deux vous-même.',
    '低剂量阿司匹林（81毫克）通常可以和呋塞米一起用；说明书的警告针对大剂量阿司匹林。不要自行停用任何一种。') },
  'acetaminophen+warfarin': { severity: 'Moderate', plain: t(
    'Using acetaminophen regularly for several days can make warfarin stronger. Tell your doctor if you use it often.',
    'Usar acetaminofén varios días seguidos puede hacer más fuerte la warfarina. Avise al médico si lo usa seguido.',
    'Prendre de l’acétaminophène plusieurs jours de suite peut renforcer la warfarine. Dites-le au médecin si vous en prenez souvent.',
    '连续几天常规服用对乙酰氨基酚可能增强华法林的作用。如果经常使用，请告诉医生。') },
  'ibuprofen+lisinopril': { severity: 'Moderate', plain: t(
    'Ibuprofen can make lisinopril work less well and can strain the kidneys, especially in older adults or with water pills. Ask before using ibuprofen.',
    'El ibuprofeno puede hacer que el lisinopril funcione peor y puede dañar los riñones, sobre todo en personas mayores o con diuréticos. Pregunte antes de usar ibuprofeno.',
    'L’ibuprofène peut rendre le lisinopril moins efficace et fatiguer les reins, surtout chez les aînés ou avec un diurétique. Demandez avant d’en prendre.',
    '布洛芬会让赖诺普利效果变差，还可能伤肾，老年人或同时服用利尿药时更要注意。使用布洛芬前请先询问。') },
  'furosemide+metformin': { severity: 'Low', plain: t(
    'Furosemide can raise the amount of metformin in the blood a little. Usually fine — your doctor will check your blood sugar and kidney tests.',
    'La furosemida puede subir un poco la cantidad de metformina en la sangre. Suele estar bien: su médico revisará el azúcar y los riñones.',
    'Le furosémide peut augmenter un peu la quantité de metformine dans le sang. C’est généralement sans danger : le médecin surveillera la glycémie et les reins.',
    '呋塞米可能会使血液中的二甲双胍略微增加。通常没问题——医生会检查您的血糖和肾功能。') },
};
