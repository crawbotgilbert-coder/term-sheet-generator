"use client";

import { useMemo, useState } from "react";
import { buildMarkdown } from "../lib/markdown";

const defaultState = {
  headerConfidentiality: "STRICTLY PRIVATE & CONFIDENTIAL",
  headerSubject: "SUBJECT TO CONTRACT",
  addresseeLines: [
    "Board of Directors",
    "KGL Resources Limited",
    "Level 7, 167 Eagle Street",
    "Brisbane QLD 4000, Australia",
  ],
  dateLine: "6 February 2026",
  projectTitle: 'Project Kairos – Jervois Base Metal Project (the "Term Sheet")',
  salutation: "Dear Board Members,",
  summaryIntro:
    "Mercuria proposes the following junior facility and aligned offtake arrangements to bridge the remaining capital expenditure for the Jervois base metals project once equity and senior streaming facilities are fully drawn.",
  projectOverview: {
    sponsor: 'KGL Resources Limited ("KGL")',
    project: "Development of the Jervois copper concentrate project in the Northern Territory, Australia.",
    facility: 'USD 50,000,000 junior second-lien term loan (the "Facility").',
    use_of_proceeds: "Last-mile construction spend and commissioning contingency.",
    draw_sequence: "Junior Facility is drawn only after equity and senior stream commitments have been utilised.",
  },
  sources: [
    { name: "Project Equity", amount: 111 },
    { name: "Senior Stream Facilities", amount: 333 },
    { name: "Junior Facility (Mercuria)", amount: 50 },
    { name: "Standby Overrun Facility", amount: 37 },
  ],
  uses: [
    { name: "Project CAPEX", amount: 364 },
    { name: "OC Mining & Commissioning", amount: 130 },
    { name: "Cost Overrun Contingency", amount: 37 },
  ],
  facilityHighlights: [
    "Borrower: KGL Resources Limited (or a designated holdco) with guarantees from key project subsidiaries.",
    "Currency: USD.",
    "Availability: Single or multiple utilisations during the construction window, subject to conditions precedent.",
    "Ranking: Second lien behind the senior streaming package with terms governed by an intercreditor agreement.",
    "Repayment: Monthly amortisation via offtake deductions after the grace period.",
  ],
  pricingKeys: ["kgl_junior"],
  covenantKeys: ["coverage_ratio", "cash_sweep", "negative_pledge", "sanctions", "project_mac"],
  securityKeys: ["kisenda_first_lien"],
  cpKeys: ["project_prepayment"],
  offtakeKeys: ["restructure_ack"],
  governingLawKey: "english_default",
  disclaimerKey: "non_binding",
  bindingKeys: ["confidentiality", "exclusivity", "fees_expenses"],
  closing: {
    signoff: "Yours faithfully,",
    lender: "Mercuria Asia Group Holdings (Pte.) Ltd",
  },
};

