import { AlertTriangle, Layers, Package } from "lucide-react";
import PredictionChart from "@/components/PredictionChart";
import ProductTable, { type Product, type RiskLevel } from "@/components/ProductTable";
import CSVUploader from "@/components/CSVUploader";
import LogoutButton from "@/components/LogoutButton";
import PlanBanner from "@/components/PlanBanner";
import RiskThresholdSettings from "@/components/RiskThresholdSettings";
import CompanyProfileSettings from "@/components/CompanyProfileSettings";
import Logo from "@/components/Logo";
import { getCompanyPlan } from "@/lib/getCompanyPlan";
import { createClient } from "@/utils/supabase/server";
import { buildChartData } from "@/lib/buildChartData";
import { calcRiesgo, diasHastaQuiebreAjustado } from "@/lib/risk";

interface ProductRow {
  sku: string;
  stock_actual: number;
  lead_time_dias: number;
  ventas_historicas: { fecha: string; ventas: number }[];
  // predictions.product_id es unique, así que Supabase la embebe como
  // un objeto (relación 1:1), no como array.
  predictions: {
    dias_hasta_quiebre: number | null;
    cantidad_sugerida: number;
    generated_at: string;
  } | null;
}

const RISK_ORDER: Record<RiskLevel, number> = { alto: 0, medio: 1, bajo: 2 };

function esDeHoy(isoDate: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) === hoy;
}

export default async function DashboardPage() {
  const companyPlan = await getCompanyPlan();

  let products: Product[] = [];
  let chartData: ReturnType<typeof buildChartData> = [];

  if (companyPlan) {
    const supabase = createClient();
    const { data: rows } = await supabase
      .from("products")
      .select(
        "sku, stock_actual, lead_time_dias, ventas_historicas, predictions(dias_hasta_quiebre, cantidad_sugerida, generated_at)"
      )
      .eq("company_id", companyPlan.companyId)
      .order("sku")
      .returns<ProductRow[]>();

    if (rows && rows.length > 0) {
      products = rows.map((row) => {
        const prediction = row.predictions ?? null;
        const diasHastaQuiebre = prediction?.dias_hasta_quiebre ?? null;
        const diasAjustado = diasHastaQuiebreAjustado(
          diasHastaQuiebre,
          row.lead_time_dias
        );
        return {
          sku: row.sku,
          stockActual: row.stock_actual,
          diasHastaQuiebre,
          cantidadSugerida: prediction?.cantidad_sugerida ?? 0,
          riesgo: calcRiesgo(
            diasAjustado,
            companyPlan.diasAlertaAlto,
            companyPlan.diasAlertaMedio
          ),
          desactualizado: prediction ? !esDeHoy(prediction.generated_at) : false,
        };
      });

      // Pre-Fase 4 (P1.3): exception-first — lo más urgente arriba, en
      // vez de una tabla plana ordenada solo por SKU.
      products.sort((a, b) => {
        const riskDiff = RISK_ORDER[a.riesgo] - RISK_ORDER[b.riesgo];
        if (riskDiff !== 0) return riskDiff;
        const da = a.diasHastaQuiebre ?? Infinity;
        const db = b.diasHastaQuiebre ?? Infinity;
        return da - db;
      });

      chartData = buildChartData(rows.map((row) => row.ventas_historicas));
    }
  }

  const hasRealData = products.length > 0;
  const skusEnRiesgo = products.filter((p) => p.riesgo === "alto").length;
  const unidadesEnInventario = products.reduce(
    (sum, p) => sum + p.stockActual,
    0
  );

  // Pre-Fase 4 (P0.1): antes estos dos KPIs eran valores de demo fijos
  // ("$18.4M CLP", "91%") mostrados incluso con datos reales. Ahora, con
  // datos reales se muestran solo métricas calculadas de verdad; en modo
  // demo se mantienen los valores de ejemplo pero marcados como "Demo".
  const KPIS = hasRealData
    ? [
        {
          label: "SKUs en riesgo",
          value: String(skusEnRiesgo),
          icon: AlertTriangle,
          accent: "text-amber",
          demo: false,
        },
        {
          label: "Unidades en inventario",
          value: unidadesEnInventario.toLocaleString("es-CL"),
          icon: Package,
          accent: "text-teal",
          demo: false,
        },
        {
          label: "SKUs monitoreados",
          value: String(products.length),
          icon: Layers,
          accent: "text-teal",
          demo: false,
        },
      ]
    : [
        {
          label: "SKUs en riesgo",
          value: "3",
          icon: AlertTriangle,
          accent: "text-amber",
          demo: true,
        },
        {
          label: "Valor de inventario",
          value: "$18.4M CLP",
          icon: Package,
          accent: "text-teal",
          demo: true,
        },
        {
          label: "SKUs monitoreados",
          value: "5",
          icon: Layers,
          accent: "text-teal",
          demo: true,
        },
      ];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Logo className="h-8 w-auto" />
          <LogoutButton />
        </div>

        <div className="mt-8 flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-text-high">
              Dashboard
            </h1>
            <p className="mt-1 text-text-medium">
              {hasRealData
                ? "Datos de tu empresa."
                : "Vista demo con datos de ejemplo — sube tu CSV para ver tus datos reales."}
            </p>
          </div>
        </div>

        {companyPlan && (
          <div className="mt-8">
            <PlanBanner
              planStatus={companyPlan.planStatus}
              isTrialExpired={companyPlan.isTrialExpired}
            />
          </div>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {KPIS.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-border bg-panel-raised p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <kpi.icon size={20} className={kpi.accent} />
                  <span className="text-sm text-text-medium">{kpi.label}</span>
                </div>
                {kpi.demo && (
                  <span className="rounded-full border border-text-medium/30 bg-text-medium/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-text-medium">
                    Demo
                  </span>
                )}
              </div>
              <p className="mt-3 font-mono text-2xl text-text-high">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8">
          {hasRealData ? (
            <PredictionChart data={chartData} />
          ) : (
            <PredictionChart />
          )}
        </div>

        <div className="mt-8">
          {hasRealData && skusEnRiesgo > 0 && (
            <p className="mb-3 text-sm text-text-medium">
              <span className="font-medium text-amber">
                {skusEnRiesgo} SKU{skusEnRiesgo === 1 ? "" : "s"} en riesgo
                alto
              </span>{" "}
              — están arriba de la tabla, revísalos primero.
            </p>
          )}
          {hasRealData ? (
            <ProductTable products={products} />
          ) : (
            <ProductTable />
          )}
        </div>

        {companyPlan && (
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <RiskThresholdSettings
              diasAlertaAlto={companyPlan.diasAlertaAlto}
              diasAlertaMedio={companyPlan.diasAlertaMedio}
            />
            <CompanyProfileSettings
              rubro={companyPlan.rubro}
              comuna={companyPlan.comuna}
            />
          </div>
        )}

        <div className="mt-8">
          <CSVUploader />
        </div>
      </div>
    </main>
  );
}
