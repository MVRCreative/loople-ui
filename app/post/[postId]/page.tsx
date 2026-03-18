import { redirect } from "next/navigation";

type Props = { params: Promise<{ postId: string }> | { postId: string } };

export default async function LegacyPostRedirectPage({ params }: Props) {
  const p = await Promise.resolve(params);
  const id = p.postId ?? "";
  redirect(`/status/${id}`);
}
