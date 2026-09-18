export type ClientRecord = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type ClientDraft = Omit<ClientRecord, "id">;

export const emptyClient: ClientDraft = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
};

export const clientFieldLimits: Record<keyof ClientDraft, number> = {
  firstName: 100,
  lastName: 100,
  phone: 40,
  email: 254,
  address: 200,
  notes: 500,
};

export type ClientParseResult =
  | { ok: true; value: ClientDraft }
  | { ok: false; error: string };

export function parseClientDraft(input: unknown): ClientParseResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, error: "Expected a client record." };
  }
  const record = input as Record<string, unknown>;
  const value: ClientDraft = { ...emptyClient };
  for (const key of Object.keys(clientFieldLimits) as (keyof ClientDraft)[]) {
    const raw = record[key];
    if (raw === undefined || raw === null) continue;
    if (typeof raw !== "string") return { ok: false, error: `${key} must be text.` };
    value[key] = raw.trim();
  }
  if (!value.firstName && !value.lastName) return { ok: false, error: "Enter a first or last name." };
  for (const key of Object.keys(clientFieldLimits) as (keyof ClientDraft)[]) {
    if (value[key].length > clientFieldLimits[key]) {
      return { ok: false, error: `${key} is too long (max ${clientFieldLimits[key]} characters).` };
    }
  }
  if (value.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email)) {
    return { ok: false, error: "Email address is not valid." };
  }
  return { ok: true, value };
}

export function sortClients(clients: ClientRecord[]): ClientRecord[] {
  return [...clients].sort((a, b) =>
    a.lastName.localeCompare(b.lastName, "en", { sensitivity: "base" }) ||
    a.firstName.localeCompare(b.firstName, "en", { sensitivity: "base" })
  );
}
