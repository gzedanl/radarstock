import { AlertTriangle, Package, Target } from "lucide-react";
import PredictionChart from "@/components/PredictionChart";
import ProductTable, { type Product, type RiskLevel } from "@/components/ProductTable";
import CSVUploader from "@/components/CSVUploader";
import LogoutButton from "@/components/LogoutButton";
import PlanBanner from "@/components/PlanBanner";
import Logo from "@/components/Logo";
import { getCompanyPlan } from "@/lib/getCompanyPlan";
import { createClient } from "@/utils/supabase/server";
import { buildChartData } from "@/lib/buildChartData";

interface ProductRow {
  sku: string;
  stock_actual: number;
  ventas_historicas: { fecha: string; ventas: number }[];
  // predictions.product_id es unique, así que Supabase la embebe como
  // un objeto (relación 1:1), no como array.
  predictions: {
    dias_hasta_quiebre: number | null;
    cantidad_sugerida: number;
    generated_at: string;
  } | null;
}

function esDeHoy(isoDate: string): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  return isoDate.slice(0, 10) === hoy;
}

function calcRiesgo(diasHastaQuiebre: number | null): RiskLevel {
  if (diasHastaQuiebre === null) return "bajo";
  if (diasHastaQuiebre <= 5) return "alto";
  if (diasHastaQuiebre <= 14) return "medio";
  return "bajo";
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
        "sku, stock_actual, ventas_historicas, predictions(dias_hasta_quiebre, cantidad_sugerida, generated_at)"
      )
      .eq("company_id", companyPlan.companyId)
      .order("sku")
      .returns<ProductRow[]>();

    if (rows && rows.length > 0) {
      products = rows.map((row) => {
        const prediction = row.predictions ?? null;
        const diasHastaQuiebre = prediction?.dias_hasta_quiebre ?? null;
        return {
          sku: row.sku,
          stockActual: row.stock_actual,
          diasHastaQuiebre,
          cantidadSugerida: prediction?.cantidad_sugerida ?? 0,
          riesgo: calcRiesgo(diasHastaQuiebre),
          desactualizado: prediction ? !esDeHoy(prediction.generated_at) : false,
        };
      });

      chartData = buildChartData(rows.map((row) => row.ventas_historicas));
    }
  }

  const hasRealData = products.length > 0;
  const skusEnRiesgo = products.filter((p) => p.riesgo === "alto").length;

  const KPIS = [
    {
      label: "SKUs en riesgo",
      value: hasRealData ? String(skusEnRiesgo) : "3",
      icon: AlertTriangle,
      accent: "text-amber",
    },
    {
      label: "Valor de inventario",
      value: "$18.4M CLP",
      icon: Package,
      accent: "text-teal",
    },
    {
      label: "Precisión de predicción",
      value: "91%",
      icon: Target,
      accent: "text-teal",
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
              <div className="flex items-center gap-3">
                <kpi.icon size={20} className={kpi.accent} />
                <span className="text-sm text-text-medium">{kpi.label}</span>
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
          {hasRealData ? (
            <ProductTable products={products} />
          ) : (
            <ProductTable />
          )}
        </div>

        <div className="mt-8">
          <CSVUploader />
        </div>
      </div>
    </main>
  );
}
