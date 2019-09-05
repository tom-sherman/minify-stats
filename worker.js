const { parentPort } = require('worker_threads')
const Comlink = require('comlink/dist/umd/comlink')
const nodeEndpoint = require('comlink/dist/umd/node-adapter')
const Terser = require('terser')

const api = {
  minify(text) {
    return Terser.minify(text)
  }
}

Comlink.expose(api, nodeEndpoint(parentPort))
