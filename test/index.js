var asyncios = require('..')
var axios = require('axios')
var chai = require('chai')
var sinon = require('sinon')

var expect = chai.expect

function unexpected (message) {
  return function (done) {
    return function () {
      done(new Error(message))
    }
  }
}

var unexpectedSuccess =
  unexpected('Unexpected success')

var unexpectedCancel =
  unexpected('Unexpected cancel')

describe('asyncios', function () {
  var server

  beforeEach(function () {
    server = sinon.createFakeServer()
    server.autoRespond = true
    server.autoRespondAfter = 500
  })

  afterEach(function () {
    server.restore()
  })

  it('is lazy', function () {
    asyncios({ method: 'GET', url: '/foo/bar' })
    expect(server.requests).to.be.empty
  })

  it('resolves a GET 200', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

  it('resolves a POST 200', function (done) {
    server.respondWith('POST', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

  it('rejects 404', function (done) {
    var expectation = function (err) {
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

  it('rejects 400', function (done) {
    server.respondWith('GET', '/foo/bar', [
      400,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (err) {
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

  it('rejects 500', function (done) {
    server.respondWith('GET', '/foo/bar', [
      500,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (err) {
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

  it('cancels via Async before request', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
      try {
        expect(res).to.be.undefined
        expect(server.requests).to.be.empty
        done()
      } catch (err) {
        done(err)
      }
    }

    var cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, unexpectedSuccess(done), expectation)

    cancel()
  })

  it('cancels via Async before response', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

    var cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, unexpectedSuccess(done), expectation)

    setTimeout(cancel, 250)
  })

  it('cannot cancel via Async after response', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

    var cancel = asyncios({ method: 'GET', url: '/foo/bar' })
      .fork(done, expectation, unexpectedCancel(done))

    setTimeout(cancel, 750)
  })

  it('cancels via token before request', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
      try {
        expect(axios.isCancel(res)).to.be.true
        expect(res).to.have.property('message', 'cancel!')
        expect(server.requests).to.be.empty
        done()
      } catch (err) {
        done(err)
      }
    }

    var source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))

    source.cancel('cancel!')
  })

  it('cancels via token before response', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

    var source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(expectation, unexpectedSuccess(done), unexpectedCancel(done))

    setTimeout(function () { source.cancel('cancel!') }, 250)
  })

  it('cannot cancel via token after response', function (done) {
    server.respondWith('GET', '/foo/bar', [
      200,
      { 'Content-Type': 'application/json' },
      '{ "foo": "bar" }'
    ])

    var expectation = function (res) {
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

    var source = axios.CancelToken.source()

    asyncios({ method: 'GET', url: '/foo/bar', cancelToken: source.token })
      .fork(done, expectation, unexpectedCancel(done))

    setTimeout(function () { source.cancel('cancel!') }, 750)
  })
})
