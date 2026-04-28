function normalizeOptionalInput(value: unknown) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeAssociateRg(value: unknown) {
  const normalizedValue = normalizeOptionalInput(value);

  if (!normalizedValue) {
    return null;
  }

  const normalizedRg = normalizedValue
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "");

  return normalizedRg || null;
}

export function normalizeAssociateCnh(value: unknown) {
  const normalizedValue = normalizeOptionalInput(value);

  if (!normalizedValue) {
    return null;
  }

  const digits = normalizedValue.replace(/\D/g, "");
  return digits || null;
}

export function normalizeAssociateCompanyCnpj(value: unknown) {
  const normalizedValue = normalizeOptionalInput(value);

  if (!normalizedValue) {
    return null;
  }

  const digits = normalizedValue.replace(/\D/g, "");
  return digits || null;
}
