import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { buildDiscordMessageLine, buildReactionLine } from "../bridge/relay.ts";

Deno.test("buildDiscordMessageLine includes thread and quote context", () => {
  assertEquals(
    buildDiscordMessageLine(
      "alice",
      "hello world",
      "bridge thread",
      "this is a quoted message that is too long",
    ),
    "<alice> [in bridge thread] [> this is a quoted message …] hello world",
  );
});

Deno.test("buildDiscordMessageLine omits empty optional context", () => {
  assertEquals(
    buildDiscordMessageLine("alice", "hello world", "", ""),
    "<alice> hello world",
  );
});

Deno.test("buildReactionLine formats reaction activity for IRC", () => {
  assertEquals(
    buildReactionLine(
      "alice",
      "reacted with",
      { id: 1n, name: "party_parrot" },
      "quoted message goes here",
      "thread",
    ),
    "*** alice reacted with :party_parrot: [in thread] [> quoted message goes here]",
  );
});
