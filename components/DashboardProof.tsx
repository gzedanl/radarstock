import Image from "next/image";

// Reutilizado en la landing y en las presentaciones comerciales
// (/propuesta, /propuesta-corporate) — misma prueba visual del producto
// en los tres lugares, enmarcada como ventana de navegador.
export default function DashboardProof() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
      <div className="flex items-center gap-1.5 border-b border-border bg-panel-raised px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-amber/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-teal/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-text-medium/40" />
        <span className="ml-3 font-mono text-xs text-text-medium">
          radarstock.cl/dashboard
        </span>
      </div>
      <Image
        src="/dashboard-preview.png"
        alt="Dashboard de RadarStock con KPIs de inventario, predicción de ventas vs. demanda y tabla de productos por nivel de riesgo"
        width={1440}
        height={920}
        className="w-full"
        priority
      />
    </div>
  );
}
