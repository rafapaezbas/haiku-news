# haiku-news

Top Hacker News stories, distilled to 17 syllables.

Fetches the front page from the Hacker News API and asks a local Llama 3.2 1B model
to write a haiku about each story. Everything runs on-device — no API keys, no
inference calls leaving your machine.

## Run

```sh
npm install
bare index.mjs
```

The first run downloads `Llama-3.2-1B-Instruct-Q4_0.gguf` and shows a progress bar:

```
Downloading model  ██████████████░░░░░░░░░░░░  35%
```

Later runs skip straight to generating.

## Build a standalone binary

```sh
npm run make
```

Produces `out/make/haiku-news` via `bare-build --standalone`. On macOS, set
`MAC_CODESIGN_IDENTITY` to sign, and `KEYCHAIN_PROFILE` to also notarize.

## How it works

`index.mjs` is the whole program:

1. `loadModel` pulls the model through the [QVAC SDK](https://qvac.tether.io)
   model registry, reporting download progress to `printProgress`.
2. `topItems(5)` reads the top stories from the Hacker News Firebase API.
3. Each story title becomes a prompt; the five completions stream in parallel and
   are accumulated token by token.
4. `unloadModel` frees the weights, then `printHaikus` renders the results.

## Development

```sh
npm run lint     # prettier --check + lunte
npm run format   # prettier --write + lunte --fix
```
