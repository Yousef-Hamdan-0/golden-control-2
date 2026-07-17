import { copyFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.AWS_EXECUTION_ENV ||
  process.env.LAMBDA_TASK_ROOT,
);

async function installArabicFonts() {
  const fontsDir =
    process.env.FONTCONFIG_PATH ?? path.join(os.tmpdir(), "fonts");
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
    console.log("✅ Arabic fonts installed successfully at:", fontsDir);
    return fontsDir;
  } catch (error: any) {
    console.warn("⚠️ Font copy failed, using system fonts:", error.message);
    return null;
  }
}

export async function launchPdfBrowser() {
  const fontsDir = await installArabicFonts();

  if (isServerless) {
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = await import("puppeteer-core");

    return puppeteer.launch({
      args: [
        ...chromium.args,
        ...(fontsDir ? [`--fontconfig-path=${fontsDir}`] : []),
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--font-render-hinting=medium",
      ...(fontsDir ? [`--fontconfig-path=${fontsDir}`] : []),
    ],
  });
}
