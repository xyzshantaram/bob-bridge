# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) and this
project adheres to date-based versioning - and yes, I just made this term up.

## Added 20260314

- Discord reactions are now relayed to IRC.
- Discord attachments, embeds, and stickers are now summarized when relayed to
  IRC.
- `config.json` is now validated on load with clearer startup errors.
- The source tree has been reorganized into `src/app`, `src/bridge`, and
  `src/testing`.
- A committed unit and integration-style Deno test suite now covers formatting,
  transforms, config parsing, resolver behavior, and Discord/IRC handler wiring.

## Added 20241106

- Long messages are chunked and relayed properly instead of getting cut off like
  before.

## Added 20240714

- Message edits are now relayed across the bridge.

## Added 20231015

- Nick changes and QUITs are now relayed across the bridge.

## Added 20231011

- Discord messages using bold, italic, and strike-through styling are now
  converted to IRC control characters
