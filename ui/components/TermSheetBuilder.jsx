"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { buildMarkdown } from "../lib/markdown";

const STORAGE_KEY = "term-sheet-builder-state-v2";
const STORAGE_PRESET_KEY = "term-sheet-builder-preset-v2";

const fallbackState = {
  headerConfidentiality: "STRICTLY PRIVATE & CONFIDENTIAL",
  headerSubject: "SUBJECT TO CONTRACT",
  addresseeLines: ["Board of Directors", "Company Name", "Address Line", "City"],
  dateLine: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
  projectTitle: "Metals Project – Term Sheet",
  salutation: "Dear Board Members,",
  summaryIntro: "This workspace lets you assemble indicative financing and offtake term sheets using reusable clause modules.",
  projectOverview: {
    sponsor: "Sponsor Name",
    project: "Asset description and jurisdiction.",
    facility: "USD 0,000,000 facility description.",
    use_of_proceeds: "Key uses.",
    draw_sequence: "Draw sequence logic.",
  },
  sources: [
    { name: "Equity", amount: 0 },
    { name: "Mercuria Facility", amount: 0 },
  ],
  uses: [
    { name: "Project CAPEX", amount: 0 },
    { name: "Fees", amount: 0 },
  ],
  facilityHighlights: [
    "Borrower: Holding company with guarantees from operating subsidiaries.",
    "Ranking: Second lien behind committed senior debt.",
  ],
  pricingKeys: [],
  covenantKeys: [],
  securityKeys: [],
  cpKeys: [],
  offtakeKeys: [],
  governingLawKey: "english_default",
  disclaimerKey: "non_binding",
  bindingKeys: ["confidentiality"],
  closing: { signoff: "Yours faithfully,", lender: "Mercuria" },
};

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
        <label key={option.value} className="inline-flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span>
            {option.label}
            {option.hint && <span className="block text-xs text-slate-400">{option.hint}</span>}
          </span>
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

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export default function TermSheetBuilder({ catalog, presets = [] }) {
  const baseState = presets[0]?.state ?? fallbackState;
  const [state, setState] = useState(deepClone(baseState));
  const [selectedPreset, setSelectedPreset] = useState(presets[0]?.id ?? "custom");
  const [isExporting, setIsExporting] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const storedPreset = window.localStorage.getItem(STORAGE_PRESET_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored));
        setSelectedPreset(storedPreset || "custom");
      } catch (error) {
        console.warn("Failed to parse stored term sheet state", error);
      }
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.localStorage.setItem(STORAGE_PRESET_KEY, selectedPreset);
  }, [state, selectedPreset, isHydrated]);

  const mutateState = (updater, preservePreset = false) => {
    setState((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      return next;
    });
    if (!preservePreset) {
      setSelectedPreset("custom");
    }
  };

  const applyPreset = (id) => {
    const preset = presets.find((item) => item.id === id);
    if (!preset) return;
    setState(deepClone(preset.state));
    setSelectedPreset(id);
  };

  const resetToDefault = () => {
    setState(deepClone(baseState));
    setSelectedPreset(presets[0]?.id ?? "custom");
  };

  const addFundingRow = (type) =>
    mutateState((prev) => ({ ...prev, [type]: [...prev[type], { name: "", amount: 0 }] }));

  const updateFundingRow = (type, index, nextRow) =>
    mutateState((prev) => {
      const rows = [...prev[type]];
      rows[index] = nextRow;
      return { ...prev, [type]: rows };
    });

  const updateArrayField = (key, value) =>
    mutateState((prev) => ({ ...prev, [key]: value.split("\n").map((line) => line.trim()).filter(Boolean) }));

  const clauseOptions = (section) =>
    Object.entries(catalog[section] || {}).map(([value, clause]) => ({
      value,
      label: clause.title,
      hint: clause.source || clause.description || "",
    }));

  const singleOptions = (section) =>
    Object.entries(catalog[section] || {}).map(([value, clause]) => ({
      value,
      label: clause.title,
    }));

  const markdown = useMemo(() => buildMarkdown(state, catalog), [state, catalog]);
  const fileSlug = useMemo(
    () => state.projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "term-sheet",
    [state.projectTitle]
  );

  const stats = useMemo(() => {
    const totalSources = state.sources.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    const totalUses = state.uses.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
    return {
      clausesSelected:
        state.pricingKeys.length +
        state.covenantKeys.length +
        state.securityKeys.length +
        state.cpKeys.length +
        state.offtakeKeys.length,
      bindingCount: state.bindingKeys.length,
      totalSources,
      totalUses,
    };
  }, [state]);

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

  const presetOptions = [{ value: "custom", label: "Custom / Autosaved" }, ...presets.map((preset) => ({ value: preset.id, label: preset.label }))];

  return (
    <main className="min-h-screen bg-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <header className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold text-indigo-600">Metals Term Sheet Studio</p>
          <h1 className="text-3xl font-semibold text-slate-900">Deal Composer</h1>
          <p className="text-slate-600 max-w-3xl">
            Inspired by best-in-class tools like Wilson Sonsini’s venture generators, this workspace keeps your parameters, clause picks, and
            formatting in sync. Autosave restores unfinished drafts, and presets let you jump between reference deals instantly.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[430px_1fr] items-start">
          <div className="space-y-6">
            <SectionCard title="Presets & Autosave" description="Load a precedent or continue where you left off.">
              <div className="grid gap-4">
                <SingleSelect
                  label="Deal Preset"
                  value={selectedPreset}
                  options={presetOptions}
                  onChange={(id) => {
                    if (id === "custom") {
                      setSelectedPreset("custom");
                      return;
                    }
                    applyPreset(id);
                  }}
                />
                <div className="flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => applyPreset(selectedPreset)}
                    disabled={!presets.find((preset) => preset.id === selectedPreset)}
                    className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-700 disabled:opacity-40"
                  >
                    Reload preset
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefault}
                    className="rounded-xl border border-slate-300 px-3 py-2 font-semibold text-slate-700"
                  >
                    Reset to default
                  </button>
                  <span className="text-slate-400 self-center">Autosaves locally every edit</span>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Letter Header" description="Confidentiality lines, address block, summary intro">
              <div className="space-y-4">
                <InputField label="Confidentiality Line" value={state.headerConfidentiality} onChange={(value) => mutateState((prev) => ({ ...prev, headerConfidentiality: value }))} />
                <InputField label="Subject Line" value={state.headerSubject} onChange={(value) => mutateState((prev) => ({ ...prev, headerSubject: value }))} />
                <TextAreaField label="Addressee Lines" value={state.addresseeLines.join("\n")} onChange={(text) => updateArrayField("addresseeLines", text)} rows={4} />
                <InputField label="Date" value={state.dateLine} onChange={(value) => mutateState((prev) => ({ ...prev, dateLine: value }))} />
                <InputField label="Project Title" value={state.projectTitle} onChange={(value) => mutateState((prev) => ({ ...prev, projectTitle: value }))} />
                <InputField label="Salutation" value={state.salutation} onChange={(value) => mutateState((prev) => ({ ...prev, salutation: value }))} />
                <TextAreaField label="Summary" value={state.summaryIntro} onChange={(value) => mutateState((prev) => ({ ...prev, summaryIntro: value }))} rows={3} />
              </div>
            </SectionCard>

            <SectionCard title="Project Snapshot" description="Key parties and use of proceeds">
              <div className="space-y-3">
                <InputField label="Sponsor" value={state.projectOverview.sponsor} onChange={(value) => mutateState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, sponsor: value } }))} />
                <InputField label="Project" value={state.projectOverview.project} onChange={(value) => mutateState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, project: value } }))} />
                <InputField label="Facility" value={state.projectOverview.facility} onChange={(value) => mutateState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, facility: value } }))} />
                <InputField label="Use of Proceeds" value={state.projectOverview.use_of_proceeds} onChange={(value) => mutateState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, use_of_proceeds: value } }))} />
                <InputField label="Draw Sequence" value={state.projectOverview.draw_sequence} onChange={(value) => mutateState((prev) => ({ ...prev, projectOverview: { ...prev.projectOverview, draw_sequence: value } }))} />
              </div>
            </SectionCard>

            <SectionCard title="Funding Plan" description="Sources & uses with totals auto-calculated">
              <FundingEditor title="Sources" rows={state.sources} onChange={(index, row) => updateFundingRow("sources", index, row)} onAddRow={() => addFundingRow("sources")} />
              <FundingEditor title="Uses" rows={state.uses} onChange={(index, row) => updateFundingRow("uses", index, row)} onAddRow={() => addFundingRow("uses")} />
            </SectionCard>

            <SectionCard title="Highlights & Clauses" description="Narrative bullets and clause selections">
              <TextAreaField label="Facility Highlights" value={state.facilityHighlights.join("\n")} onChange={(text) => updateArrayField("facilityHighlights", text)} rows={5} />
              <ClauseCheckboxes label="Pricing" options={clauseOptions("pricing")} selected={state.pricingKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, pricingKeys: prev.pricingKeys.includes(value) ? prev.pricingKeys.filter((item) => item !== value) : [...prev.pricingKeys, value] }))} />
              <ClauseCheckboxes label="Covenants" options={clauseOptions("covenants")} selected={state.covenantKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, covenantKeys: prev.covenantKeys.includes(value) ? prev.covenantKeys.filter((item) => item !== value) : [...prev.covenantKeys, value] }))} />
              <ClauseCheckboxes label="Security" options={clauseOptions("security")} selected={state.securityKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, securityKeys: prev.securityKeys.includes(value) ? prev.securityKeys.filter((item) => item !== value) : [...prev.securityKeys, value] }))} />
              <ClauseCheckboxes label="Conditions Precedent" options={clauseOptions("conditions_precedent")} selected={state.cpKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, cpKeys: prev.cpKeys.includes(value) ? prev.cpKeys.filter((item) => item !== value) : [...prev.cpKeys, value] }))} />
              <ClauseCheckboxes label="Offtake" options={clauseOptions("offtake")} selected={state.offtakeKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, offtakeKeys: prev.offtakeKeys.includes(value) ? prev.offtakeKeys.filter((item) => item !== value) : [...prev.offtakeKeys, value] }))} />
              <SingleSelect label="Governing Law" value={state.governingLawKey} options={singleOptions("governing_law")} onChange={(value) => mutateState((prev) => ({ ...prev, governingLawKey: value }))} />
              <SingleSelect label="Disclaimer" value={state.disclaimerKey} options={singleOptions("disclaimers")} onChange={(value) => mutateState((prev) => ({ ...prev, disclaimerKey: value }))} />
              <ClauseCheckboxes label="Binding Sections" options={clauseOptions("binding")} selected={state.bindingKeys} onToggle={(value) => mutateState((prev) => ({ ...prev, bindingKeys: prev.bindingKeys.includes(value) ? prev.bindingKeys.filter((item) => item !== value) : [...prev.bindingKeys, value] }))} />
              <div className="grid gap-3 md:grid-cols-2">
                <InputField label="Closing Signoff" value={state.closing.signoff} onChange={(value) => mutateState((prev) => ({ ...prev, closing: { ...prev.closing, signoff: value } }))} />
                <InputField label="Lender" value={state.closing.lender} onChange={(value) => mutateState((prev) => ({ ...prev, closing: { ...prev.closing, lender: value } }))} />
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4 lg:sticky lg:top-6">
            <div className="flex flex-wrap gap-3 justify-end">
              <button type="button" onClick={downloadMarkdown} className="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Download Markdown
              </button>
              <button type="button" onClick={downloadDocx} disabled={isExporting} className="inline-flex items-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60">
                {isExporting ? "Preparing DOCX…" : "Download DOCX"}
              </button>
            </div>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-600">Live Preview</p>
                  <h2 className="text-xl font-semibold text-slate-900">Formatted Term Sheet</h2>
                </div>
                <p className="text-xs text-slate-500">Markdown → DOCX ready</p>
              </div>
              <article className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
              </article>
            </section>

            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Integrity Checks</h3>
              <dl className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <dt>Total clauses selected</dt>
                  <dd className="font-semibold">{stats.clausesSelected}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Binding sections</dt>
                  <dd className="font-semibold">{stats.bindingCount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Sources (USD m)</dt>
                  <dd className="font-semibold">{stats.totalSources.toFixed(0)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Uses (USD m)</dt>
                  <dd className="font-semibold">{stats.totalUses.toFixed(0)}</dd>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <dt>Autosave status</dt>
                  <dd>{isHydrated ? "Active" : "Syncing"}</dd>
                </div>
              </dl>
              {stats.totalSources !== stats.totalUses && (
                <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  Funding table is unbalanced. Update totals before exporting.
                </p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
