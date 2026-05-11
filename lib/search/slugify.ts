import { slug as githubSlug } from "github-slugger";

// Deterministic, stateless slug. Same input always produces the same
// output, which is what we need so the indexer and the runtime MDX
// renderer can compute matching heading IDs without coordinating state.
//
// Tradeoff: two headings with identical text inside one lesson collide
// on the same ID. The first one in DOM order wins for anchor links.
// We accept this for v1 because (a) it's rare in practice and (b) the
// alternative is shipping a slugger instance across an MDX renderer
// boundary, which doesn't survive React's render model cleanly.
export function slugify(text: string): string {
  return githubSlug(text);
}
