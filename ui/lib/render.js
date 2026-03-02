export function fillTemplate(template, values) {
  return template.replace(/\{(.*?)\}/g, (_, key) => {
    const value = values[key.trim()];
    return value !== undefined && value !== null ? value : `[missing ${key}]`;
  });
}

export function buildMarkdown(values, catalog) {
  const overview = catalog.overviewFields
    .map((field) => `- **${field.label}:** ${fillTemplate(field.template, values)}`)
    .join('\n');

  const block = (title, clauses) => {
    const body = clauses
      .map((clause) => `- **${clause.label}:** ${fillTemplate(clause.body, values)}`)
      .join('\n');
    return `## ${title}\n${body}`;
  };

  return `# Term Sheet — ${values.borrower_name || 'Borrower'} / ${values.facility_type || 'Facility'}\n\n` +
    `**Date:** ${values.date || new Date().toISOString().split('T')[0]}  \n` +
    `**Prepared by:** Metals & Mining Investments\n\n` +
    `## 1. Transaction Overview\n${overview}\n\n` +
    `${block('2. Pricing & Economics', catalog.pricing)}\n\n` +
    `${block('3. Covenants', catalog.covenants)}\n\n` +
    `${block('4. Security Package', catalog.security)}\n\n` +
    `${block('5. Events of Default', catalog.eventsOfDefault)}\n\n` +
    `---\n_Built with term-sheet-generator UI_\n`;
}
