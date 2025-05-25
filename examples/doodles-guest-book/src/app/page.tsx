import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to the first experience, or
  // another approach would be to show a listing of experiences
  redirect(`/experience/default`);
}
