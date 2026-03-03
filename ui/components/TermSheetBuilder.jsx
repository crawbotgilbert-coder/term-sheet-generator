"use client";

import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

const slugify = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "term-sheet";

const SectionCard = ({ title, description, children }) => (
  <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
    </div>
    {children}
  </section>
);

const InputField = ({ label, value, onChange, type = "text" }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
    {label}
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(type === "number" ? Number(event.target.value) : event.target.value)}
      className="rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
    />
  </label>
);

const TextAreaField = ({ label, value, onChange, rows = 4 }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
    {label}
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
    />
  </label>
);

const FundingEditor = ({ title, rows, onChange, onAddRow }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <button type="button" className="text-xs font-semibold text-indigo-600" onClick={onAddRow}>
        + Add row
      </button>
    </div>
    {rows.map((row, index) => (
      <div key={`${title}-${index}`} className="grid grid-cols-[1fr_120px] gap-3">
        <input
          value={row.name}
          onChange={(event) => onChange(index, { ...row, name: event.target.value })}
          placeholder="Label"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          value={row.amount}
          onChange={(event) => onChange(index, { ...row, amount: Number(event.target.value) })}
          placeholder="0"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      </div>
    ))}
  </div>
);

const ClauseCheckboxes = ({ label, options, selected, onToggle }) => (
  <div className="space-y-2">
    <p className="text-sm font-semibold text-slate-700">{label}</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

const SingleSelect = ({ label, value, options, onChange }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
    {label}
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-xl border border-slate-200 px-3 py-2 text-base focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </label>
);

export default function TermSheetBuilder({ catalog }) {
  const [state, setState] = useState(defaultState);
  const [isExporting, setIsExporting] = useState(false);

  const updateArrayField = (key, value) => {
    setState((prev) => ({ ...prev, [key]: value.split("\n").map((line) => line.trim()).filter(Boolean) }));
  };

  const toggleClause = (key, value) => {
    setState((prev) => {
      const set = new Set(prev[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [key]: Array.from(set) };
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
  const fileSlug = slugify(state.projectTitle);

  const clauseOptions = (section) =>
    Object.entries(catalog[section] || {}).map(([value, clause]) => ({ value, label: clause.title }));

  const downloadMarkdown = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileSlug}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadDocx = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown, fileName: fileSlug }),
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileSlug}.docx`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Unable to generate DOCX. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold text-indigo-600">Metals Term Sheet Studio</p>
          <h1 className="text-3xl font-semibold text-slate-900">Deal Composer</h1>
          <p className="text-slate-600 max-w-2xl">
            Capture the header, funding plan, and clause selections on the left. Preview the formatted term sheet and export Markdown or DOCX on the right.
          </p>
        </header>
        <div className="grid gap-8 lg:grid-cols-[420px_1fr] items-start">
          <div className="space-y-6">
            <SectionCard title="Letter Header" description="Confidentiality lines, address block, summary intro">
              <div className="space-y-4">
                <InputField
                  label="Confidentiality Line"
                  value={state.headerConfidentiality}
                  onChange={(value) => setState((prev) => ({ ...prev, headerConfidentiality: value }))}
                />
                <InputField
                  label="Subject Line"
                  value={state.headerSubject}
                  onChange={(value) => setState((prev) => ({ ...prev, headerSubject: value }))}
                />
                <TextAreaField
                  label="Addressee Lines"
                  value={state.addresseeLines.join("\n")}
                  onChange={(text) => updateArrayField("addresseeLines", text)}
                  rows={4}
                />
                <InputField label="Date" value={state.dateLine} onChange={(value) => setState((prev) => ({ ...prev, dateLine: value }))} />
                <InputField label="Project Title" value={state.projectTitle} onChange={(value) => setState((prev) => ({ ...prev, projectTitle: value }))} />
                <InputField label="Salutation" value={state.salutation} onChange={(value) => setState((prev) => ({ ...prev, salutation: value }))} />
                <TextAreaField label="Summary" value={state.summaryIntro} onChange={(value) => setState((prev) => ({ ...prev, summaryIntro: value }))} rows={3} />
              </div>
            </SectionCard>

            <SectionCard title="Project Snapshot" description="Key parties and use of proceeds">
              <div className="space-y-3">
                <InputField label="Sponsor" value={state.projectOverview.sponsor} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, sponsor: value } }))} />
                <InputField label="Project" value={state.projectOverview.project} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, project: value } }))} />
                <InputField label="Facility" value={state.projectOverview.facility} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, facility: value } }))} />
                <InputField label="Use of Proceeds" value={state.projectOverview.use_of_proceeds} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, use_of_proceeds: value } }))} />
                <InputField label="Draw Sequence" value={state.projectOverview.draw_sequence} onChange={(value) => setState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, draw_sequence: value } }))} />
              </div>
            </SectionCard>

            <SectionCard title="Funding Table" description="Sources & uses with totals auto-calculated">
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
            </SectionCard>

            <SectionCard title="Highlights & Clauses" description="Narrative bullets and clause selections">
              <TextAreaField
                label="Facility Highlights"
                value={state.facilityHighlights.join("\n")}
                onChange={(text) => updateArrayField("facilityHighlights", text)}
                rows={5}
              />
              <ClauseCheckboxes label="Pricing" options={clauseOptions("pricing")} selected={state.pricingKeys} onToggle={(value) => toggleClause("pricingKeys", value)} />
              <ClauseCheckboxes label="Covenants" options={clauseOptions("covenants")} selected={state.covenantKeys} onToggle={(value) => toggleClause("covenantKeys", value)} />
              <ClauseCheckboxes label="Security" options={clauseOptions("security")} selected={state.securityKeys} onToggle={(value) => toggleClause("securityKeys", value)} />
              <ClauseCheckboxes label="Conditions Precedent" options={clauseOptions("conditions_precedent")} selected={state.cpKeys} onToggle={(value) => toggleClause("cpKeys", value)} />
              <ClauseCheckboxes label="Offtake" options={clauseOptions("offtake")} selected={state.offtakeKeys} onToggle={(value) => toggleClause("offtakeKeys", value)} />
              <SingleSelect label="Governing Law" options={clauseOptions("governing_law")} value={state.governingLawKey} onChange={(value) => setState((prev) => ({ ...prev, governingLawKey: value }))} />
              <SingleSelect label="Disclaimer" options={clauseOptions("disclaimers")} value={state.disclaimerKey} onChange={(value) => setState((prev) => ({ ...prev, disclaimerKey: value }))} />
              <ClauseCheckboxes label="Binding Sections" options={clauseOptions("binding")} selected={state.bindingKeys} onToggle={(value) => toggleClause("bindingKeys", value)} />
              <div className="grid gap-3 md:grid-cols-2">
                <InputField label="Closing Signoff" value={state.closing.signoff} onChange={(value) => setState((prev) => ({ ...prev, closing: { ...prev.closing, signoff: value } }))} />
                <InputField label="Lender" value={state.closing.lender} onChange={(value) => setState((prev) => ({ ...prev, closing: { ...prev.closing, lender: value } }))} />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                onClick={downloadMarkdown}
                className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Download Markdown
              </button>
              <button
                type="button"
                onClick={downloadDocx}
                disabled={isExporting}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {isExporting ? "Preparing DOCX…" : "Download DOCX"}
              </button>
            </div>
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">Live Preview</p>
                  <h2 className="text-xl font-semibold text-slate-900">Formatted Term Sheet</h2>
                </div>
                <p className="text-xs text-slate-500">Autosaves as you type</p>
              </div>
              <article className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              </article>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
