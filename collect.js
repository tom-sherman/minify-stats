const fs = require('fs')
const { promisify } = require('util')
const { spawn } = require('child_process')
const { Worker } = require('worker_threads')
const Comlink = require('comlink/dist/umd/comlink')
const nodeEndpoint = require('comlink/dist/umd/node-adapter')
const glob = promisify(require('glob'))
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

const worker = new Worker('./worker.js')
worker.setMaxListeners(Infinity)
const minifyWorker = Comlink.wrap(nodeEndpoint(
  worker
))

const getGzipSize = text => new Promise(resolve => {
  const gzip = spawn('gzip')
  const wc = spawn('wc', ['--bytes'])

  gzip.on('close', () => wc.stdin.end())
  gzip.stdout.on('data', data => wc.stdin.write(data))
  wc.stdout.on('data', data => resolve(parseInt(data)))
  gzip.stdin.write(text)
  gzip.stdin.end()
})

const getBrotliSize = text => new Promise(resolve => {
  const brotli = spawn('brotli')
  const wc = spawn('wc', ['--bytes'])

  brotli.on('close', () => wc.stdin.end())
  brotli.stdout.on('data', data => wc.stdin.write(data))
  wc.stdout.on('data', data => resolve(parseInt(data)))
  brotli.stdin.write(text)
  brotli.stdin.end()
})

const getSize = text => Promise.resolve(Buffer.byteLength(text, 'utf8'))

const getMinifiedText = async text => {
  const minifiedResult = await minifyWorker.minify(text)
  return minifiedResult.error ? '' : minifiedResult.code
}

const getAllSizes = async file => {
  const text = await readFile(file, { encoding: 'utf8' })
  const minifiedText = await getMinifiedText(text)
  const [ brotli, gzip, original, minified, minifiedGzip, minifiedBrotli ] = await Promise.all([
    getBrotliSize(text),
    getGzipSize(text),
    getSize(text),
    getSize(minifiedText),
    getGzipSize(minifiedText),
    getBrotliSize(minifiedText),
  ])

  console.log(`Done ${file}`)

  return { file, original, gzip, brotli, minified, minifiedGzip, minifiedBrotli }
}

;(async () => {
  const files = await glob(process.argv[2])
  const results = await Promise.all(files.map(file => getAllSizes(file)))

  let csv = 'original,gzip,brotli,minified,minifiedGzip,minifiedBrotli\n'

  for (const result of results) {
    csv += `${result.original},${result.gzip},${result.brotli},${result.minified},${result.minifiedGzip},${result.minifiedBrotli}\n`
  }

  await writeFile('results.csv', csv)

  console.table(results)
  process.exit()
})()
