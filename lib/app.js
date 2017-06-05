'use strict'
const URL = require('url')
const Koa = require('koa')
const urllib = require('urllib')
const {host, clientId, clientSecret, teambitionOrgId, cookieKey} = require('config')

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
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'code'
      }
    })
    if (resp.status !== 200) {
      return this.redirect(host)
    }
    let accessToken = resp.data.access_token
    if (!accessToken) {
      this.throw(500, 'teambition login fail 2')
    }

    this.cookies.set(cookieKey, accessToken, {
      path: '/',
      domain: URL.parse(host).hostname
    })
    this.redirect(host)
  } else {
    let accessToken = this.cookies.get(cookieKey)
    if (!accessToken) return this.redirect(`https://account.teambition.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${host}/callback&response_type=code`)
    if (!~caches.indexOf(accessToken)) {
      // load cache
      let resp = yield urllib.request(`https://api.teambition.com/api/applications/${clientId}/tokens/check`, {
        headers: {
          Authorization: 'OAuth2 ' + accessToken
        }
      })
      if (resp.status !== 200) this.throw(403)
      let resp2 = yield urllib.request(`https://api.teambition.com/api/organizations/${teambitionOrgId}`, {
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
