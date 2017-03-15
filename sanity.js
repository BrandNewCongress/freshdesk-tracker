const Promise = require('bluebird')
const fs = require('fs')
const log = require('debug')('bnc:freshdesk:sanity')
const readFile = Promise.promisify(fs.readFile)

const checkN = n => new Promise((resolve, reject) => Promise.all([
  readFile(`./dump/${n}.json`),
  readFile(`./old-dump/${n}.json`)
]).then(([newFile, oldFile]) => {
  const newJson = JSON.parse(newFile)
  const oldJson = JSON.parse(oldFile)

  const different = newJson.details.length != oldJson.details.length
  if (different) {
    log(`Difference on ${n}: old (${oldJson.details.length}) vs new (${newJson.details.length})`)
  }

  resolve(different)
}).catch(reject))


const go = async () => {
  const files = fs.readdirSync('./dump')
  files.forEach(async (f) => {
    const n = f.split('.')[0]
    const different = await checkN(n)
  })
}

go()
