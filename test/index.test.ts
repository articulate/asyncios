import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert'
import axios, { type AxiosError, type AxiosResponse } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import asyncios from '../src/index.js'

describe('asyncios', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(axios)
  })

  it('is lazy', () => {
    asyncios({ method: 'GET', url: '/foo/bar' })
    assert.strictEqual(mock.history.get.length, 0)
  })

  it('resolves a GET 200', (_t, done) => {
    mock.onGet('/foo/bar').reply(200, { foo: 'bar' })

    asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      done,
      (res: AxiosResponse) => {
        try {
          assert.deepStrictEqual(res.data, { foo: 'bar' })
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected cancel')),
    )
  })

  it('resolves a POST 200', (_t, done) => {
    mock.onPost('/foo/bar').reply(200, { foo: 'bar' })

    asyncios({ method: 'POST', url: '/foo/bar' }).fork(
      done,
      (res: AxiosResponse) => {
        try {
          assert.deepStrictEqual(res.data, { foo: 'bar' })
          assert.strictEqual(mock.history.post.length, 1)
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected cancel')),
    )
  })

  it('rejects 404', (_t, done) => {
    mock.onGet('/foo/bar').reply(404)

    asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      (err: unknown) => {
        try {
          assert.strictEqual((err as AxiosError).response?.status, 404)
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (e) {
          done(e)
        }
      },
      () => done(new Error('Unexpected success')),
      () => done(new Error('Unexpected cancel')),
    )
  })

  it('rejects 400', (_t, done) => {
    mock.onGet('/foo/bar').reply(400, { foo: 'bar' })

    asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      (err: unknown) => {
        try {
          assert.strictEqual((err as AxiosError).response?.status, 400)
          assert.deepStrictEqual((err as AxiosError).response?.data, {
            foo: 'bar',
          })
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (e) {
          done(e)
        }
      },
      () => done(new Error('Unexpected success')),
      () => done(new Error('Unexpected cancel')),
    )
  })

  it('rejects 500', (_t, done) => {
    mock.onGet('/foo/bar').reply(500, { foo: 'bar' })

    asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      (err: unknown) => {
        try {
          assert.strictEqual((err as AxiosError).response?.status, 500)
          assert.deepStrictEqual((err as AxiosError).response?.data, {
            foo: 'bar',
          })
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (e) {
          done(e)
        }
      },
      () => done(new Error('Unexpected success')),
      () => done(new Error('Unexpected cancel')),
    )
  })

  it('cancels via Async before request', (_t, done) => {
    mock.onGet('/foo/bar').reply(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([200, { foo: 'bar' }]), 100)
      })
    })

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      () => done(new Error('Unexpected error')),
      () => done(new Error('Unexpected success')),
      () => {
        try {
          done()
        } catch (e) {
          done(e)
        }
      },
    )

    setImmediate(cancel)
  })

  it('cancels via Async before response', (_t, done) => {
    mock.onGet('/foo/bar').reply(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([200, { foo: 'bar' }]), 100)
      })
    })

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      done,
      () => done(new Error('Unexpected success')),
      () => {
        try {
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (err) {
          done(err)
        }
      },
    )

    setTimeout(cancel, 50)
  })

  it('cannot cancel via Async after response', (_t, done) => {
    mock.onGet('/foo/bar').reply(200, { foo: 'bar' })

    const cancel = asyncios({ method: 'GET', url: '/foo/bar' }).fork(
      done,
      (res: AxiosResponse) => {
        try {
          assert.deepStrictEqual(res.data, { foo: 'bar' })
          assert.strictEqual(mock.history.get.length, 1)
          clearTimeout(timeoutId)
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected cancel')),
    )

    const timeoutId = setTimeout(cancel, 200)
  })

  it('cancels via signal before request', (_t, done) => {
    mock.onGet('/foo/bar').reply(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([200, { foo: 'bar' }]), 100)
      })
    })

    const controller = new AbortController()

    asyncios({
      method: 'GET',
      url: '/foo/bar',
      signal: controller.signal,
    }).fork(
      (res: unknown) => {
        try {
          assert.ok(axios.isCancel(res))
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected success')),
      () => done(new Error('Unexpected cancel')),
    )

    setImmediate(() => controller.abort('cancel!'))
  })

  it('cancels via signal before response', (_t, done) => {
    mock.onGet('/foo/bar').reply(() => {
      return new Promise(resolve => {
        setTimeout(() => resolve([200, { foo: 'bar' }]), 100)
      })
    })

    const controller = new AbortController()

    asyncios({
      method: 'GET',
      url: '/foo/bar',
      signal: controller.signal,
    }).fork(
      (res: unknown) => {
        try {
          assert.ok(axios.isCancel(res))
          assert.strictEqual(mock.history.get.length, 1)
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected success')),
      () => done(new Error('Unexpected cancel')),
    )

    setTimeout(() => controller.abort('cancel!'), 50)
  })

  it('cannot cancel via signal after response', (_t, done) => {
    mock.onGet('/foo/bar').reply(200, { foo: 'bar' })

    const controller = new AbortController()

    asyncios({
      method: 'GET',
      url: '/foo/bar',
      signal: controller.signal,
    }).fork(
      done,
      (res: AxiosResponse) => {
        try {
          assert.deepStrictEqual(res.data, { foo: 'bar' })
          assert.strictEqual(mock.history.get.length, 1)
          clearTimeout(timeoutId)
          done()
        } catch (err) {
          done(err)
        }
      },
      () => done(new Error('Unexpected cancel')),
    )

    const timeoutId = setTimeout(() => controller.abort('cancel!'), 200)
  })
})
