const required = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

type EnvKey = (typeof required)[number];

function validateEnv(): Record<EnvKey, string> {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missing.join(", ")}\nVérifiez votre fichier .env`,
    );
  }
  return Object.fromEntries(
    required.map((key) => [key, process.env[key]!]),
  ) as Record<EnvKey, string>;
}

export const env = validateEnv();
