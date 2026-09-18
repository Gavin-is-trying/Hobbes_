import type { Metadata } from "next";
import { ProcessIntake } from "../../components/process-intake";

export const metadata: Metadata = { title: "Process intake", description: "Turn process notes into a structured draft and identify missing details." };

export default function ProcessIntakePage() {
  return <ProcessIntake />;
}
