import { NextResponse } from "next/server";
import htmlToDocx from "html-to-docx";
import { marked } from "marked";

export async function POST(request) {
  try {
    const { markdown, fileName } = await request.json();
    if (!markdown) {
      return NextResponse.json({ error: "Missing markdown" }, { status: 400 });
    }

    const html = marked.parse(markdown);
    const buffer = await htmlToDocx(`<html><body>${html}</body></html>`, {
      table: { row: { cantSplit: true } },
      pageNumber: true,
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName || "term-sheet"}.docx"`,
      },
    });
  } catch (error) {
    console.error("DOCX export failed", error);
    return NextResponse.json({ error: "Failed to generate DOCX" }, { status: 500 });
  }
}
