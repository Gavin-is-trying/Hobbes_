import type { Metadata } from "next";
import { ClientIntake } from "../../components/client-intake";

export const metadata: Metadata = { title: "Clients", description: "Add one short, consistent client record per customer, sorted by last name A to Z." };

export default function ClientsPage() {
  return <ClientIntake />;
}
