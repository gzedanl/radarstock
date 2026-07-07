import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface PlanBannerProps {
  planStatus: string;
  isTrialExpired: boolean;
}

export default function PlanBanner({
  planStatus,
  isTrialExpired,
}: PlanBannerProps) {
  if (planStatus === "active" && !isTrialExpired) return null;

  const message = isTrialExpired
    ? "Tu período de prueba terminó. Suscríbete para seguir usando RadarStock sin interrupciones."
    : "Tu plan no está activo. Suscríbete para seguir usando RadarStock sin interrupciones.";

  return (
    <div className="mb-8 flex items-center justify-between gap-4 rounded-lg border border-amber/40 bg-amber/10 px-6 py-4">
      <div className="flex items-center gap-3">
        <AlertTriangle size={20} className="shrink-0 text-amber" />
        <p className="text-sm text-text-high">{message}</p>
      </div>
      <Link
        href="/billing"
        className="shrink-0 rounded-md bg-amber px-4 py-2 text-sm font-medium text-navy transition hover:opacity-90"
      >
        Ver planes
      </Link>
    </div>
  );
}
