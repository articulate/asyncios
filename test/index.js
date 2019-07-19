const asyncios = require('..')
const axios = require('axios')
const { expect } = require('chai')
const { createFakeServer } = require('sinon')

const unexpected = message => done => () =>
  done(new Error(message))

const unexpectedSuccess =
  unexpected('Unexpected success')

const unexpectedCancel =
  unexpected('Unexpected cancel')

describe('asyncios', () => {
  let server

  beforeEach(() => {
    server = createFakeServer()
    server.autoRespond = true
    server.autoRespondAfter = 500
  })

  afterEach(() => {
    server.restore()
  })

  it('is lazy', () => {
    asyncios({ method: 'GET', url: '/foo/bar' })
    expect(server.requests).to.be.empty
  })

  it('resolves a GET 200', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, expectation, unexpectedCancel(done))
  })

  it('resolves a POST 200', done => {
    server.respondWith('POST', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'POST')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    asyncios({ method: 'POST', url: '/foo/bar' })
      .fork(done, expectation, unexpectedCancel(done))
  })

  it('rejects 404', done => {
    const expectation = err => {
      try {
        expect(err).to.have.property('response')
          .that.has.property('status', 404)
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))
  })

  it('rejects 400', done => {
    server.respondWith('GET', '/foo/bar', [
      400,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = err => {
      try {
        expect(err).to.have.property('response')
        expect(err.response).to.have.property('status', 400)
        expect(err.response).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))
  })

  it('rejects 500', done => {
    server.respondWith('GET', '/foo/bar', [
      500,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = err => {
      try {
        expect(err).to.have.property('response')
        expect(err.response).to.have.property('status', 500)
        expect(err.response).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))
  })

  it('cancels via Async before request', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.be.undefined
        expect(server.requests).to.be.empty
        done()
      } catch (err) {
        done(err)
      }
    }

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, unexpectedSuccess(done), expectation)

    cancel()
  })

  it('cancels via Async before response', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.be.undefined
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, unexpectedSuccess(done), expectation)

    setTimeout(cancel, 250)
  })

  it('cannot cancel via Async after response', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, expectation, unexpectedCancel(done))

    setTimeout(cancel, 750)
  })

  it('cancels via token before request', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(axios.isCancel(res)).to.be.true
        expect(res).to.have.property('message', 'cancel!')
        expect(server.requests).to.be.empty
        done()
      } catch (err) {
        done(err)
      }
    }

    const source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))

    source.cancel('cancel!')
  })

  it('cancels via token before response', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(axios.isCancel(res)).to.be.true
        expect(res).to.have.property('message', 'cancel!')
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    const source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))

    setTimeout(() => source.cancel('cancel!'), 250)
  })

  it('cannot cancel via token after response', done => {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    const expectation = res => {
      try {
        expect(res).to.have.property('data')
          .that.deep.equals({ foo: 'bar' })
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests).to.have.lengthOf(1)
        expect(server.requests[0]).to.have.property('method', 'GET')
        expect(server.requests[0]).to.have.property('url', '/foo/bar')
        done()
      } catch (err) {
        done(err)
      }
    }

    const source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(done, expectation, unexpectedCancel(done))

    setTimeout(() => source.cancel('cancel!'), 750)
  })
})
