# freshdesk-tracker
Scrape Freshdesk for records on the status history of all tickets

# Polling

TODO

# Historical Data

To get all historical data, make sure you have `mocha` installed with `npm i -g mocha`
and Node > 6.

Then set environment variables `FRESHDESK_URL`, `FRESHDESK_EMAIL`, and `FRESHDESK_PASSWORD`,
and run `mocha auth.js`. This will produce `./cookies.json` and `./local-storage.json`,
which contain sensitive information that you should not share.

You are then free to set environment variables `FRESHDESK_API_KEY` and run `node scrape.js`,
which will produce `tickets.json`.
