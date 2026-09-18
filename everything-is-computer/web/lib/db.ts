import { Pool } from "pg";
import type { ClientDraft, ClientRecord } from "./clients";

type ClientRow = {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

const globalStore = globalThis as unknown as {
  hobbesPool?: Pool;
  hobbesSchema?: Promise<void>;
};

function pool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add the client database connection string to the environment.");
  }
  if (!globalStore.hobbesPool) {
    globalStore.hobbesPool = new Pool({ connectionString, max: 5 });
  }
  return globalStore.hobbesPool;
}

export function ensureSchema(): Promise<void> {
  if (!globalStore.hobbesSchema) {
    globalStore.hobbesSchema = pool().query(`
      CREATE TABLE IF NOT EXISTS clients (
        id serial PRIMARY KEY,
        first_name text NOT NULL DEFAULT '',
        last_name text NOT NULL DEFAULT '',
        phone text NOT NULL DEFAULT '',
        email text NOT NULL DEFAULT '',
        address text NOT NULL DEFAULT '',
        notes text NOT NULL DEFAULT '',
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `).then(() => undefined).catch((error: unknown) => {
      globalStore.hobbesSchema = undefined;
      throw error;
    });
  }
  return globalStore.hobbesSchema;
}

function toClientRecord(row: ClientRow): ClientRecord {
  return {
    id: Number(row.id),
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    notes: row.notes,
  };
}

const columns = "id, first_name, last_name, phone, email, address, notes";

export async function listClients(): Promise<ClientRecord[]> {
  await ensureSchema();
  const result = await pool().query<ClientRow>(
    `SELECT ${columns} FROM clients ORDER BY lower(last_name), lower(first_name)`
  );
  return result.rows.map(toClientRecord);
}

export async function insertClient(draft: ClientDraft): Promise<ClientRecord> {
  await ensureSchema();
  const result = await pool().query<ClientRow>(
    `INSERT INTO clients (first_name, last_name, phone, email, address, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${columns}`,
    [draft.firstName, draft.lastName, draft.phone, draft.email, draft.address, draft.notes]
  );
  return toClientRecord(result.rows[0]);
}

export async function removeClient(id: number): Promise<boolean> {
  await ensureSchema();
  const result = await pool().query("DELETE FROM clients WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
