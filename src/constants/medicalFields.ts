/**
 * Liste officielle des métiers de santé disponibles sur la plateforme
 * + leurs spécialités associées
 *
 * Règles :
 * - 1 métier par professionnel
 * - plusieurs spécialités possibles
 * - uniquement des métiers compatibles avec la prise de rendez-vous
 */

export const MEDICAL_FIELDS = {
  Medecin: [
    "Médecin de famille",
    "Médecin généraliste",
    "Cardiologue",
    "Dermatologue",
    "Endocrinologue",
    "Gastro-entérologue",
    "Gériatre",
    "Hématologue",
    "Infectiologue",
    "Interniste",
    "Néphrologue",
    "Neurologue",
    "Oncologue",
    "Pneumologue",
    "Rhumatologue",
    "Allergologue / Immunologue",
    "Médecin du travail",
    "Médecin du sport",
  ],

  Chirurgien: [
    "Chirurgie générale",
    "Chirurgie orthopédique",
    "Neurochirurgie",
    "Chirurgie plastique",
    "Chirurgie cardiaque",
    "Chirurgie vasculaire",
    "Chirurgie pédiatrique",
    "Chirurgie maxillo-faciale",
  ],

  Dentiste: [
    "Dentisterie générale",
    "Orthodontie",
    "Parodontie",
    "Prosthodontie",
    "Chirurgie buccale",
  ],

  Infirmier: [
    "Infirmier(ère) clinicien(ne)",
    "Infirmier(ère) praticien(ne) spécialisé(e) (IPS)",
    "Infirmier(ère) en santé mentale",
    "Infirmier(ère) en gériatrie",
    "Infirmier(ère) scolaire",
    "Soins à domicile",
  ],

  Psychologue: [
    "Psychologie clinique",
    "Neuropsychologie",
    "Psychologie scolaire",
    "Psychologie du travail",
  ],

  Psychiatre: [
    "Psychiatrie adulte",
    "Psychiatrie enfant et adolescent",
    "Psychiatrie gériatrique",
  ],

  Psychotherapeute: [
    "Thérapie cognitivo-comportementale (TCC)",
    "Thérapie systémique",
    "Thérapie humaniste",
    "Thérapie psychanalytique",
  ],

  Physiotherapeute: [
    "Physiothérapie musculosquelettique",
    "Physiothérapie sportive",
    "Physiothérapie neurologique",
    "Physiothérapie cardiorespiratoire",
  ],

  Ergotherapeute: [
    "Ergothérapie pédiatrique",
    "Ergothérapie gériatrique",
    "Ergothérapie santé mentale",
    "Ergothérapie en réadaptation",
  ],

  Kinesiologue: [
    "Kinésiologie sportive",
    "Kinésiologie clinique",
    "Kinésiologie en réadaptation",
  ],

  Chiropraticien: [
    "Chiropratique générale",
    "Chiropratique sportive",
    "Chiropratique pédiatrique",
  ],

  Massotherapeute: [
    "Massage suédois",
    "Massage thérapeutique",
    "Massage sportif",
    "Massage prénatal",
  ],

  Osteopathe: [
    "Ostéopathie générale",
    "Ostéopathie pédiatrique",
    "Ostéopathie sportive",
  ],

  Nutritionniste: [
    "Nutrition clinique",
    "Nutrition sportive",
    "Nutrition pédiatrique",
    "Nutrition gériatrique",
  ],

  Optometriste: [
    "Optométrie générale",
    "Optométrie pédiatrique",
    "Optométrie gériatrique",
  ],

  Ophtalmologiste: [
    "Ophtalmologie générale",
    "Chirurgie réfractive",
    "Rétine",
    "Glaucome",
  ],

  Audiologiste: [
    "Audiologie clinique",
    "Audiologie pédiatrique",
    "Audiologie gériatrique",
  ],

  Orthophoniste: [
    "Orthophonie pédiatrique",
    "Orthophonie adulte",
    "Troubles du langage",
    "Troubles de la déglutition",
  ],

  SageFemme: [
    "Suivi de grossesse",
    "Accouchement",
    "Suivi postnatal",
  ],
} as const;

/**
 * Liste des métiers (clés)
 * Utile pour :
 * - validation backend
 * - dropdown frontend
 */
export const PROFESSIONS = Object.keys(MEDICAL_FIELDS);

/**
 * Type TypeScript pour les métiers
 */
export type Profession = keyof typeof MEDICAL_FIELDS;

/**
 * Récupérer les spécialités associées à un métier
 */
export const getSpecialtiesByProfession = (
  profession: Profession
): readonly string[] => {
  return MEDICAL_FIELDS[profession];
};