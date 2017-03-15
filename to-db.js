const Promise = require('bluebird')
const fs = require('fs')
const log = require('debug')('bnc:freshdesk:to-db')
const readFile = Promise.promisify(fs.readFile)
const monk = require('monk')
const db = monk(process.env.MONGODB_URI)
const Tickets = db.get('Tickets')

const jsonFile = path => new Promise((resolve, reject) => readFile(path)
  .then(contents => resolve(JSON.parse(contents)))
  .catch(reject)
)

const extractStatus = s => {
  const m = s.match(/status to .*/)[0].replace('status to ', '')
  const commaSplit = m.split(',')
  if (commaSplit.length > 1) {
    return commaSplit[0]
  }
  return m
}

const parse = (data, n) => ({
  id: n,
  updates: data.details.map((d, idx) => d.includes('status to')
    ? ({
        date: new Date(Date.parse(data.authorMailDetails[idx].match(/(\w+), ([0-9]+) (\w+)/)[0])),
        status: extractStatus(d)
      })
    : false
  ).filter(u => u)
})

const uploadN = n => new Promise((resolve, reject) => {
  jsonFile(`./dump/${n}.json`).then(data => {
    const p = parse(data, n)

    return Tickets.update(
      {id: p.id},
      {$set: p},
      {upsert: true}
    )
    .then(resolve)
    .catch(reject)
  }).catch(reject)
})

const go = async () => {
  const files = fs.readdirSync('./dump')
  files.forEach(async (f) => {
    const n = f.split('.')[0]
    const _ = await uploadN(n)
    log('%d: %j', n, _)
  })
}

go()
