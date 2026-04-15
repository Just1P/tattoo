export const artistValidation = {
  siret: (value: string) =>
    /^\d{14}$/.test(value) ? null : "Le SIRET doit contenir exactement 14 chiffres.",

  instagramUrl: (value: string) => {
    if (!value) return null;
    return /^https?:\/\/.+/.test(value)
      ? null
      : "L'URL Instagram doit commencer par http(s)://";
  },

  styleIds: (ids: string[]) =>
    ids.length === 0 ? "Sélectionnez au moins un style." : null,

  artistName: (value: string) =>
    value.trim() ? null : "Le nom artistique est requis.",

  city: (value: string) =>
    value.trim() ? null : "La ville est requise.",
};

type ArtistFormData = {
  artistName: string;
  city: string;
  siret: string;
  instagramUrl: string;
  styleIds: string[];
};

export function validateArtistForm(data: ArtistFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  const artistNameError = artistValidation.artistName(data.artistName);
  if (artistNameError) errors.artistName = artistNameError;

  const cityError = artistValidation.city(data.city);
  if (cityError) errors.city = cityError;

  const siretError = artistValidation.siret(data.siret);
  if (siretError) errors.siret = siretError;

  const instagramError = artistValidation.instagramUrl(data.instagramUrl);
  if (instagramError) errors.instagramUrl = instagramError;

  const styleIdsError = artistValidation.styleIds(data.styleIds);
  if (styleIdsError) errors.styleIds = styleIdsError;

  return errors;
}
