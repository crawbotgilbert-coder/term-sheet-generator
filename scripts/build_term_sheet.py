#!/usr/bin/env python3
"""Assemble a metals term sheet from a deal spec + clause catalog."""

import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader

REPO_ROOT = Path(__file__).resolve().parents[1]
MODULES_PATH = REPO_ROOT / "modules/clauses.yaml"
TEMPLATE_PATH = REPO_ROOT / "templates/term_sheet.md.j2"
OUTPUT_DIR = REPO_ROOT / "outputs"


def load_yaml(path: Path):
    with path.open() as fh:
        return yaml.safe_load(fh)


def get_commit_hash() -> str:
    head = REPO_ROOT / ".git/HEAD"
    if not head.exists():
        return "workspace"
    ref = head.read_text().strip()
    if ref.startswith("ref:"):
        ref_path = REPO_ROOT / ".git" / ref.split()[1]
        return ref_path.read_text().strip()[:7] if ref_path.exists() else "workspace"
    return ref[:7]


def gather_clauses(modules: dict, category: str, keys: list[str]):
    catalog = modules.get(category, {})
    block = []
    for key in keys or []:
        clause = catalog.get(key)
        if not clause:
            block.append({"title": f"[{key} not found]", "body": ""})
            continue
        block.append({"title": clause.get("title", key), "body": clause.get("body", "")})
    return block


def compute_funding_table(table_data: dict):
    sources = table_data.get("sources", [])
    uses = table_data.get("uses", [])
    sources_total = sum(item.get("amount", 0) for item in sources)
    uses_total = sum(item.get("amount", 0) for item in uses)
    max_rows = max(len(sources), len(uses))
    rows = []
    for idx in range(max_rows):
        rows.append(
            {
                "source": sources[idx] if idx < len(sources) else {},
                "use": uses[idx] if idx < len(uses) else {},
            }
        )
    return {
        "rows": rows,
        "sources_total": sources_total,
        "uses_total": uses_total,
    }


def build_context(deal: dict, modules: dict):
    return {
        "header": deal.get("header", {}),
        "addressee": deal.get("addressee", {}),
        "project_title": deal.get("project_title"),
        "salutation": deal.get("salutation"),
        "summary_intro": deal.get("summary_intro"),
        "project_overview": deal.get("project_overview", {}),
        "funding_table": compute_funding_table(deal.get("funding_table", {})),
        "facility_highlights": deal.get("facility_highlights", []),
        "pricing_clauses": gather_clauses(modules, "pricing", deal.get("pricing_clauses", [])),
        "covenant_clauses": gather_clauses(modules, "covenants", deal.get("covenant_clauses", [])),
        "security_clauses": gather_clauses(modules, "security", deal.get("security_clauses", [])),
        "cp_clauses": gather_clauses(modules, "conditions_precedent", deal.get("cp_clauses", [])),
        "offtake_clauses": gather_clauses(modules, "offtake", deal.get("offtake_clauses", [])),
        "governing_law": gather_clauses(modules, "governing_law", [deal.get("governing_law_clause")]),
        "disclaimer": gather_clauses(modules, "disclaimers", [deal.get("disclaimer_clause")]),
        "binding_sections": gather_clauses(modules, "binding", deal.get("binding_clauses", [])),
        "closing_block": deal.get("closing_block", {}),
        "commit_sha": get_commit_hash(),
    }


def render_markdown(context: dict):
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_PATH.parent)), trim_blocks=True, lstrip_blocks=True)
    template = env.get_template(TEMPLATE_PATH.name)
    return template.render(**context)


def slugify(value: str) -> str:
    import re

    if not value:
        return "term-sheet"
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower())
    return slug.strip("-") or "term-sheet"


def write_outputs(markdown_body: str, slug: str):
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe_name = slugify(slug)
    timestamp = dt.datetime.now().strftime("%Y%m%d-%H%M")
    md_path = OUTPUT_DIR / f"{safe_name}-{timestamp}.md"
    html_path = OUTPUT_DIR / f"{safe_name}-{timestamp}.html"
    md_path.write_text(markdown_body)
    html = markdown.markdown(markdown_body, extensions=["tables", "fenced_code"])
    html_path.write_text(html)
    return md_path, html_path


def checksum(path: Path) -> str:
    sha = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(8192), b""):
            sha.update(chunk)
    return sha.hexdigest()


def main():
    parser = argparse.ArgumentParser(description="Build a term sheet from a deal spec")
    parser.add_argument("deal_file", type=Path, help="Path to deal YAML/JSON")
    args = parser.parse_args()

    deal = load_yaml(args.deal_file)
    modules = load_yaml(MODULES_PATH)
    context = build_context(deal, modules)

    markdown_body = render_markdown(context)
    slug = deal.get("project_title", "term-sheet")
    md_path, html_path = write_outputs(markdown_body, slug)

    summary = {
        "project": deal.get("project_title"),
        "markdown": str(md_path),
        "html": str(html_path),
        "markdown_sha": checksum(md_path),
        "html_sha": checksum(html_path),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
