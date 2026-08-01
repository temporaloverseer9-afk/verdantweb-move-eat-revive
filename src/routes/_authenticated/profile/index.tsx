import { createFileRoute } from "@tanstack/react-router";
import { ProfileView } from "@/components/ProfileView";

export const Route = createFileRoute("/_authenticated/profile/")({
  head: () => ({
    meta: [
      { title: "Your profile — VerdantWeb" },
      {
        name: "description",
        content:
          "Your VerdantWeb profile: animal avatar, green kilometres, healthy-food points and the eco badges you have unlocked.",
      },
      { property: "og:title", content: "Your profile — VerdantWeb" },
      {
        property: "og:description",
        content: "Animal avatar, green kilometres, food points and unlocked eco badges.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ProfileView />,
});
