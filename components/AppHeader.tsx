import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/utils/supabase/server";
import { isAdminEmail } from "@/lib/isAdmin";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Planes" },
  { href: "/referidos", label: "Referidos" },
];

export default async function AppHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const showAdminLink = isAdminEmail(user?.email);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-8">
        <Logo className="h-8 w-auto" />
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-medium transition hover:text-text-high"
            >
              {link.label}
            </Link>
          ))}
          {showAdminLink && (
            <Link
              href="/admin"
              className="text-sm text-text-medium transition hover:text-text-high"
            >
              Admin
            </Link>
          )}
        </nav>
      </div>
      <LogoutButton />
    </div>
  );
}
