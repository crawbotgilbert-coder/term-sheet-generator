# Term Sheet Generator

A modular toolkit for assembling consistent metals & mining term sheets from reusable building blocks.

## What it does
- Stores every clause, covenant, and formatting snippet as a version-controlled module.
- Takes a simple deal spec (YAML) and stitches together a complete Markdown + DOCX-ready term sheet.
- Runs automatically in CI to validate clause integrity and attach sample outputs.
- Ships with a lightweight web UI (Next.js on Vercel) so you can preview or export clauses without touching the CLI.

## Repository layout
```
modules/            Canonical clause + covenant catalog (YAML)
templates/          Jinja templates for Markdown / HTML rendering
scripts/            Build + QA tooling (Python)
data/deals/         Sample deal specs
outputs/            Generated docs (ignored by git)
ui/                 Next.js single-page UI for browser-based generation
.github/workflows/  CI to lint clauses + build sample outputs
```

## Quick start
```bash
# Optional: set up virtualenv first
pip install -r requirements.txt
python scripts/build_term_sheet.py data/deals/sample_deal.yaml
```
Outputs land in `outputs/` as Markdown and HTML (ready for Pandoc/Word conversion).

## Web UI
The `ui/` directory contains a Next.js app that mirrors the same clause library. Deploy it on Vercel with:
```bash
cd ui
npm install
npm run dev   # local preview
```
Publishing happens automatically via Vercel once the repo is linked.

## Next steps
- Add more clause modules under `modules/clauses/`
- Drop new deal presets in `data/deals/`
- Extend the Python builder to export native DOCX (hooks ready)
- Use GitHub issues to capture clause change requests / approvals
