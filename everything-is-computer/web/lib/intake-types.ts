export type IntakeKind = "client" | "process";

export type ClientPayload = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
};

export type ProcessPayload = {
  customerType: "Internal Customers" | "External Customers";
  selectedStep: string;
  sourceText: string;
  actions: string[];
};

export type Submission = {
  id: string;
  kind: IntakeKind;
  payload: ClientPayload | ProcessPayload;
  created_at: string;
  publication_text: string | null;
  pr_url: string | null;
};
