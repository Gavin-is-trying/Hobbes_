CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE jobber_connections (
 id bigserial PRIMARY KEY, account_id text NOT NULL UNIQUE DEFAULT 'default', access_token text NOT NULL,
 refresh_token text NOT NULL, access_token_expires_at timestamptz NOT NULL, scopes text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE clients (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, name text NOT NULL, first_name text, last_name text,
 company_name text, email text, phone text, is_active boolean NOT NULL DEFAULT true,
 billing_address text, city text, province text, postal_code text, archived_at timestamptz,
 source_payload jsonb NOT NULL, source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clients_search_idx ON clients USING gin (to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(billing_address,'') || ' ' || coalesce(city,'')));
CREATE TABLE properties (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, client_jobber_id text REFERENCES clients(jobber_id) ON UPDATE CASCADE,
 address text, city text, province text, postal_code text, is_active boolean NOT NULL DEFAULT true,
 source_payload jsonb NOT NULL, source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE jobs (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, client_jobber_id text REFERENCES clients(jobber_id) ON UPDATE CASCADE,
 property_jobber_id text REFERENCES properties(jobber_id) ON UPDATE CASCADE, job_number text, title text, status text NOT NULL,
 start_at timestamptz, end_at timestamptz, closed_at timestamptz, source_payload jsonb NOT NULL,
 source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE visits (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, job_jobber_id text REFERENCES jobs(jobber_id) ON UPDATE CASCADE,
 title text, status text NOT NULL, start_at timestamptz, end_at timestamptz, completed_at timestamptz,
 source_payload jsonb NOT NULL, source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE quotes (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, client_jobber_id text REFERENCES clients(jobber_id) ON UPDATE CASCADE,
 quote_number text, title text, status text NOT NULL, total numeric(14,2), created_date date, sent_at timestamptz,
 approved_at timestamptz, source_payload jsonb NOT NULL, source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE invoices (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, client_jobber_id text REFERENCES clients(jobber_id) ON UPDATE CASCADE,
 invoice_number text, subject text, status text NOT NULL, total numeric(14,2) NOT NULL DEFAULT 0,
 balance numeric(14,2) NOT NULL DEFAULT 0, issued_date date, due_date date, paid_at timestamptz,
 source_payload jsonb NOT NULL, source_updated_at timestamptz, synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX invoices_analytics_idx ON invoices (issued_date, status, client_jobber_id);
CREATE TABLE payments (
 id bigserial PRIMARY KEY, jobber_id text NOT NULL UNIQUE, client_jobber_id text REFERENCES clients(jobber_id) ON UPDATE CASCADE,
 invoice_jobber_id text REFERENCES invoices(jobber_id) ON UPDATE CASCADE, amount numeric(14,2) NOT NULL,
 paid_at timestamptz, payment_method text, source_payload jsonb NOT NULL, source_updated_at timestamptz,
 synced_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE jobber_sync_state (
 resource text PRIMARY KEY, last_started_at timestamptz, last_completed_at timestamptz, last_success_at timestamptz,
 status text NOT NULL CHECK(status IN ('idle','running','succeeded','failed')), records_processed integer NOT NULL DEFAULT 0,
 error text, cursor text, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE webhook_events (
 id bigserial PRIMARY KEY, provider text NOT NULL DEFAULT 'jobber', delivery_id text NOT NULL,
 topic text NOT NULL, external_account_id text, external_item_id text, payload jsonb NOT NULL,
 received_at timestamptz NOT NULL DEFAULT now(), available_at timestamptz NOT NULL DEFAULT now(),
 processing_started_at timestamptz, processed_at timestamptz, status text NOT NULL DEFAULT 'pending'
 CHECK(status IN ('pending','processing','processed','failed')), attempt_count integer NOT NULL DEFAULT 0,
 last_error text, UNIQUE(provider, delivery_id)
);
CREATE INDEX webhook_queue_idx ON webhook_events(status, available_at, received_at);
