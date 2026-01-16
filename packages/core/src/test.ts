import { parseMarkdown } from "./parse.js";

const md = `# Title

This is a paragraph.

- Item one
- Item two
`;

const result = parseMarkdown(md);
console.log(result.textNodes);

