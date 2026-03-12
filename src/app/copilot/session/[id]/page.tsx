import { CoPilotInterventionControls } from "@/components/copilot/copilot-intervention-controls";
import { CoPilotSessionLive } from "@/components/copilot/copilot-session-live";
import { SectionHeading } from "@/components/ui/section-heading";
import { buildGhostActionPreview } from "@/lib/copilot/ghost-cursor.service";
import { getSessionWithInterventions } from "@/lib/copilot/session.service";
import { requireOrganizationRole } from "@/server/auth/authorization";

type PageProps = {
  params: {
    id: string;
  };
};

export default async function CoPilotSessionPage({ params }: PageProps): Promise<JSX.Element> {
  const user = await requireOrganizationRole("MEMBER");
  const session = await getSessionWithInterventions(params.id, user.organizationId!);

  const ghost = buildGhostActionPreview({
    action: session?.interventions.at(-1)?.agentSuggestedAction ?? "click",
    target: session?.interventions.at(-1)?.stepId ?? "button.primary",
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-6">
      <SectionHeading
        eyebrow="Operon Co-Pilot"
        title="Human + Agent Live Collaboration"
        description="Confirm or override low-confidence agent actions with continuous execution context."
      />
      <CoPilotSessionLive sessionId={params.id} />
      {session ? (
        <CoPilotInterventionControls
          sessionId={session.id}
          runId={session.runId}
          stepId={session.interventions.at(-1)?.stepId ?? "step-1"}
          confidence={session.interventions.at(-1)?.agentConfidence ?? 0.55}
          suggestedAction={session.interventions.at(-1)?.agentSuggestedAction ?? "click #submit"}
          ghostCursor={ghost.cursor}
        />
      ) : null}
    </div>
  );
}
