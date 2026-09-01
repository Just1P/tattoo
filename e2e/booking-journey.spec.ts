import { expect, test } from "@playwright/test";
import { E2E_ARTIST_NAME } from "./fixtures";

test.describe("Parcours client : inscription → recherche d'artiste → réservation", () => {
  test("un nouveau client peut trouver un artiste et lui envoyer une demande de RDV", async ({
    page,
  }) => {
    const uniqueEmail = `e2e.client.${Date.now()}@tattoo-pro.test`;

    // 1. Inscription
    await page.goto("/register");
    await page.getByLabel("Nom").fill("Client E2E");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Mot de passe", { exact: true }).fill("MotDePasse123!");
    await page.getByLabel("Confirmer le mot de passe").fill("MotDePasse123!");
    await page.getByRole("button", { name: "Créer mon compte" }).click();

    // Écran de sélection de rôle ("Comment souhaitez-vous utiliser Tattoo Pro ?")
    await expect(page).toHaveURL("/role-selection");
    await page.getByRole("button", { name: "Je cherche un tatoueur" }).click();
    await expect(page).toHaveURL("/");

    // 2. Recherche d'artiste
    await page.goto("/artists");
    await page.getByPlaceholder("Rechercher un artiste...").fill(E2E_ARTIST_NAME);
    // La recherche pousse l'URL après un debounce ; on attend qu'elle se
    // stabilise avant de cliquer pour éviter que ce second router.push
    // n'annule la navigation déclenchée par le clic sur le lien.
    await page.waitForURL(/search=/);
    await page.getByRole("link", { name: E2E_ARTIST_NAME }).click();
    await expect(page).toHaveURL(/\/artists\/.+/);

    // 3. Demande de réservation
    await page.getByRole("button", { name: "Demander un RDV" }).click();

    await page.getByLabel("Type de rendez-vous *").click();
    await page.getByRole("option", { name: "Premier rendez-vous" }).click();

    await page.getByLabel("Zone du corps *").fill("Avant-bras");

    await page.getByLabel("Taille approximative *").click();
    await page.getByRole("option", { name: "Moyen (5–15 cm)" }).click();

    await page
      .getByLabel("Description du projet *")
      .fill("Un tatouage floral sur l'avant-bras, style fine line.");

    await page.getByRole("button", { name: "Envoyer la demande" }).click();

    await expect(
      page.getByText("Demande envoyée ! L'artiste vous contactera bientôt."),
    ).toBeVisible();
  });
});
