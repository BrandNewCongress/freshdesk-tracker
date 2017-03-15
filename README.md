# freshdesk-tracker
Scrape Freshdesk for records on the status history of all tickets

# Historical Data

To get all historical data, make sure you have `mocha` installed with `npm i -g mocha`
and Node > 6.

First run `export DEBUG=bnc:*`

Then set environment variables `FRESHDESK_URL`, `FRESHDESK_EMAIL`, and `FRESHDESK_PASSWORD`,
and run `mocha auth.js`. This will produce `./cookies.json` and `./local-storage.json`,
which contain sensitive information that you should not share.

You are then free to set environment variables `FRESHDESK_API_KEY`, `mkdir dump`,
and run `node scrape.js`, which will produce `dump/*.json`.

To upload those tickets to a MongoDB, have `MOGNODB_URI` set, and then run
`node to-db.js`.

# Polling

From then on, you can keep the database in sync just be running `node index.js`
on an interval.
