const Async = require('crocks/Async')
const axios = require('axios')

function asyncios (params) {
  const cancelTokenSource = axios.CancelToken.source()

  const opts = Object.assign(
    {},
    { cancelToken: cancelTokenSource.token },
    params
  )

  return new Async((reject, resolve) => {
    axios(opts).then(resolve).catch(reject)
    return cancelTokenSource.cancel.bind(cancelTokenSource)
  })
}

module.exports = asyncios
