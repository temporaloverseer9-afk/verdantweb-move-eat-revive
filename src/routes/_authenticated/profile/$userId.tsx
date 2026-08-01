import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/ProfileView";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  head: () => ({
    meta: [
      { title: "Member profile — VerdantWeb" },
      {
        name: "description",
        content:
          "See another VerdantWeb member's animal avatar, green kilometres, healthy-food points and unlocked eco badges.",
      },
      { property: "og:title", content: "Member profile — VerdantWeb" },
      {
        property: "og:description",
        content: "Green kilometres, food points and eco badges for a VerdantWeb member.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MemberProfile,
});

function MemberProfile() {
  const { userId } = Route.useParams();
  return <ProfileView userId={userId} />;
}
