export const authenticatedSession = {
  user: {
    id: "usr_operacoes",
    name: "Operacoes DocFleet",
    email: "operacoes@docfleet.local",
    role: "Gestor de frota",
  },
};

export function createJsonRequest(
  url: string,
  options?: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: Record<string, unknown>;
  },
) {
  return new Request(url, {
    method: options?.method ?? "GET",
    headers: options?.body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
}
