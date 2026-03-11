import { LearnModePanel } from "@/components/autopilot/learn-mode-panel";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireOrganizationRole } from "@/server/auth/authorization";

export default async function AutopilotLearnPage(): Promise<JSX.Element> {
  await requireOrganizationRole("MEMBER");

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-6">
      <SectionHeading
        eyebrow="Operon Autopilot"
        title="Teach Once, Operate Continuously"
        description="Record browser actions and compile an editable workflow that can run autonomously."
      />
      <LearnModePanel />
    </div>
  );
}
