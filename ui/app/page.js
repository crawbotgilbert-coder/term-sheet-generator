"use client";

import { useMemo, useState } from "react";
import { clauseCatalog } from "../lib/clauses";
import { buildMarkdown } from "../lib/render";

const fieldConfig = [
  { name: "borrower_name", label: "Borrower", type: "text", placeholder: "Atlas Copper Holdings" },
  { name: "jurisdiction", label: "Jurisdiction", type: "text", placeholder: "UAE" },
  { name: "facility_type", label: "Facility Type", type: "text", placeholder: "HoldCo Term Loan" },
  { name: "facility_size", label: "Facility Size (in millions)", type: "number", placeholder: "250" },
  { name: "currency", label: "Currency", type: "text", placeholder: "USD" },
  { name: "use_of_proceeds", label: "Use of Proceeds", type: "text", placeholder: "Acquisition..." },
  { name: "margin_bps", label: "Margin (bps)", type: "number", placeholder: "425" },
  { name: "sofr_floor", label: "SOFR Floor (%)", type: "number", placeholder: "1.50" },
  { name: "upfront_fee_pct", label: "Upfront Fee (%)", type: "number", placeholder: "1.00" },
  { name: "commitment_fee_pct", label: "Commitment Fee (%)", type: "number", placeholder: "0.75" },
  { name: "leverage_limit", label: "Net Leverage Cap", type: "number", placeholder: "3.25" },
  { name: "cure_period_days", label: "Cure Period (days)", type: "number", placeholder: "30" },
  { name: "min_liquidity", label: "Minimum Liquidity", type: "number", placeholder: "35" },
  { name: "hedging_pct", label: "Hedging %", type: "number", placeholder: "70" },
  { name: "hedging_months", label: "Hedging Horizon (months)", type: "number", placeholder: "18" },
  { name: "cross_default_threshold", label: "Cross-Default Threshold", type: "number", placeholder: "25" },
];

const defaultValues = {
  date: new Date().toISOString().split("T")[0],
  borrower_name: "Atlas Copper Holdings",
  jurisdiction: "UAE",
  facility_type: "HoldCo Term Loan B",
  facility_size: 250,
  currency: "USD",
  use_of_proceeds: "Acquisition of 35% stake in Cerro Verde Expansion",
  margin_bps: 425,
  sofr_floor: 1.5,
  upfront_fee_pct: 1.0,
  commitment_fee_pct: 0.75,
  leverage_limit: 3.25,
  cure_period_days: 30,
  min_liquidity: 35,
  hedging_pct: 70,
  hedging_months: 18,
  cross_default_threshold: 25,
};

export default function Home() {
  const [values, setValues] = useState(defaultValues);

  const markdown = useMemo(() => buildMarkdown(values, clauseCatalog), [values]);

  const onChange = (name) => (event) => {
    setValues((prev) => ({
      ...prev,
      [name]: event.target.type === "number" ? Number(event.target.value) : event.target.value,
    }));
  };

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${values.borrower_name || "term-sheet"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
        <section className="bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-semibold mb-4">Deal Inputs</h1>
          <div className="grid gap-4">
            {fieldConfig.map((field) => (
              <label key={field.name} className="text-sm font-medium text-slate-700">
                {field.label}
                <input
                  type={field.type}
                  inputMode={field.type === "number" ? "decimal" : undefined}
                  value={values[field.name] ?? ""}
                  onChange={onChange(field.name)}
                  placeholder={field.placeholder}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>
            ))}
          </div>
          <button
            onClick={downloadMarkdown}
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500"
          >
            Download Markdown
          </button>
        </section>
        <section className="bg-white rounded-xl shadow p-6 overflow-auto">
          <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm whitespace-pre-wrap">
            {markdown}
          </pre>
        </section>
      </div>
    </main>
  );
}
