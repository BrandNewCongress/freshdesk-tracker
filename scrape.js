const log = require('debug')('bnc:freshdesk:scrape')
const Freshdesk = require('freshdesk-api')
const cookie = require('cookie')
const request = require('superagent')
const cheerio = require('cheerio')
const fs = require('fs')

const freshdesk = new Freshdesk(process.env.FRESHDESK_URL, process.env.FRESHDESK_API_KEY)
const rawCookies = require('./cookies')
const localStorage = require('./local-storage')

const cookies = rawCookies.commandList.filter(c => c.name == 'cookie')[0].result
const serialized = cookies.map(c => cookie.serialize(c.name, c.value)).join(';')
const getUrl = url => request.get(url).set('Cookie', serialized)

const getTicketHistory = n => new Promise((resolve, reject) => {
  getUrl('https://brandnewcongress.freshdesk.com/helpdesk/tickets/' + n + '/activities')
  .end((err, res) => {
    const idDeclaration = res.text.match(/TICKET_DETAILS_DATA\['first_activity'\] = [0-9]*;/)[0]
    let beforeId

    if (idDeclaration) {
      beforeId = parseInt(idDeclaration.split('=')[1].split(';'))
    }

    const authorMailDetails = []
    const details = []

    let $ = cheerio.load(res.text)
    if (!beforeId) {
      $('.author-mail-detail').not('.last-modified-detail').each((idx, el) => {
        const match = $(el).text().match(/\(.*\)/)
        authorMailDetails.push(match[0])
        if (match) authorMailDetails.push(match[0])
      })

      $('.details').each((idx, el) => {
        details.push($(el).text())
      })

      fs.writeFileSync(`./dump/${n}.json`, JSON.stringify({
        authorMailDetails,
        details
      }))

      return resolve([authorMailDetails, details])
    }

    getUrl('https://brandnewcongress.freshdesk.com/helpdesk/tickets/' + n + '/activities?before_id=' + beforeId)
    .end((err, res) => {
      let $ = cheerio.load(res.text)

      $('.author-mail-detail').not('.last-modified-detail').each((idx, el) => {
        const match = $(el).text().match(/\(.*\)/)
        if (match) authorMailDetails.push(match[0])
      })

      $('.details').each((idx, el) => {
        details.push($(el).text())
      })

      fs.writeFileSync(`./dump/${n}.json`, JSON.stringify({
        authorMailDetails,
        details
      }))

      return resolve([authorMailDetails, details])
    })
  })
})

const processPage = page => new Promise((resolve, reject) => {
  log('Doing page %d', page)
  freshdesk.listAllTickets({
    page,
    updated_since: '2015-01-19T02:00:00Z'
  }, (err, tickets, extras) => {
    if (err) return log(JSON.stringify(err)), reject(err)

    Promise
    .all(tickets.map(t => getTicketHistory(t.id)))
    .then(() => {
      if (!extras.pageIsLast) {
        return setTimeout(() => processPage(page + 1).then(resolve).catch(reject), 60)
      }

      else {
        return resolve('done')
      }
    })
  })
})

processPage(65)
.then(log)
.catch(log)

//
// getTicketHistory(2769).then(([amd, d]) => {
//   log(amd[idx])
//   log(d[idx])
//   log(amd.length)
//   log(d.length)
// })
