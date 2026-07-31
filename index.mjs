import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import bareProcess from 'bare-process'
import os from 'bare-os'
import path from 'bare-path'
import PearRuntimeUpdater from 'pear-runtime-updater'
import pkg from './package.json'
import { plugins, LLAMA_3_2_1B_INST_Q4_0 } from '@qvac/sdk'
import { llmPlugin } from '@qvac/sdk/llamacpp-completion/plugin'
import https from 'bare-https'
import fetch from 'bare-fetch'
import { isWindows, isLinux } from 'which-runtime'

global.process = bareProcess

const store = new Corestore(path.join(storage(), 'pear-runtime/corestore'))
const swarm = new Hyperswarm()

swarm.on('connection', (c) => {
  store.replicate(c)
})

const updater = new PearRuntimeUpdater({
  dir: storage(),
  store,
  version: pkg.version,
  app: os.execPath(),
  name: pkg.name,
  upgrade: pkg.upgrade
})

await store.ready()
await updater.ready()
swarm.join(updater.drive.core.discoveryKey)

const { loadModel, completion, unloadModel } = plugins([llmPlugin])

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: 'llm',
  onProgress: ({ percentage }) => printProgress(percentage)
})

const phrases = [
  'Composing haikus',
  'Counting syllables',
  'Consulting the muse',
  'Distilling headlines into verse',
  'Arranging seventeen syllables',
  'Meditating on the news',
  'Sharpening the digital brush',
  'Whispering to the model',
  'Folding words like origami',
  'Brewing poetic tea',
  'Watching cherry blossoms fall',
  'Contemplating the void (and HN)',
  'Summoning inner Bashō',
  'Herding syllables into lines',
  'Waiting for inspiration to strike',
  'Polishing tiny poems',
  'Translating tech into zen',
  'Listening to the mountain stream',
  'Pondering impermanence of startups',
  'Letting the tokens flow'
]

console.log(`${phrases[Math.floor(Math.random() * phrases.length)]}...`)

const news = await topItems(5)

const result = await Promise.all(
  news.map(async (e) => {
    let haiku = ''
    const history = [
      {
        role: 'user',
        content: `Write a haiku about ${e.title}, get creative, even if you dont have information about the topic, just create something, it doesn't have to be precise just a simple haiku.`
      }
    ]
    const response = completion({ modelId, history, stream: true })
    for await (const token of response.tokenStream) {
      haiku += token
    }
    return { haiku, url: e.url }
  })
)

await unloadModel({ modelId, autoClose: true })

printHaikus(result)

async function top() {
  const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty')
  return response.json()
}

async function topItems(n) {
  const items = await top()
  return Promise.all(
    items.slice(0, n).map(async (e) => {
      const response = await fetch(
        `https://hacker-news.firebaseio.com/v0/item/${e}.json?print=pretty`
      )
      return response.json()
    })
  )
}

function printProgress(percentage) {
  const width = 40
  const filled = Math.round((percentage / 100) * width)
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled)
  if (percentage > 99) {
    process.stdout.write(`\r`)
    return
  }
  process.stdout.write(`\rDownloading model  ${bar} ${percentage.toFixed(0).padStart(3)}%`)
}

function printHaikus(results) {
  const width = 64
  const line = '═'.repeat(width)
  const banner = `
   ▄▄▄  ▄▄▄    ▄▄     ▄▄▄     ▄▄▄  ▄▄▄
  █▀██  ██     ██▄   ██▀     █▀██  ██
    ██  ██     ███▄  ██        ██  ██         ▀▀ ▄▄
    ██████     ██ ▀█▄██        ██████   ▄▀▀█▄ ██ ██ ▄█▀ ██ ██ ▄██▀█
    ██  ██     ██   ▀██        ██  ██   ▄█▀██ ██ ████   ██ ██ ▀███▄
  ▀██▀  ▀██▄ ▀██▀    ██      ▀██▀  ▀██▄▄▀█▄██▄██▄██ ▀█▄▄▀██▀██▄▄██▀

Top Hacker News stories, distilled to 17 syllables
`
  console.log(banner)
  results.forEach(({ haiku, url }, i) => {
    console.log('#', i + 1)
    haiku
      .trim()
      .split('\n')
      .filter(Boolean)
      .forEach((l) => console.log(l))
    console.log('')
    console.log(`${url}`)
    console.log(line)
    console.log('')
  })
  console.log()
}

function storage() {
  if (isWindows) return path.join(os.homedir(), 'AppData', 'Roaming', 'haiku-news')
  if (isLinux) return path.join(os.homedir(), '.config', 'haiku-news')
  return path.join(os.homedir(), 'Library', 'Application Support', 'haiku-news')
}
