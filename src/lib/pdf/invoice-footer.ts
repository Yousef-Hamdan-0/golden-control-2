/**
 * Shared bottom section (warranty box + terms) for the invoice, used by BOTH
 * the printed copy and the downloaded PDF so the two never diverge. The
 * downloaded PDF is the approved reference, so this mirrors it exactly.
 */

type TermsSource =
  | {
      term1?: string | null;
      term2?: string | null;
      term3?: string | null;
      term4?: string | null;
    }
  | null
  | undefined;

function text(value: unknown, fallback: string) {
  const next = String(value ?? "").trim();
  return next || fallback;
}

function escapeHtml(value: unknown) {
  return text(value, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Terms come from the center settings (term1..term4) with shared fallbacks. */
export function invoiceTerms(settings?: TermsSource): string[] {
  return [
    text(settings?.term1, "يعد هذا المستند تأكيداً للبيانات والخدمات المسجلة في النظام."),
    text(settings?.term2, "يجب الاحتفاظ بهذا المستند للرجوع إليه عند الحاجة."),
    text(settings?.term3, "لا يشمل الضمان الأعطال الناتجة عن سوء الاستخدام أو العبث بالجهاز."),
    text(settings?.term4, "جميع المبالغ والتواريخ معتمدة حسب البيانات المسجلة في النظام."),
  ];
}

export function invoiceWarrantyHtml(warrantyDuration?: string | null): string {
  return `
        <div class="warranty">
          <small>فترة الضمان المعتمدة</small>
          <strong>${escapeHtml(text(warrantyDuration, "غير محددة"))}</strong>
        </div>`;
}

export function invoiceTermsHtml(terms: string[]): string {
  const items = terms
    .slice(0, 4)
    .map((term) => `<div>${escapeHtml(term)}</div>`)
    .join("");
  return `
        <div class="terms">
          <h3>الشروط والأحكام</h3>
          ${items}
        </div>`;
}

/** Styling for `.warranty` and `.terms`, shared by both templates. */
export const INVOICE_FOOTER_CSS = `
    .warranty { width: 100%; border: 1.4px solid #b98b2f; text-align: center; padding: 4mm; margin-top: 6mm; }
    .warranty small { display: block; color: #8a6800; margin-bottom: 2mm; }
    .warranty strong { font-size: 20px; }
    .terms { font-size: 10.5px; line-height: 1.65; margin-top: 5mm; }
    .terms h3 { font-size: 13px; margin: 0 0 3mm; }
`;
