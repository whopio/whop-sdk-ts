import { createBrowserClient } from "@supabase/ssr";

export function createClient(userId: string) {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          ...(userId ? { "whop-user-id": userId } : {}),
        },
      },
    }
  );
}
