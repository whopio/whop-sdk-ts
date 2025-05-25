import { headers } from "next/headers";
import { verifyUserToken, whopApi } from "../../../../lib/whop-api";
import { Canvas } from "@/components/canvas";
import { Callout } from "frosted-ui";
import { createClient } from "@/utils/supabase/server";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  // Await params before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { experienceId } = resolvedParams;
  const requestHeaders = await headers();
  const userTokenData = await verifyUserToken(requestHeaders);

  if (!userTokenData) {
    return (
      <Callout.Root>
        <Callout.Text>
          <h2 className="text-red-600 font-semibold">Authentication Error</h2>
          <p className="text-red-500">Invalid or missing user token</p>
        </Callout.Text>
      </Callout.Root>
    );
  }

  // Using direct API call is appropriate here since this is already a server component
  const userProfile = await whopApi.GetPublicUser({
    userId: userTokenData.userId,
  });

  const supabase = await createClient();

  // Check if the canvas exists
  const { data: existingCanvas, error } = await supabase
    .from("canvas")
    .select("id")
    .eq("id", experienceId)
    .single();

  console.log("🔴🔴 check error", error);

  // Create the canvas if it doesn't exist
  if (!existingCanvas) {
    const { error: insertError } = await supabase.from("canvas").insert([
      {
        id: experienceId,
        name: `Canvas for ${experienceId}`, // optional
      },
    ]);
    console.log("🔴🔴 insertError", insertError);
  }

  return (
    <Canvas
      userId={userTokenData.userId}
      userProfile={userProfile}
      experienceId={experienceId}
    />
  );
}
