"use client";

import { ProfileView } from "@/components/app/profile-view";
import { Guard } from "@/components/shell/guard";
import { useDemo } from "@/lib/demo/store";

export default function MyProfilePage() {
  const { me } = useDemo();
  return <Guard feature="profile">{me && <ProfileView personId={me.id} />}</Guard>;
}
