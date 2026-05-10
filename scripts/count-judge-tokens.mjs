import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";

const src = fs.readFileSync("./lib/grading/judgePrompt.ts", "utf8");
const match = src.match(/JUDGE_SYSTEM_PROMPT\s*=\s*`([\s\S]*)`;/);
if (!match) {
  console.error("could not extract JUDGE_SYSTEM_PROMPT from source");
  process.exit(1);
}
const prompt = match[1]
  .replace(/\\`/g, "`")
  .replace(/\\\$/g, "$")
  .replace(/\\\\/g, "\\");

console.log(`chars: ${prompt.length}`);

const client = new Anthropic();
const r = await client.messages.countTokens({
  model: "claude-sonnet-4-6",
  system: prompt,
  messages: [{ role: "user", content: "noop" }],
});
console.log(`tokens (system + 1-token user): ${r.input_tokens}`);
console.log(
  `cache eligibility: Sonnet 4.6 needs >= 2048 tokens; ${r.input_tokens >= 2048 ? "YES" : "NO"}`,
);
