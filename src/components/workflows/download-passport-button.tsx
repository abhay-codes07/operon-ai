import { LinkButton } from "@/components/ui/button";

type DownloadPassportButtonProps = {
  workflowId: string;
};

export function DownloadPassportButton({ workflowId }: DownloadPassportButtonProps): JSX.Element {
  return (
    <LinkButton href={`/api/compliance/passport/${workflowId}/pdf`} variant="secondary">
      Download Compliance Passport
    </LinkButton>
  );
}
