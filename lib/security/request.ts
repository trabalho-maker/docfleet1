type HeaderBag = {
  get(name: string): string | null;
};

export function normalizeClientIp(ip: string | null | undefined) {
  if (!ip) {
    return "unknown";
  }

  const firstForwardedValue = ip.split(",")[0]?.trim() ?? "";

  if (!firstForwardedValue) {
    return "unknown";
  }

  if (
    firstForwardedValue.includes(":") &&
    firstForwardedValue.includes(".") &&
    firstForwardedValue.lastIndexOf(":") > firstForwardedValue.lastIndexOf("]")
  ) {
    return firstForwardedValue.slice(0, firstForwardedValue.lastIndexOf(":"));
  }

  return firstForwardedValue;
}

export function getClientIpFromHeaders(headers: HeaderBag) {
  return normalizeClientIp(
    headers.get("x-forwarded-for") ||
      headers.get("x-real-ip") ||
      headers.get("cf-connecting-ip"),
  );
}
