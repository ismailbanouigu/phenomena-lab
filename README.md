# Phenomena Lab

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/main/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Phenomena Lab turns any science topic into an interactive systems explanation. A Pollinations model produces a compact structured map; the browser renders it as clickable concepts, a scene timeline, and a cause-and-effect knowledge check.

Built for [Pollinations Quest #19181](https://github.com/pollinations/pollinations/issues/19181).

## What visitors can do

- Enter any scientific phenomenon and choose an audience and explanatory lens.
- Scrub through four causal or temporal scenes.
- Click six system nodes to inspect their role, observable signal, and mental model.
- See relationships highlight as the phenomenon changes.
- Answer prediction questions with immediate explanations.
- Explore a complete offline coral-bleaching demo without signing in.

## Bring Your Own Pollen

The official `polli-connect` component grants the app a temporary, revocable key scoped to `openai/gpt-5.4-nano`, capped at 2 Pollen and expiring after seven days. The visitor's topic is sent only after they connect and press Generate. No prompt, key, or explorer is stored.

## Run locally

Serve the `dist/` directory with any static server. The production origin must be registered on the Pollinations App Key.

```bash
npx serve dist
```

## Test

```bash
npm test
```

AI-generated science explanations can be incomplete or wrong. Phenomena Lab is an intuition builder, not a substitute for primary sources or professional advice.

## License

MIT

