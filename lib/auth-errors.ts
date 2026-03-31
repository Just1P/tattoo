export const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte avec cet email existe déjà.",
  INVALID_EMAIL: "Adresse email invalide.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit contenir au moins 8 caractères.",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Ce compte social est déjà lié à un autre utilisateur.",
};

export function getAuthErrorMessage(code: string): string {
  return AUTH_ERRORS[code] ?? "Une erreur est survenue. Veuillez réessayer.";
}
