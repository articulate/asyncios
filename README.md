# asyncios

A [crocks Async](https://crocks.dev/docs/crocks/Async.html) wrapper for
[axios](https://github.com/axios/axios). Allows consumers to take advantage of
the "lazy" data type while keeping a familiar API.

## How to Use

`asyncios` accepts the same configuration arguments as the underlying axios
function. [See the axios documentation for more
details](https://github.com/axios/axios#request-config).

```typescript
import asyncios from '@articulate/asyncios'

// GET request
asyncios({ method: 'GET', url: '/user?ID=12345' }).fork(
  error => {
    console.log(error)
  },
  (response: AxiosResponse) => {
    console.log(response)
  },
)
```

```typescript
// same GET request, but using `params` configuration
asyncios({ method: 'GET', url: '/user', params: { ID: 12345 } }).fork(
  error => {
    console.log(error)
  },
  (response: AxiosResponse) => {
    console.log(response)
  },
)
```

```typescript
// POST request with typed response
import type { AxiosResponse } from 'axios'

interface User {
  firstName: string
  lastName: string
}

asyncios<User>({
  method: 'POST',
  url: '/user',
  data: { firstName: 'Fred', lastName: 'Flinstone' },
}).fork(
  error => {
    console.log(error)
  },
  (response: AxiosResponse<User>) => {
    console.log(response.data.firstName)
  },
)
```

### Cancellation

`Async`-style cancellation is supported. See the [crocks documentation for more
details](https://crocks.dev/docs/crocks/Async.html).

```typescript
const cancel = asyncios({ method: 'GET', url: '/user?ID=12345' }).fork(
  error => {
    console.log(error)
  },
  (response: AxiosResponse) => {
    console.log(response)
  },
  () => {
    console.log('cancelled!')
  },
)

cancel()
```

`axios`'s AbortController signal is also supported. Take note of the different
behaviors: while cancelling via crocks will invoke `fork`'s third "cancel"
callback, cancelling via axios will invoke `fork`'s first "rejected" callback.
[See axios's documentation for more
details](https://github.com/axios/axios#cancellation).

```typescript
import axios from 'axios'

const controller = new AbortController()

asyncios({
  method: 'GET',
  url: '/user?ID=12345',
  signal: controller.signal,
}).fork(
  error => {
    if (axios.isCancel(error)) {
      console.log(error.message)
    } else {
      /* handle error */
    }
  },
  (response: AxiosResponse) => {
    console.log(response)
  },
)

controller.abort('My cancel message')
```
