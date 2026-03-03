function formatTableSection(sources = [], uses = []) {
  const maxRows = Math.max(sources.length, uses.length, 1);
  const lines = ["| Sources | Amount (USD m) | Uses | Amount (USD m) |", "| --- | ---: | --- | ---: |"];
  for (let i = 0; i < maxRows; i += 1) {
    const source = sources[i] || {};
    const use = uses[i] || {};
    lines.push(`| ${source.name ?? ""} | ${source.amount ?? ""} | ${use.name ?? ""} | ${use.amount ?? ""} |`);
  }
  const sourcesTotal = sources.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const usesTotal = uses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  lines.push(`| **Total** | **${sourcesTotal.toFixed(0)}** | **Total** | **${usesTotal.toFixed(0)}** |`);
  return lines.join("\n");
}

function formatClauseBlock(title, clauses = []) {
  if (!clauses.length) return "";
  const lines = [`## ${title}`];
  clauses.forEach((clause) => {
    if (!clause) return;
    lines.push(`**${clause.title}**  `);
    lines.push(`${clause.body}`);
    lines.push("");
  });
  return lines.join("\n");
}

function collectClauses(catalogSection = {}, keys = []) {
  return keys
    .map((key) => catalogSection[key])
    .filter(Boolean);
}

export function buildMarkdown(state, catalog) {
  const addresseeLines = state.addresseeLines.filter(Boolean);
  const facilityHighlights = state.facilityHighlights.filter(Boolean);
  const projectOverview = state.projectOverview;
  const lines = [];

  lines.push(state.headerConfidentiality);
  lines.push(state.headerSubject);
  lines.push("");
  addresseeLines.forEach((line) => lines.push(`${line}  `));
  lines.push(state.dateLine);
  lines.push("");
  lines.push(state.projectTitle);
  lines.push("");
  lines.push(state.salutation);
  lines.push("");
  lines.push(state.summaryIntro);
  lines.push("");
  lines.push("## Section 1. Parties & Scope");
  lines.push(`- **Sponsor:** ${projectOverview.sponsor}`);
  lines.push(`- **Project:** ${projectOverview.project}`);
  lines.push(`- **Facility:** ${projectOverview.facility}`);
  lines.push(`- **Use of Proceeds:** ${projectOverview.use_of_proceeds}`);
  lines.push(`- **Draw Sequence:** ${projectOverview.draw_sequence}`);
  lines.push("");
  lines.push("## Section 2. Funding Plan");
  lines.push(formatTableSection(state.sources, state.uses));
  lines.push("");
  lines.push("## Section 3. Facility Highlights");
  facilityHighlights.forEach((item) => lines.push(`- ${item}`));
  lines.push("");

  lines.push(
    formatClauseBlock(
      "Section 4. Pricing & Fees",
      collectClauses(catalog.pricing, state.pricingKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Section 5. Covenants & Undertakings",
      collectClauses(catalog.covenants, state.covenantKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Section 6. Security Package",
      collectClauses(catalog.security, state.securityKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Section 7. Conditions Precedent",
      collectClauses(catalog.conditions_precedent, state.cpKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Section 8. Offtake Integration",
      collectClauses(catalog.offtake, state.offtakeKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Section 9. Governing Law & Jurisdiction",
      collectClauses(catalog.governing_law, [state.governingLawKey])
    )
  );
  lines.push(
    formatClauseBlock(
      "Binding Provisions",
      collectClauses(catalog.binding, state.bindingKeys)
    )
  );
  lines.push(
    formatClauseBlock(
      "Disclaimer",
      collectClauses(catalog.disclaimers, [state.disclaimerKey])
    )
  );

  lines.push(`${state.closing.signoff}  `);
  lines.push(state.closing.lender);
  lines.push("");
  lines.push("---");
  lines.push(`_Built with term-sheet-generator UI_`);
  return lines.filter(Boolean).join("\n");
}
