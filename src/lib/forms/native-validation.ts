/**
 * Arabic replacements for the browser's default (usually English) HTML5
 * constraint-validation messages. Wire the returned handlers into an input so
 * that `required`, `type="email"`, `min`, `max`, `minLength`, `pattern`, ... all
 * surface Arabic bubbles instead of the browser-locale defaults.
 */

type ValidatableElement =
  | HTMLInputElement
  | HTMLTextAreaElement
  | HTMLSelectElement;

export function arabicValidationMessage(element: ValidatableElement): string {
  const validity = element.validity;
  const type = "type" in element ? element.type : "";

  if (validity.valueMissing) {
    if (type === "checkbox" || type === "radio") return "يرجى تحديد هذا الحقل.";
    if (element instanceof HTMLSelectElement) return "يرجى اختيار قيمة من القائمة.";
    return "هذا الحقل مطلوب.";
  }

  if (validity.typeMismatch) {
    if (type === "email") return "يرجى إدخال بريد إلكتروني صحيح.";
    if (type === "url") return "يرجى إدخال رابط صحيح.";
    return "القيمة المدخلة غير صحيحة.";
  }

  if (validity.tooShort && "minLength" in element) {
    return `يرجى إدخال ${element.minLength} أحرف على الأقل.`;
  }

  if (validity.tooLong && "maxLength" in element) {
    return `يرجى إدخال ${element.maxLength} حرفاً كحد أقصى.`;
  }

  if (validity.rangeUnderflow && "min" in element) {
    return `القيمة يجب ألا تقل عن ${element.min}.`;
  }

  if (validity.rangeOverflow && "max" in element) {
    return `القيمة يجب ألا تزيد عن ${element.max}.`;
  }

  if (validity.stepMismatch) {
    return "يرجى إدخال قيمة صحيحة ضمن الخطوات المسموحة.";
  }

  if (validity.patternMismatch) {
    return "التنسيق المدخل غير صحيح.";
  }

  if (validity.badInput) {
    return "يرجى إدخال قيمة صحيحة.";
  }

  return "القيمة المدخلة غير صحيحة.";
}

/** Set the Arabic message when the field becomes invalid on submit/blur. */
export function applyArabicValidationMessage(element: ValidatableElement) {
  element.setCustomValidity(arabicValidationMessage(element));
}

/** Clear the custom message so the browser can re-validate the fresh value. */
export function clearCustomValidity(element: ValidatableElement) {
  element.setCustomValidity("");
}
