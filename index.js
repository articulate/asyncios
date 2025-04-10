var Async = require('crocks/Async')
var axios = require('axios')

function asyncios (params) {
  var cancelTokenSource = axios.CancelToken.source()

  var opts = Object.assign(
    { cancelToken: cancelTokenSource.token },
    params
  )

  return Async(function (reject, resolve) {
    axios(opts).then(resolve, reject)
    return cancelTokenSource.cancel.bind(cancelTokenSource)
  })
}

module.exports = asyncios
