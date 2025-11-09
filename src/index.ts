import Async from 'crocks/Async'
import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios'

/**
 * Wraps an axios request in a crocks Async for lazy, cancellable HTTP requests.
 *
 * @param {Object} params - Axios request configuration object
 * @param {string} params.method - HTTP method (GET, POST, etc.)
 * @param {string} params.url - Request URL
 * @param {Object} [params.data] - Request body data
 * @param {Object} [params.params] - URL parameters
 * @param {Object} [params.headers] - Request headers
 * @param {AbortSignal} [params.signal] - AbortController signal for external cancellation (overrides internal signal)
 * @returns {Async} A crocks Async that resolves with the axios response or rejects with an error.
 *                  Call .fork(onError, onSuccess, onCancel) to execute. The fork function returns
 *                  a cancel function that aborts the request via AbortController.
 *
 * @example
 * asyncios({ method: 'GET', url: '/users' })
 *   .fork(
 *     error => console.error(error),
 *     response => console.log(response.data)
 *   )
 *
 * @example
 * // With cancellation
 * const cancel = asyncios({ method: 'GET', url: '/users' })
 *   .fork(
 *     error => console.error(error),
 *     response => console.log(response.data),
 *     () => console.log('Request cancelled')
 *   )
 *
 * cancel() // Aborts the request
 */
export default function asyncios<T = unknown>(
  params: AxiosRequestConfig,
): Async<unknown, AxiosResponse<T>> {
  const controller = new AbortController()

  const opts = {
    signal: controller.signal,
    ...params,
  }

  return Async<unknown, AxiosResponse<T>>((reject, resolve) => {
    axios(opts).then(resolve, reject)
    return controller.abort.bind(controller)
  })
}
