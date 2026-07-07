import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-text-medium transition hover:border-teal hover:text-text-high"
      >
        <LogOut size={16} />
        Cerrar sesión
      </button>
    </form>
  );
}
