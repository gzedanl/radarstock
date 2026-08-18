import Link from "next/link";
import Logo from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/billing", label: "Planes" },
  { href: "/referidos", label: "Referidos" },
];

export default function AppHeader() {
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
        </nav>
      </div>
      <LogoutButton />
    </div>
  );
}
