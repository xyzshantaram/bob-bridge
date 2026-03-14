import {
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.203.0/assert/mod.ts";
import {
  chunk,
  formatAttachmentForIrc,
  formatEmbedForIrc,
  formatStickerForIrc,
  getDiscordMediaLines,
  getQuoteStr,
  getReactionLabel,
  getThreadStr,
  truncate,
} from "../bridge/formatting.ts";

Deno.test("chunk splits long strings using the requested chunk size", () => {
  assertEquals(chunk("abcdefghij", 4), ["abcd", "efgh", "ij"]);
});

Deno.test("chunk returns an empty list for empty input", () => {
  assertEquals(chunk("", 4), []);
});

Deno.test("truncate leaves short strings unchanged", () => {
  assertEquals(truncate("short", 10), "short");
});

Deno.test("truncate appends an ellipsis to long strings", () => {
  assertEquals(truncate("abcdefgh", 5), "abcde…");
});

Deno.test("quote and thread helpers reuse truncation limits", () => {
  assertEquals(
    getQuoteStr("abcdefghijklmnopqrstuvwxyz"),
    " [> abcdefghijklmnopqrstuvwxy…]",
  );
  assertEquals(getThreadStr("12345678901234567890"), " [in 123456789012345…]");
});

Deno.test("formatAttachmentForIrc includes file metadata when available", () => {
  assertEquals(
    formatAttachmentForIrc({
      filename: "cat.png",
      contentType: "image/png",
      url: "https://example.test/cat.png",
    }),
    "[attachment] cat.png (image/png) https://example.test/cat.png",
  );
});

Deno.test("formatEmbedForIrc normalizes whitespace and preserves URL", () => {
  const line = formatEmbedForIrc({
    title: "Release",
    description: "Line one\n\nLine two",
    url: "https://example.test/post",
  });

  assertStringIncludes(line, "[embed] - Release");
  assertStringIncludes(line, "Line one Line two");
  assertStringIncludes(line, "https://example.test/post");
});

Deno.test("formatStickerForIrc falls back when sticker name is missing", () => {
  assertEquals(formatStickerForIrc({}), "[sticker] Sticker");
});

Deno.test("getDiscordMediaLines emits attachments, embeds, and stickers", () => {
  assertEquals(
    getDiscordMediaLines({
      attachments: [{
        filename: "cat.png",
        url: "https://example.test/cat.png",
      }],
      embeds: [{ title: "Release notes" }],
      stickerItems: [{ name: "party parrot" }],
    }, "alice"),
    [
      "<alice> [attachment] cat.png https://example.test/cat.png",
      "<alice> [embed] - Release notes",
      "<alice> [sticker] party parrot",
    ],
  );
});

Deno.test("getReactionLabel prefers custom emoji names and falls back sanely", () => {
  assertEquals(
    getReactionLabel({ id: 1n, name: "party_parrot" }),
    ":party_parrot:",
  );
  assertEquals(getReactionLabel({ name: "🔥" }), "🔥");
  assertEquals(getReactionLabel({}), "an emoji");
});
