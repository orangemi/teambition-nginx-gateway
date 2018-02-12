'use strict'
const Koa = require('koa')
const urllib = require('urllib')
const APP_PORT = Number(process.env.APP_PORT) || 3000
const APP_HOST = process.env.APP_HOST || 'http://localhost:3000'
const APP_CLIENT_ID = process.env.APP_CLIENT_ID || ''
const APP_CLIENT_SECRET = process.env.APP_CLIENT_SECRET || ''
const APP_TEAMBITION_ORG_ID = process.env.APP_TEAMBITION_ORG_ID || ''
const APP_TEAMBITION_PROJECT_ID = process.env.APP_TEAMBITION_PROJECT_ID || ''
const APP_COOKIE_KEY = process.env.APP_COOKIE_KEY || 'Teambition-Access-Token'
const TEAMBITION_ACCOUNT_HOST = process.env.TEAMBITION_ACCOUNT_HOST || 'https://account.teambition.com'
const TEAMBITION_API_HOST = process.env.TEAMBITION_API_HOST || 'https://api.teambition.com'

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
    let resp = yield urllib.request(TEAMBITION_ACCOUNT_HOST + '/oauth2/access_token', {
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
      return this.redirect('/')
    }
    let accessToken = resp.data.access_token
    if (!accessToken) {
      this.throw(500, 'teambition login fail 2')
    }

    this.cookies.set(APP_COOKIE_KEY, accessToken, {path: '/'})
    this.redirect('/')
  } else {
    let accessToken = this.cookies.get(APP_COOKIE_KEY)
    if (!accessToken) return this.redirect(`${TEAMBITION_ACCOUNT_HOST}/oauth2/authorize?client_id=${APP_CLIENT_ID}&redirect_uri=${APP_HOST}/callback&response_type=code`)
    if (!~caches.indexOf(accessToken)) {
      // load cache
      const resp = yield urllib.request(`${TEAMBITION_API_HOST}/applications/${APP_CLIENT_ID}/tokens/check`, {
        headers: {Authorization: 'OAuth2 ' + accessToken}
      })
      if (resp.status !== 200) {
        // accessToken in cookie expired
        this.cookies.set(APP_COOKIE_KEY, '', {path: '/'})
        return this.redirect(`${TEAMBITION_ACCOUNT_HOST}/oauth2/authorize?client_id=${APP_CLIENT_ID}&redirect_uri=${APP_HOST}/callback&response_type=code`)
      }
      if (APP_TEAMBITION_ORG_ID) {
        const resp2 = yield urllib.request(`${TEAMBITION_API_HOST}/organizations/${APP_TEAMBITION_ORG_ID}`, {
          headers: {Authorization: 'OAuth2 ' + accessToken},
          dataType: 'json'
        })
        if (resp2.status !== 200) this.throw(403)
        if (resp2.data._roleId < 0) this.throw(403)
      }

      if (APP_TEAMBITION_PROJECT_ID) {
        const resp3 = yield urllib.request(`${TEAMBITION_API_HOST}/projects/${APP_TEAMBITION_PROJECT_ID}`, {
          headers: {Authorization: 'OAuth2 ' + accessToken},
          dataType: 'json'
        })
        if (resp3.status !== 200) this.throw(403)
        if (resp3.data._roleId < 0) this.throw(403)
      }

      // TODO: save cache
      caches.push(accessToken)
    }

    this.set('X-Accel-Redirect', '@xaccel')
    this.status = 101
  }
})

app.listen(APP_PORT, () => console.log(`start listen ${APP_PORT} ...`))
