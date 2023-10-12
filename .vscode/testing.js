import { Client } from "../../deno-irc/mod.ts"

const client = new Client({
  nick: "BobBridgeBot",
  password: "ThisIsAPassword",
  channels: [["##bob", "burnedoutbastards"]],
  authMethod: "sasl"
})

const send = client.send.bind(client);
client.send = function(...args) {
  send(...args);
  console.log('SEND', args.join("|"));
}

client.on('raw', payload => console.log(payload.source?.name, payload.command || payload.cmd, payload.params));

await client.connect("irc.libera.chat", 6697, true);
