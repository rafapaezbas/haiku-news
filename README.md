# haiku-news

Top Hacker News stories, distilled to 17 syllables.

Fetches the front page from the Hacker News API and asks a local Llama 3.2 1B model
to write a haiku about each story. Everything runs on-device — no API keys, no
inference calls leaving your machine.

```
user@MacBookAir ~ % haiku-news
parse: load the model metadata from disk file.
initFromConfig: load the model from disk file and apply lora adapter, if any.
Herding syllables into lines...

   ▄▄▄  ▄▄▄    ▄▄     ▄▄▄     ▄▄▄  ▄▄▄
  █▀██  ██     ██▄   ██▀     █▀██  ██
    ██  ██     ███▄  ██        ██  ██         ▀▀ ▄▄
    ██████     ██ ▀█▄██        ██████   ▄▀▀█▄ ██ ██ ▄█▀ ██ ██ ▄██▀█
    ██  ██     ██   ▀██        ██  ██   ▄█▀██ ██ ████   ██ ██ ▀███▄
  ▀██▀  ▀██▄ ▀██▀    ██      ▀██▀  ▀██▄▄▀█▄██▄██▄██ ▀█▄▄▀██▀██▄▄██▀

Top Hacker News stories, distilled to 17 syllables

# 1
Tailscale's frantic dance
Face AI intrusion fails
Shadows claim the night

https://tailscale.com/blog/hugging-face-intrusion
════════════════════════════════════════════════════════════════

# 2
Silent metal ride
Stopping at each floor with grace
Secrets in the lift

https://john.fun/elevators
════════════════════════════════════════════════════════════════

# 3
Digital realm's dark
Shadows dance upon my screen
Moonlight in the code

https://github.com/yc-software/qm
════════════════════════════════════════════════════════════════

# 4
Container types flow
Generic collection delight
Creativity shines

https://github.com/golang/go/issues/80590
════════════════════════════════════════════════════════════════

# 5
Blurred edges of life
Darkness creeps with hesitant steps
Lost in twisted path

https://lcamtuf.substack.com/p/severance
════════════════════════════════════════════════════════════════
```

## Run

```sh
npm i -g pear
pear install pear://n848ydyj6escctzngf8spq4o6hs78c7ku95bogbmq9amhxptzz4y
haiku-news
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
