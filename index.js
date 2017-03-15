const log = require('debug')('bnc:freshdesk')

const monk = require('monk')
const db = monk(process.env.MONGODB_URI)
const Tickets = db.get('Tickets')

const Freshdesk = require('freshdesk-api')
const freshdesk = new Freshdesk(process.env.FRESHDESK_URL, process.env.FRESHDESK_API_KEY)

const statusLookup = [
  'Open',
  'Closed',
  'Resolved',
  'Replied - In Conversation',
  'R2 - Replied - In Conversation',
  'R2 - To be scheduled',
  'R2 - Message Set 2 Pending',
  'R2 - Message Set 3 Pending',
  'R2 - HOLD - No Answer',
  'R2 - Appointment Scheduled',
  'R2 - HOLD - No contact info',
  'R2 - HOLD - Not Interested',
  'R2 - Rejected - Post Evaluation',
  'R2 - Approved - Send to R3',
  'R2 - STOP - DO NOT CONTACT',
  'Pending',
  'R2 - REBOOK - Missed Appointment ',
]

const updateTicket = async (fdTicket) => {
  const dbTicket = await Tickets.findOne({id: fdTicket.id.toString()})

  const updates = {}

  if (!dbTicket || dbTicket.status != statusLookup[fdTicket.status]) {
    updates.$set = {status: statusLookup[fdTicket.status]}
    updates.$push = {updates: {
      date: new Date(),
      status: statusLookup[fdTicket.status]
    }}

    log('Doing update for %d', fdTicket.id)

    return await Tickets.update(
      {id: fdTicket.id.toString()},
      updates,
      {upsert: true}
    )
  }

  log('No update')
  return 'No update'
}

const processPage = page => new Promise((resolve, reject) => {
  log('Doing page %d', page)
  freshdesk.listAllTickets({
    page,
    updated_since: '2015-01-19T02:00:00Z'
  }, (err, tickets, extras) => {
    if (err) return log(JSON.stringify(err)), reject(err)

    Promise
    .all(tickets.map(updateTicket))
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

processPage(1)
.then(log)
.catch(log)
