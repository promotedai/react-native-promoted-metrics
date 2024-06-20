async function retry(fn, errorClassesToIgnore, driver, opt_retryCount, opt_sleep) {
  var retryCount = opt_retryCount || 10
  var sleep = opt_sleep || 1000
  for (var i = 0; i < retryCount; i++) {
    try {
      await driver.sleep(sleep)
      return await fn()
    } catch (err) {
      console.log("Retry encountered error.", err)
      // Ignore Webdriver code 7 (element not found).
      if (err.code === 7 || err.status === 7) continue
      // Check for known error to ignore.
      var foundIgnore = false
      for (const errorClass of errorClassesToIgnore) {
        if (err instanceof errorClass) {
          foundIgnore = true
          break
        }
      }
      if (foundIgnore) continue
      // Other kind of error indicates failure.
      throw err
    }
  }
  fail(`Retry failed after ${retryCount} tries.`)
}

module.exports.retry = retry
