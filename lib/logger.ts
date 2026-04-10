type LogLevel = "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function stringifyError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  }

  return error;
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function maskEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const [localPart = "", domain = ""] = normalizedEmail.split("@");

  if (!localPart || !domain) {
    return "invalid-email";
  }

  const visible = localPart.slice(0, 2);
  return `${visible}***@${domain}`;
}

export function maskIp(ip: string) {
  const normalizedIp = ip.trim();

  if (!normalizedIp || normalizedIp === "unknown") {
    return "unknown";
  }

  if (normalizedIp.includes(":")) {
    const segments = normalizedIp.split(":").filter(Boolean);

    if (segments.length <= 2) {
      return normalizedIp;
    }

    return `${segments.slice(0, 2).join(":")}:***`;
  }

  const octets = normalizedIp.split(".");

  if (octets.length !== 4) {
    return "invalid-ip";
  }

  return `${octets[0]}.${octets[1]}.***.***`;
}

export function maskCpf(cpf: string) {
  const digits = cpf.replace(/\D/g, "");

  if (digits.length !== 11) {
    return "invalid-cpf";
  }

  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export const logger = {
  info(event: string, context?: LogContext) {
    writeLog("info", event, context);
  },
  warn(event: string, context?: LogContext) {
    writeLog("warn", event, context);
  },
  error(event: string, context?: LogContext & { error?: unknown }) {
    const safeContext = {
      ...context,
      error: context?.error ? stringifyError(context.error) : undefined,
    };
    writeLog("error", event, safeContext);
  },
};
