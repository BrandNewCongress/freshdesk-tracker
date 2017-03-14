const log = require('debug')('bnc:freshdesk:auth')
const webdriverio = require('webdriverio')
const fs = require('fs')

const options = {
  desiredCapabilities: {
    browserName: 'chrome'
  }
}

describe('should be able to fetch cookies', function () {
  this.timeout(99999999)
  let client
  let cookies
  let localStorage

  before(function () {
    client = webdriverio.remote(options)
    return client.init()
  })

  it('should login', function () {
    return client.url('https://brandnewcongress.freshdesk.com/admin/home')
      .setValue('#user_session_email', process.env.FRESHDESK_EMAIL)
      .setValue('#user_session_password', process.env.FRESHDESK_PASSWORD)
      .click('.btn-login')
      .waitForVisible('.admin_icons')
  })

  it('should fetch cookies', function () {
    cookies = client.getCookie()
    return cookies
  })

  it('should fetch localStorage', function () {
    localStorage = client.localStorage()
    return localStorage
  })

  after(function () {
    fs.writeFileSync('./cookies.json', JSON.stringify(cookies))
    fs.writeFileSync('./local-storage.json', JSON.stringify(localStorage))
    client.end()
  })
})
