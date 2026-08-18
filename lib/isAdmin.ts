import "server-only";

// Lista de emails con acceso a /admin — sin sistema de roles todavía,
// alcanza con esto para un equipo chico. ADMIN_EMAILS en Vercel,
// separados por coma.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase());
}
