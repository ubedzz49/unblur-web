"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Settings was merged into the Profile dashboard (see profile/page.tsx,
// profile-dashboard.html) -- everything that used to live here (account form,
// appearance, language, expertise) now lives on one page. This route stays only
// as a redirect so old links/bookmarks still land somewhere real.
export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return null;
}
