import { redirect } from "next/navigation";

export default async function LegacyPostRedirectPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  redirect(`/status/${postId}`);
}
