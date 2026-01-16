import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import { v4 as uuidv4 } from "uuid";

export type TextNode = {
  node_id: string;
  type: string;
  text: string;
};

export type ParsedDocument = {
  tree: unknown;       // keep AST opaque in v1 to avoid mdast typing issues
  textNodes: TextNode[];
};

export function parseMarkdown(markdown: string): ParsedDocument {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdown) as unknown;

  const textNodes: TextNode[] = [];

  visit(tree as any, (node: any) => {
    // We capture human-editable chunks.
    // NOTE: list items usually contain paragraph children; we'll keep v1 simple.
    if (node.type === "heading" || node.type === "paragraph") {
      const text = node.children
        ?.filter((c: any) => typeof c.value === "string")
        .map((c: any) => c.value)
        .join(" ");

      if (text) {
        const id = uuidv4();
        node.data = node.data || {};
        node.data.node_id = id;

        textNodes.push({ node_id: id, type: node.type, text });
      }
    }
  });

  return { tree, textNodes };
}
