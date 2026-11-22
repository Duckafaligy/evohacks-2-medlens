import { UI } from './i18n-ui.js';

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'zh', label: '中文' },
];

export const STRINGS = {
  en: {
    beforeFood: 'Before eating', high: 'High', moderate: 'Moderate', low: 'Low (monitor)', crossChecked: '{n} medications cross-checked', redFlags: 'Call your doctor right away if…', readingGrade: 'Reading level: grade {n}', share: 'Share plan', scan: 'Scan with camera', upload: 'Upload a photo',
    appTitle: 'MedLens',
    tagline: 'Prescriptions in plain words',
    readAloud: 'Read aloud', stopReading: 'Stop', largeText: 'Large text', language: 'Language',
    printCard: 'Print fridge card', addToCalendar: 'Add to calendar',
    pastePrescription: 'Paste your prescription', pastePlaceholder: 'Example: Metoprolol 25 mg PO BID',
    translate: 'Translate', tryDemo: 'Try a demo',
    morning: 'Morning', noon: 'Noon', evening: 'Evening', bedtime: 'Bedtime', asNeeded: 'Only when needed',
    withFood: 'With food', emptyStomach: 'Empty stomach', fullGlassWater: 'Full glass of water',
    safetyCheck: 'Safety check', possibleInteraction: 'Possible interaction', noInteractions: 'No interactions found in the labels we checked.',
    boxedWarning: 'Serious warning', warnings: 'Warnings', sideEffects: 'Side effects',
    sourceFda: 'Source: FDA label', sourceOffline: 'Offline data',
    days: 'days',
    disclaimer: 'Not medical advice. Always check with your pharmacist or doctor.',
  },
  es: {
    beforeFood: 'Antes de comer', high: 'Alta', moderate: 'Moderada', low: 'Baja (vigilar)', crossChecked: '{n} medicamentos revisados entre sí', redFlags: 'Llame a su médico de inmediato si…', readingGrade: 'Nivel de lectura: grado {n}', share: 'Compartir plan', scan: 'Escanear con la cámara', upload: 'Subir una foto',
    appTitle: 'MedLens',
    tagline: 'Recetas en palabras sencillas',
    readAloud: 'Leer en voz alta', stopReading: 'Detener', largeText: 'Letra grande', language: 'Idioma',
    printCard: 'Imprimir tarjeta para el refrigerador', addToCalendar: 'Agregar al calendario',
    pastePrescription: 'Pegue su receta', pastePlaceholder: 'Ejemplo: Metoprolol 25 mg PO BID',
    translate: 'Traducir', tryDemo: 'Probar un ejemplo',
    morning: 'Mañana', noon: 'Mediodía', evening: 'Tarde-noche', bedtime: 'Al dormir', asNeeded: 'Solo cuando sea necesario',
    withFood: 'Con comida', emptyStomach: 'Estómago vacío', fullGlassWater: 'Vaso lleno de agua',
    safetyCheck: 'Revisión de seguridad', possibleInteraction: 'Posible interacción', noInteractions: 'No se encontraron interacciones en las etiquetas revisadas.',
    boxedWarning: 'Advertencia grave', warnings: 'Advertencias', sideEffects: 'Efectos secundarios',
    sourceFda: 'Fuente: etiqueta de la FDA', sourceOffline: 'Datos sin conexión',
    days: 'días',
    disclaimer: 'No es consejo médico. Consulte siempre con su farmacéutico o médico.',
  },
  fr: {
    beforeFood: 'Avant de manger', high: 'Élevée', moderate: 'Modérée', low: 'Faible (surveiller)', crossChecked: '{n} médicaments vérifiés ensemble', redFlags: 'Appelez votre médecin tout de suite si…', readingGrade: 'Niveau de lecture : {n}e année', share: 'Partager le plan', scan: 'Scanner avec la caméra', upload: 'Téléverser une photo',
    appTitle: 'MedLens',
    tagline: 'Vos ordonnances en mots simples',
    readAloud: 'Lire à voix haute', stopReading: 'Arrêter', largeText: 'Grand texte', language: 'Langue',
    printCard: 'Imprimer la fiche frigo', addToCalendar: 'Ajouter au calendrier',
    pastePrescription: 'Collez votre ordonnance', pastePlaceholder: 'Exemple : Metoprolol 25 mg PO BID',
    translate: 'Traduire', tryDemo: 'Essayer un exemple',
    morning: 'Matin', noon: 'Midi', evening: 'Soir', bedtime: 'Coucher', asNeeded: 'Seulement si besoin',
    withFood: 'Avec nourriture', emptyStomach: 'À jeun', fullGlassWater: 'Grand verre d’eau',
    safetyCheck: 'Vérification de sécurité', possibleInteraction: 'Interaction possible', noInteractions: 'Aucune interaction trouvée dans les notices vérifiées.',
    boxedWarning: 'Mise en garde grave', warnings: 'Mises en garde', sideEffects: 'Effets secondaires',
    sourceFda: 'Source : notice de la FDA', sourceOffline: 'Données hors ligne',
    days: 'jours',
    disclaimer: 'Ceci n’est pas un avis médical. Vérifiez toujours avec votre pharmacien ou votre médecin.',
  },
  zh: {
    beforeFood: '饭前服用', high: '高', moderate: '中', low: '低（需观察）', crossChecked: '已交叉检查{n}种药物', redFlags: '出现以下情况请立即联系医生：', readingGrade: '阅读难度：{n}年级', share: '分享方案', scan: '用相机扫描', upload: '上传照片',
    appTitle: 'MedLens',
    tagline: '用简单的话读懂处方',
    readAloud: '朗读', stopReading: '停止', largeText: '大字体', language: '语言',
    printCard: '打印冰箱贴卡片', addToCalendar: '添加到日历',
    pastePrescription: '粘贴您的处方', pastePlaceholder: '例如：Metoprolol 25 mg PO BID',
    translate: '翻译', tryDemo: '试用示例',
    morning: '早上', noon: '中午', evening: '晚上', bedtime: '睡前', asNeeded: '需要时才用',
    withFood: '随餐服用', emptyStomach: '空腹服用', fullGlassWater: '喝一整杯水',
    safetyCheck: '安全检查', possibleInteraction: '可能的药物相互作用', noInteractions: '在检查的说明书中未发现相互作用。',
    boxedWarning: '严重警告', warnings: '警告', sideEffects: '副作用',
    sourceFda: '来源：FDA药品说明书', sourceOffline: '离线数据',
    days: '天',
    disclaimer: '本内容不是医疗建议。请务必咨询您的药剂师或医生。',
  },
};

/** t('es', 'readAloud') -> 'Leer en voz alta'; t('en', 'crossChecked', {n: 4}). Falls back to English, then the key. */
export const t = (lang, key, vars = {}) =>
  String(STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');


LANGS.forEach(({ code }, i) => {
  for (const [k, v] of Object.entries(UI)) STRINGS[code][k] = v[i];
});
