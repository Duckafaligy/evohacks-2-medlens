// "Call your doctor right away if…" per drug (key = generic). For life-threatening signs
// (trouble breathing, face/throat swelling) the UI should say call 911.
const t = (en, es, fr, zh) => ({ en, es, fr, zh });

export const REDFLAG_HEADING = t(
  'Call your doctor right away if…',
  'Llame a su médico de inmediato si…',
  'Appelez votre médecin tout de suite si…',
  '出现以下情况请立即联系医生：');

export const EMERGENCY_NOTE = t(
  'Trouble breathing or swelling of the face or throat: call 911.',
  'Si le cuesta respirar o se le hincha la cara o la garganta: llame al 911.',
  'Difficulté à respirer ou enflure du visage ou de la gorge : composez le 911.',
  '如果呼吸困难或脸部、喉咙肿胀：请拨打911。');

export const REDFLAGS = {
  warfarin: t(
    'You see black or bloody stools, pink or brown urine, you vomit blood, you have a very bad headache, or a cut will not stop bleeding.',
    'Tiene heces negras o con sangre, orina rosada o café, vomita sangre, tiene un dolor de cabeza muy fuerte o una herida no deja de sangrar.',
    'Vos selles sont noires ou sanglantes, votre urine est rose ou brune, vous vomissez du sang, vous avez un très fort mal de tête ou une coupure ne cesse pas de saigner.',
    '大便发黑或带血、尿液呈粉色或棕色、呕血、剧烈头痛，或伤口流血不止。'),
  aspirin: t(
    'You see black or bloody stools, vomit blood or something that looks like coffee grounds, or your ears ring.',
    'Tiene heces negras o con sangre, vomita sangre o algo como café molido, o le zumban los oídos.',
    'Vos selles sont noires ou sanglantes, vous vomissez du sang ou quelque chose qui ressemble à du marc de café, ou vos oreilles bourdonnent.',
    '大便发黑或带血、呕吐物带血或像咖啡渣，或耳鸣。'),
  lisinopril: t(
    'Your face, lips, tongue or throat swell, you feel faint, or you have very little urine.',
    'Se le hincha la cara, los labios, la lengua o la garganta, siente que se va a desmayar u orina muy poco.',
    'Votre visage, vos lèvres, votre langue ou votre gorge enflent, vous vous sentez près de vous évanouir ou vous urinez très peu.',
    '脸、嘴唇、舌头或喉咙肿胀，感觉要晕倒，或尿量很少。'),
  furosemide: t(
    'You feel very dizzy or faint, very thirsty, have muscle cramps or weakness, a fast or uneven heartbeat, or ringing in your ears.',
    'Se siente muy mareado o a punto de desmayarse, tiene mucha sed, calambres o debilidad, latidos rápidos o irregulares, o zumbido en los oídos.',
    'Vous avez de forts vertiges ou un malaise, très soif, des crampes ou une faiblesse, un cœur rapide ou irrégulier, ou des bourdonnements d’oreille.',
    '非常头晕或要晕倒、非常口渴、肌肉抽筋或无力、心跳快或不规律，或耳鸣。'),
  metformin: t(
    'You feel very weak or tired, have unusual muscle pain, trouble breathing, stomach pain with vomiting, or feel very cold or dizzy.',
    'Se siente muy débil o cansado, tiene dolor muscular raro, le cuesta respirar, dolor de estómago con vómitos, o mucho frío o mareo.',
    'Vous êtes très faible ou fatigué, avez des douleurs musculaires inhabituelles, du mal à respirer, mal au ventre avec vomissements, ou très froid ou des vertiges.',
    '感觉非常虚弱或疲倦、异常肌肉疼痛、呼吸困难、腹痛伴呕吐，或感觉很冷、头晕。'),
  atorvastatin: t(
    'You have muscle pain, tenderness or weakness you cannot explain (especially with fever or dark urine), or yellow skin or eyes.',
    'Tiene dolor, sensibilidad o debilidad muscular sin motivo (sobre todo con fiebre u orina oscura), o piel u ojos amarillos.',
    'Vous avez des douleurs, une sensibilité ou une faiblesse musculaire inexpliquées (surtout avec fièvre ou urine foncée), ou la peau ou les yeux jaunes.',
    '出现不明原因的肌肉疼痛、压痛或无力（尤其伴有发烧或尿色深），或皮肤、眼睛发黄。'),
  amoxicillin: t(
    'Your child gets a rash, hives, swelling, or bad or bloody diarrhea, or the fever is not better after 2 to 3 days.',
    'Su hijo tiene sarpullido, ronchas, hinchazón o diarrea fuerte o con sangre, o la fiebre no mejora después de 2 o 3 días.',
    'Votre enfant a une éruption, de l’urticaire, une enflure ou une diarrhée forte ou avec du sang, ou la fièvre ne baisse pas après 2 ou 3 jours.',
    '孩子出现皮疹、荨麻疹、肿胀、严重或带血的腹泻，或2到3天后仍然发烧。'),
  ibuprofen: t(
    'You see black or bloody stools, vomit blood, have bad stomach pain, or pee much less than usual.',
    'Tiene heces negras o con sangre, vomita sangre, tiene dolor fuerte de estómago u orina mucho menos de lo normal.',
    'Les selles sont noires ou sanglantes, il y a des vomissements de sang, de fortes douleurs au ventre ou beaucoup moins d’urine que d’habitude.',
    '大便发黑或带血、呕血、严重胃痛，或尿量比平时少很多。'),
  cetirizine: t(
    'Your child is very hard to wake up, acts confused, or has trouble peeing.',
    'Su hijo está muy difícil de despertar, actúa confundido o le cuesta orinar.',
    'Votre enfant est très difficile à réveiller, semble confus ou a du mal à uriner.',
    '孩子很难叫醒、表现糊涂，或排尿困难。'),
  omeprazole: t(
    'You have watery diarrhea that will not stop, bad stomach pain, or black stools.',
    'Tiene diarrea líquida que no para, dolor fuerte de estómago o heces negras.',
    'Vous avez une diarrhée liquide qui ne s’arrête pas, de fortes douleurs au ventre ou des selles noires.',
    '水样腹泻不止、严重胃痛或大便发黑。'),
};
