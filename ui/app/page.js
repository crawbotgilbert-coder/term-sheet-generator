import fs from "fs";
import path from "path";
import yaml from "yaml";
import TermSheetBuilder from "../components/TermSheetBuilder";

export const dynamic = "force-static";

export default function Page() {
  const clausesPath = path.join(process.cwd(), "data", "clauses.yaml");
  const file = fs.readFileSync(clausesPath, "utf8");
  const catalog = yaml.parse(file);
  return <TermSheetBuilder catalog={catalog} />;
}
