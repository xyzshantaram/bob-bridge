import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { discordTextToIrc, ircMsgToDiscord } from "../bridge/transforms.ts";

Deno.test("ircMsgToDiscord resolves quoted nicknames and style markers", () => {
  assertEquals(
    ircMsgToDiscord(
      { "Alice Example": "123" },
      'hi @"Alice Example" \x02bold\x02 \x1Ditalics\x1D \x1Estrike\x1E',
    ),
    "hi <@123> **bold** _italics_ ~~strike~~",
  );
});

Deno.test("discordTextToIrc resolves mentions and markdown markers", () => {
  assertEquals(
    discordTextToIrc(
      "hello <@1> in <#2> for <@&3>\n**bold** *italics* ~~strike~~",
      {
        channelNames: ["general"],
        userNames: ["alice"],
        roleNames: new Map([[3n, "mods"]]),
      },
    ),
    "hello @alice in #general for @[Role](mods) / \x02bold\x02 \x1Ditalics\x1D \x1Estrike\x1E",
  );
});
