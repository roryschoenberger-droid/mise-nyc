import { redirect } from "next/navigation";
import {
  AppShell,
  ChallengeSection,
  SuggestChallengeForm,
} from "../../components";
import { getSessionContext } from "../../lib/session-context";

// "Pitch an Idea" tab — restaurants suggest market-wide challenges for
// Blackbird to run. Submissions land at /admin/suggestions for staff.
export default async function PitchPage() {
  const { accessToken, signedInViaOAuth } = await getSessionContext();
  if (!accessToken) redirect("/");

  return (
    <AppShell signedInViaOAuth={signedInViaOAuth}>
      <ChallengeSection
        title="Pitch Blackbird a Challenge"
        subtitle={
          <>
            Know what would pack rooms in your city? Pitch Blackbird a
            market-wide challenge worth running here. The team reads every idea.
          </>
        }
      >
        <SuggestChallengeForm />
      </ChallengeSection>
    </AppShell>
  );
}