function TextAreaField({ label, value, onChange, rows = 4 }) {
  return (
    <label className="text-sm font-medium text-slate-700 flex flex-col gap-2">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function InputField({ label, value, onChange, type = "text" }) {
  return (
    <label className="text-sm font-medium text-slate-700 flex flex-col gap-2">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}

function ClauseCheckboxes({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700 mb-2">{label}</p>
      <div className="flex flex-col gap-1">
        {options.map((option) => (
          <label key={option.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={selected.includes(option.value)}
              onChange={() => onToggle(option.value)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );
}

function SingleSelect({ label, options, value, onChange }) {
  return (
    <label className="text-sm font-medium text-slate-700 flex flex-col gap-2">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FundingEditor({ title, rows, onChange, onAddRow }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <button
          type="button"
          onClick={onAddRow}
          className="text-xs font-semibold text-indigo-600"
        >
          + Add row
        </button>
      </div>
      {rows.map((row, index) => (
        <div key={`${title}-${index}`} className="grid grid-cols-[1fr_100px] gap-2">
          <input
            value={row.name}
            onChange={(event) => onChange(index, { ...row, name: event.target.value })}
            placeholder="Label"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            type="number"
            value={row.amount}
            onChange={(event) => onChange(index, { ...row, amount: Number(event.target.value) })}
            placeholder="0"
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
      ))}
    </div>
  );
}

export default function TermSheetBuilder({ catalog }) {
  const [state, setState] = useState(defaultState);

  const updateArrayField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value.split("\n").map((line) => line.trim()).filter(Boolean) }));
  };

  const toggleClause = (key, value) => {
    setState((prev) => {
      const current = new Set(prev[key]);
      if (current.has(value)) {
        current.delete(value);
      } else {
        current.add(value);
      }
      return { ...prev, [key]: Array.from(current) };
    });
  };

  const updateFundingRow = (type, index, nextRow) => {
    setState((prev) => {
      const rows = [...prev[type]];
      rows[index] = nextRow;
      return { ...prev, [type]: rows };
    });
  };

  const addFundingRow = (type) => {
    setState((prev) => ({ ...prev, [type]: [...prev[type], { name: "", amount: 0 }] }));
  };

  const markdown = useMemo(() => buildMarkdown(state, catalog), [state, catalog]);

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${state.projectTitle.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "term-sheet"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clauseOptions = (section) =>
    Object.entries(catalog[section] || {}).map(([value, clause]) => ({ value, label: clause.title }));

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-6">
      <div className="max-w-7xl mx-auto grid gap-6 lg:grid-cols-2">
        <section className="bg-white rounded-xl shadow p-6 space-y-6">
          <h1 className="text-2xl font-semibold">Term Sheet Builder</h1>
          <InputField
            label="Confidentiality Header"
            value={state.headerConfidentiality}
            onChange={(value) => setState((prev) => ({ ...prev, headerConfidentiality: value }))}
          />
          <InputField
            label="Subject Header"
            value={state.headerSubject}
            onChange={(value) => setState((prev) => ({ ...prev, headerSubject: value }))}
          />
          <TextAreaField
            label="Addressee Lines"
            value={state.addresseeLines.join("\n")}
            onChange={(text) => updateArrayField("addresseeLines", text)}
          />
          <InputField label="Date Line" value={state.dateLine} onChange={(value) => setState((prev) => ({ ...prev, dateLine: value }))} />
          <InputField label="Project Title" value={state.projectTitle} onChange={(value) => setState((prev) => ({ ...prev, projectTitle: value }))} />
          <InputField label="Salutation" value={state.salutation} onChange={(value) => setState((prev) => ({ ...prev, salutation: value }))} />
          <TextAreaField label="Summary Intro" value={state.summaryIntro} onChange={(value) => setState((prev) => ({ ...prev, summaryIntro: value }))} rows={3} />

          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Sponsor" value={state.projectOverview.sponsor} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, sponsor: value } }))} />
            <InputField label="Project" value={state.projectOverview.project} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, project: value } }))} />
            <InputField label="Facility" value={state.projectOverview.facility} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, facility: value } }))} />
            <InputField label="Use of Proceeds" value={state.projectOverview.use_of_proceeds} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, use_of_proceeds: value } }))} />
            <InputField label="Draw Sequence" value={state.projectOverview.draw_sequence} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, draw_sequence: value } }))} />
          </div>

          <FundingEditor
            title="Sources"
            rows={state.sources}
            onChange={(index, row) => updateFundingRow("sources", index, row)}
            onAddRow={() => addFundingRow("sources")}
          />
          <FundingEditor
            title="Uses"
            rows={state.uses}
            onChange={(index, row) => updateFundingRow("uses", index, row)}
            onAddRow={() => addFundingRow("uses")}
          />

          <TextAreaField
            label="Facility Highlights"
            value={state.facilityHighlights.join("\n")}
            onChange={(text) => updateArrayField("facilityHighlights", text)}
            rows={5}
          />

          <ClauseCheckboxes
            label="Pricing Clauses"
            options={clauseOptions("pricing")}
            selected={state.pricingKeys}
            onToggle={(value) => toggleClause("pricingKeys", value)}
          />
          <ClauseCheckboxes
            label="Covenants"
            options={clauseOptions("covenants")}
            selected={state.covenantKeys}
            onToggle={(value) => toggleClause("covenantKeys", value)}
          />
          <ClauseCheckboxes
            label="Security"
            options={clauseOptions("security")}
            selected={state.securityKeys}
            onToggle={(value) => toggleClause("securityKeys", value)}
          />
          <ClauseCheckboxes
            label="Conditions Precedent"
            options={clauseOptions("conditions_precedent")}
            selected={state.cpKeys}
            onToggle={(value) => toggleClause("cpKeys", value)}
          />
          <ClauseCheckboxes
            label="Offtake"
            options={clauseOptions("offtake")}
            selected={state.offtakeKeys}
            onToggle={(value) => toggleClause("offtakeKeys", value)}
          />

          <SingleSelect
            label="Governing Law"
            options={clauseOptions("governing_law")}
            value={state.governingLawKey}
            onChange={(value) => setState((prev) => ({ ...prev, governingLawKey: value }))}
          />
          <SingleSelect
            label="Disclaimer"
            options={clauseOptions("disclaimers")}
            value={state.disclaimerKey}
            onChange={(value) => setState((prev) => ({ ...prev, disclaimerKey: value }))}
          />
          <ClauseCheckboxes
            label="Binding Provisions"
            options={clauseOptions("binding")}
            selected={state.bindingKeys}
            onToggle={(value) => toggleClause("bindingKeys", value)}
          />

          <div className="grid gap-3 md:grid-cols-2">
            <InputField label="Closing Signoff" value={state.closing.signoff} onChange={(value) => setState((prev) => ({ ...prev, closing: { ...prev.closing, signoff: value } }))} />
            <InputField label="Lender Name" value={state.closing.lender} onChange={(value) => setState((prev) => ({ ...prev, closing: { ...prev.closing, lender: value } }))} />
          </div>

          <button
            type="button"
            onClick={downloadMarkdown}
            className="w-full inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-500"
          >
            Download Markdown
          </button>
        </section>

        <section className="bg-white rounded-xl shadow p-6 overflow-auto">
          <h2 className="text-2xl font-semibold mb-4">Live Preview</h2>
          <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-sm whitespace-pre-wrap min-h-[400px]">
            {markdown}
          </pre>
        </section>
      </div>
    </main>
  );
}
