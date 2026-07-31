import bareProcess from 'bare-process'
import { plugins, LLAMA_3_2_1B_INST_Q4_0 } from '@qvac/sdk'
import { llmPlugin } from '@qvac/sdk/llamacpp-completion/plugin'
import https from 'bare-https'
import fetch from 'bare-fetch'

global.process = bareProcess
const { loadModel, completion, unloadModel } = plugins([llmPlugin])

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: 'llm',
  onProgress: (progress) => {
    //console.log(progress)
  }
})

const news = await topItems(10)

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
