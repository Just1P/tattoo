import { expect, test } from "@playwright/test";
import { E2E_ARTIST_NAME } from "./fixtures";

const SCREENSHOT_DIR = "docs/tests/rapport-e2e/screenshots";

test.describe("Parcours client : inscription → recherche d'artiste → réservation", () => {
  test("un nouveau client peut trouver un artiste et lui envoyer une demande de RDV", async ({
    page,
  }) => {
    const uniqueEmail = `e2e.client.${Date.now()}@tattoo-pro.test`;

    await test.step("1. Inscription d'un nouveau compte client", async () => {
      await page.goto("/register");
      await page.getByLabel("Nom").fill("Client E2E");
      await page.getByLabel("Email").fill(uniqueEmail);
      await page.getByLabel("Mot de passe", { exact: true }).fill("MotDePasse123!");
      await page.getByLabel("Confirmer le mot de passe").fill("MotDePasse123!");
      await page.getByRole("button", { name: "Créer mon compte" }).click();
      await expect(page).toHaveURL("/role-selection");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/01-inscription.png` });
    });

    await test.step("2. Sélection du rôle client", async () => {
      await page.getByRole("button", { name: "Je cherche un tatoueur" }).click();
      await expect(page).toHaveURL("/");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/02-role-selectionne.png` });
    });

    await test.step("3. Recherche de l'artiste par nom", async () => {
      await page.goto("/artists");
      await page.getByPlaceholder("Rechercher un artiste...").fill(E2E_ARTIST_NAME);
      // La recherche pousse l'URL après un debounce ; on attend qu'elle se
      // stabilise avant de cliquer pour éviter que ce second router.push
      // n'annule la navigation déclenchée par le clic sur le lien.
      await page.waitForURL(/search=/);
      await expect(page.getByRole("link", { name: E2E_ARTIST_NAME })).toBeVisible();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/03-recherche-artiste.png` });
    });

    await test.step("4. Ouverture de la fiche artiste", async () => {
      await page.getByRole("link", { name: E2E_ARTIST_NAME }).click();
      await expect(page).toHaveURL(/\/artists\/.+/);
      await page.screenshot({ path: `${SCREENSHOT_DIR}/04-fiche-artiste.png` });
    });

    await test.step("5. Ouverture du formulaire de demande de RDV", async () => {
      await page.getByRole("button", { name: "Demander un RDV" }).click();
      await expect(page.getByLabel("Type de rendez-vous *")).toBeVisible();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/05-formulaire-ouvert.png` });
    });

    await test.step("6. Sélection du type de rendez-vous et de la taille", async () => {
      await page.getByLabel("Type de rendez-vous *").click();
      await page.getByRole("option", { name: "Premier rendez-vous" }).click();
      await page.getByLabel("Zone du corps *").fill("Avant-bras");
      await page.getByLabel("Taille approximative *").click();
      await page.getByRole("option", { name: "Moyen (5–15 cm)" }).click();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/06-champs-remplis.png` });
    });

    await test.step("7. Description du projet et soumission", async () => {
      await page
        .getByLabel("Description du projet *")
        .fill("Un tatouage floral sur l'avant-bras, style fine line.");
      await page.screenshot({ path: `${SCREENSHOT_DIR}/07-avant-envoi.png` });
      await page.getByRole("button", { name: "Envoyer la demande" }).click();
    });

    await test.step("8. Confirmation de l'envoi de la demande", async () => {
      await expect(
        page.getByText("Demande envoyée ! L'artiste vous contactera bientôt."),
      ).toBeVisible();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/08-confirmation.png` });
    });
  });
});
