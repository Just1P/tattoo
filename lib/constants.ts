export const TATTOO_TYPES = [
  { value: "premier_rdv", label: "Premier rendez-vous" },
  { value: "remplissage", label: "Remplissage" },
  { value: "retouche", label: "Retouche" },
];

export const SIZES = [
  { value: "petit", label: "Petit (< 5 cm)" },
  { value: "moyen", label: "Moyen (5–15 cm)" },
  { value: "grand", label: "Grand (15–30 cm)" },
  { value: "tres_grand", label: "Très grand (> 30 cm)" },
];

export const TATTOO_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TATTOO_TYPES.map((t) => [t.value, t.label]),
);

export const SIZE_LABELS: Record<string, string> = Object.fromEntries(
  SIZES.map((s) => [s.value, s.label]),
);
