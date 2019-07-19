# asyncios

A [crocks Async](https://crocks.dev/docs/crocks/Async.html) wrapper for [axios](https://github.com/axios/axios). Allows consumers to take advantage of the "lazy" data type while keeping a familiary API.

## How to Use

`asyncios` accepts the same configuration arguments as the underlying axios function. [See the axios documentation for more details](https://github.com/axios/axios#request-config).

```js
// GET request
asyncios({ method: 'GET', url: '/user?ID=12345' })
  .fork(
    error => console.log(error),
    response => console.log(response)
  )
```

```js
// same GET request, but using `params` configuration
asyncios({ method: 'GET', url: '/user', params: { ID: 12345 } })
  .fork(
    error => console.log(error),
    response => console.log(response)
  )
```

```js
// POST request
asyncios({
  method: 'POST',
  url: '/user?ID=12345',
  data: { firstName: 'Fred', lastName: 'Flinstone' },
})
  .fork(
    error => console.log(error),
    response => console.log(response)
  )
```

### Cancellation
`Async`-style cancellation is supported. See the [crocks doucmentation for more details](https://crocks.dev/docs/crocks/Async.html).

```js
const cancel = asyncios({ method: 'GET', url: '/user?ID=12345' })
  .fork(
    error => console.log(error),
    response => console.log(response),
    () => console.log('cancelled!')
  )

cancel()
```

`axios`'s cancellation token is also supported. Take note of the different behaviors--while cancelling via crocks will invoke `fork`'s third "cancel" callback, cancelling via axios will invoke `fork`'s first "rejected" callback. [See axios's documentation for more details](https://github.com/axios/axios#cancellation).

```js
const source = axios.CancelToken.source()

asyncios({
  method: 'GET',
  url: '/user?ID=12345',
  cancelToken: source.token
})
  .fork(
    error => {
      if (axios.isCancel(error)) console.log(error.message)
      else { /* handle error */ }
    },
    response => console.log(response)
  )

source.cancel('My cancel message')

```

## Thanks

Thanks to the fine people who work on both [axios](https://github.com/axios/axios) & [crocks](https://crocks.dev/).


## The Name

Pretty sure is [spencerfdavis](https://github.com/spencerfdavis)'s fault.
