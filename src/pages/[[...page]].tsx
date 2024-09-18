import { dangerHTML, type RequestContext } from "brisa";
import fs from "node:fs";
import path from "node:path";
import MarkdownIt from "markdown-it";
import Shikiji from "markdown-it-shikiji";

const md = MarkdownIt();

md.use(
  await Shikiji({
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
  }),
);

const demo = JSON.parse(
  fs.readFileSync(
    path.join(import.meta.dirname, "..", "public", "demo.json"),
    "utf-8",
  ),
);

export default async function Homepage(
  {},
  { route: { params, pathname } }: RequestContext,
) {
  const sections = demo.filter((item: any) => item.id.includes(pathname));

  return (
    <>
      <h1>Example of page {(params?.page as string[])?.join(" / ")}</h1>
      <div>
        {dangerHTML(
          md.render(`\`\`\`json\n${JSON.stringify(sections, null, 2)}\n\`\`\``),
        )}
      </div>
    </>
  );
}

export function prerender() {
  const home = { page: [] };
  return [home,...demo.map((item: any) => ({
    page: item.id.replace(/#.*/g, '').split("/").filter(Boolean),
  }))];
}