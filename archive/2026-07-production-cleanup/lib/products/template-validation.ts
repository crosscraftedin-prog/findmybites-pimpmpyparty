/**
 * Archived on 2026-07-14
 * Reason:
 * No verified runtime references found.
 * Preserved for future features.
 *
 * DO NOT IMPORT FROM THIS DIRECTORY.
 */

/**
 * Template Engine V3 — Validation Engine.
 * ─────────────────────────────────────────────────────────────────────────
 * Validation rules come from template metadata (DB TemplateField rows).
 * No validation rules inside React components.
 *
 * Supported rules (from TemplateField columns):
 *   - required: field must have a value
 *   - minLength / maxLength: string length bounds
 *   - minValue / maxValue: numeric bounds
 *   - pattern: regex pattern (with patternHint for user-facing message)
 *   - condition: conditional required (field is required only when another field has a specific value)
 *
 * Usage:
 *   const errors = validateProduct(form, templateFields);
 *   if (Object.keys(errors).length > 0) { showErrors(errors); }
 */

export interface TemplateFieldValidation {
  key: string;
  label: string;
  required: boolean;
  type: string;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
  step?: number | null;
  pattern?: string | null;
  patternHint?: string | null;
  condition?: { field: string; values: string[] } | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a product form against template field rules.
 * Returns a map of fieldKey → error message.
 * Empty object = no errors = valid.
 */
export function validateProduct(
  form: Record<string, unknown>,
  fields: TemplateFieldValidation[]
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    if (!field.required && !field.condition) continue;

    const value = form[field.key];
    const isConditionMet = isConditionSatisfied(field.condition, form);

    // Required check (or conditional required)
    if (field.required || (field.condition && isConditionMet && field.required)) {
      if (isEmpty(value)) {
        errors[field.key] = `${field.label} is required`;
        continue;
      }
    }

    // Skip further validation if empty and not required
    if (isEmpty(value)) continue;

    // String length validation
    if (typeof value === "string") {
      if (field.minLength && value.length < field.minLength) {
        errors[field.key] = `${field.label} must be at least ${field.minLength} characters`;
        continue;
      }
      if (field.maxLength && value.length > field.maxLength) {
        errors[field.key] = `${field.label} must be at most ${field.maxLength} characters`;
        continue;
      }
      // Regex pattern validation
      if (field.pattern) {
        try {
          const regex = new RegExp(field.pattern);
          if (!regex.test(value)) {
            errors[field.key] = field.patternHint || `${field.label} format is invalid`;
            continue;
          }
        } catch {
          // Invalid regex in template — skip validation
        }
      }
    }

    // Numeric validation
    if (typeof value === "number" || (typeof value === "string" && value !== "" && !isNaN(Number(value)))) {
      const num = Number(value);
      if (field.minValue !== null && field.minValue !== undefined && num < field.minValue) {
        errors[field.key] = `${field.label} must be at least ${field.minValue}`;
        continue;
      }
      if (field.maxValue !== null && field.maxValue !== undefined && num > field.maxValue) {
        errors[field.key] = `${field.label} must be at most ${field.maxValue}`;
        continue;
      }
    }
  }

  return errors;
}

/**
 * Validate a single field value against its rules.
 * Returns an error message or null if valid.
 */
export function validateField(
  value: unknown,
  field: TemplateFieldValidation,
  form?: Record<string, unknown>
): string | null {
  const errors = validateProduct(
    { ...(form || {}), [field.key]: value },
    [field]
  );
  return errors[field.key] || null;
}

/**
 * Check if a field's condition is satisfied.
 * A condition like { field: "productType", values: ["Cakes", ""] } means
 * the field is relevant when form.productType is "Cakes" or "" (default).
 */
function isConditionSatisfied(
  condition: { field: string; values: string[] } | null | undefined,
  form: Record<string, unknown>
): boolean {
  if (!condition) return true;
  const fieldValue = String(form[condition.field] ?? "");
  return condition.values.includes(fieldValue);
}

/**
 * Check if a value is "empty" for validation purposes.
 */
function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string" && value.trim() === "") return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Get all required fields from a template's field list.
 * Used to show required indicators in the wizard.
 */
export function getRequiredFields(fields: TemplateFieldValidation[]): string[] {
  return fields.filter((f) => f.required).map((f) => f.key);
}

/**
 * Get all conditionally-required fields.
 * Returns a map of fieldKey → condition.
 */
export function getConditionalRequiredFields(
  fields: TemplateFieldValidation[]
): Record<string, { field: string; values: string[] }> {
  const result: Record<string, { field: string; values: string[] }> = {};
  for (const f of fields) {
    if (f.required && f.condition) {
      result[f.key] = f.condition;
    }
  }
  return result;
}
