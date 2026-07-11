import { copyFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Launches the browser used for server-side PDF generation.
 *
 * Serverless hosts (Vercel / AWS Lambda) have no system Chrome and puppeteer's
 * downloaded browser is not deployed with the function, so production uses the
 * bundled @sparticuz/chromium build via puppeteer-core. Local development and
 * self-hosted Node keep the full puppeteer download.
 */
const isServerless = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.LAMBDA_TASK_ROOT,
);

/**
 * The serverless chromium ships without Arabic fonts, so the bundled Tajawal
 * faces are copied into the fontconfig directory before launch — otherwise
 * every Arabic PDF renders as tofu boxes.
 */
async function installArabicFonts() {
  const fontsDir = process.env.FONTCONFIG_PATH ?? path.join(os.tmpdir(), "fonts");
  try {
    await mkdir(fontsDir, { recursive: true });
    await Promise.all(
      ["Tajawal-Regular.ttf", "Tajawal-Bold.ttf"].map((fileName) =>
        copyFile(
          path.join(process.cwd(), "public", "fonts", fileName),
          path.join(fontsDir, fileName),
        ),
      ),
    );
  } catch {
    // A missing font must not block PDF generation.
  }
}

export async function launchPdfBrowser() {
  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");

    await installArabicFonts();

    return puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=medium"],
  });
}
