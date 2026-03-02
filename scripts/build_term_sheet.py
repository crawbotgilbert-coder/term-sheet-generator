#!/usr/bin/env python3
"""Assemble a term sheet from a deal spec + clause catalog."""

import argparse
import datetime as dt
import hashlib
import json
import os
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


def format_overview_fields(section_meta: dict, deal: dict):
    fields = []
    for field in section_meta.get("fields", []):
        template = field.get("template", "{value}")
        value = template.format(**deal)
        fields.append({"label": field.get("label", field.get("key")), "value": value})
    return fields


def fill_clauses(section_meta: dict, deal: dict):
    filled = []
    for clause in section_meta.get("clauses", []):
        body_template = clause.get("body", "")
        try:
            body = body_template.format(**deal)
        except KeyError as exc:
            missing = exc.args[0]
            body = f"[MISSING: {missing}] {body_template}"
        filled.append({"label": clause.get("label", clause.get("id")), "body": body})
    return filled


def get_commit_hash():
    head = REPO_ROOT / ".git/HEAD"
    if not head.exists():
        return "workspace"
    ref = head.read_text().strip()
    if ref.startswith("ref:"):
        ref_path = REPO_ROOT / ".git" / ref.split()[1]
        return ref_path.read_text().strip()[:7] if ref_path.exists() else "workspace"
    return ref[:7]


def render_template(deal: dict, modules: dict):
    env = Environment(loader=FileSystemLoader(str(TEMPLATE_PATH.parent)))
    template = env.get_template(TEMPLATE_PATH.name)
    sections = modules["sections"]
    return template.render(
        deal=deal,
        overview_fields=format_overview_fields(sections["transaction-overview"], deal),
        pricing_clauses=fill_clauses(sections["pricing"], deal),
        covenant_clauses=fill_clauses(sections["covenants"], deal),
        security_clauses=fill_clauses(sections["security"], deal),
        eod_clauses=fill_clauses(sections["events-of-default"], deal),
        commit_sha=get_commit_hash(),
    )


def write_outputs(markdown_body: str, deal_name: str):
    OUTPUT_DIR.mkdir(exist_ok=True)
    safe_name = deal_name.lower().replace(" ", "-")
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

    markdown_body = render_template(deal, modules)
    md_path, html_path = write_outputs(markdown_body, deal["borrower_name"])

    summary = {
        "deal": deal["borrower_name"],
        "markdown": str(md_path),
        "html": str(html_path),
        "markdown_sha": checksum(md_path),
        "html_sha": checksum(html_path),
    }
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
