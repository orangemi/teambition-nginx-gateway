'use strict'
const URL = require('url')
const Koa = require('koa')
const urllib = require('urllib')
// const config = require('config')
const APP_HOST = process.env.APP_HOST || 'http://localhost:3000'
const APP_CLIENT_ID = process.env.APP_CLIENT_ID || ''
const APP_CLIENT_SECRET = process.env.APP_CLIENT_SECRET || ''
const APP_TEAMBITION_ORG_ID = process.env.APP_TEAMBITION_ORG_ID || '50c32afae8cf1439d35a87e6'
const APP_COOKIE_KEY = process.env.APP_COOKIE_KEY || 'Teambition-Access-Token'

let caches = []

setInterval(() => {
  caches = []
}, 30 * 1000)

const app = new Koa()

app.use(function * (next) {
  let d = Date.now()
  yield next
  let duration = Date.now() - d
  console.log(this.method, this.url, this.status, duration + 'ms')
})

app.use(function * () {
  if (this.path === '/callback') {
    let code = this.query.code
    let resp = yield urllib.request('https://account.teambition.com/oauth2/access_token', {
      method: 'POST',
      dataType: 'json',
      data: {
        client_id: APP_CLIENT_ID,
        client_secret: APP_CLIENT_SECRET,
        code: code,
        grant_type: 'code'
      }
    })
    if (resp.status !== 200) {
      return this.redirect(APP_HOST)
    }
    let accessToken = resp.data.access_token
    if (!accessToken) {
      this.throw(500, 'teambition login fail 2')
    }

    this.cookies.set(APP_COOKIE_KEY, accessToken, {
      path: '/',
      domain: URL.parse(APP_HOST).hostname
    })
    this.redirect(APP_HOST)
  } else {
    let accessToken = this.cookies.get(APP_COOKIE_KEY)
    if (!accessToken) return this.redirect(`https://account.teambition.com/oauth2/authorize?client_id=${APP_CLIENT_ID}&redirect_uri=${APP_HOST}/callback&response_type=code`)
    if (!~caches.indexOf(accessToken)) {
      // load cache
      let resp = yield urllib.request(`https://api.teambition.com/api/applications/${APP_CLIENT_ID}/tokens/check`, {
        headers: {
          Authorization: 'OAuth2 ' + accessToken
        }
      })
      if (resp.status !== 200) this.throw(403)
      let resp2 = yield urllib.request(`https://api.teambition.com/api/organizations/${APP_TEAMBITION_ORG_ID}`, {
        headers: {
          Authorization: 'OAuth2 ' + accessToken
        },
        dataType: 'json'
      })
      if (resp2.status !== 200) this.throw(403)
      if (resp2.data._roleId < 0) this.throw(403)

      // TODO: save cache
      caches.push(accessToken)
    }

    this.set('X-Accel-Redirect', '@xaccel')
  }
})

app.listen(3000, () => console.log('start listen 3000...'))
