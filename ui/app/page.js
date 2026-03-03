import fs from "fs";
import path from "path";
import yaml from "yaml";
import TermSheetBuilder from "../components/TermSheetBuilder";

export const dynamic = "force-static";

export default function Page() {
  const dataDir = path.join(process.cwd(), "data");
  const clausesPath = path.join(dataDir, "clauses.yaml");
  const presetsPath = path.join(dataDir, "presets.json");

  const clausesFile = fs.readFileSync(clausesPath, "utf8");
  const catalog = yaml.parse(clausesFile);
  const presets = JSON.parse(fs.readFileSync(presetsPath, "utf8"));

  return <TermSheetBuilder catalog={catalog} presets={presets} />;
}
