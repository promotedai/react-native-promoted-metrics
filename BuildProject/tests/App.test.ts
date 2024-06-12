import wd from 'wd'
import { retry } from './retry.ts'

jasmine.DEFAULT_TIMEOUT_INTERVAL = 600000
const TEST_PLATFORM = process.env.TEST_PLATFORM
const PORT = 4723

const config =
  (TEST_PLATFORM == 'ios') ? {
    platformName: "iOS",
    platformVersion: "15.2",
    deviceName: "iPhone 12",
    app: "build/BuildProject.ipa",
  } :
  (TEST_PLATFORM == 'android') ? {
    platformName: "Android",
    deviceName: "Android Emulator",
    app: "build/app-release.apk",
  } :
  null

const driver = wd.promiseChainRemote('localhost', PORT)

beforeAll(async () => {
  if (config == null) fail(`Unknown TEST_PLATFORM: ${TEST_PLATFORM}`)
  await driver.init(config)
})

test(`Test All Promoted Logging Calls (${TEST_PLATFORM})`, async () => {

  class EmptyResultTextError extends Error {
    constructor() {
      super('Test produced no result text')
      this.name = 'EmptyResultTextError'
    }
  }

  const expectMessageTextEndsWith = async (expectedMessage) => {
    const messagesText = await driver.elementByAccessibilityId('messages-text').text()
    // Text not yet available. Cause a retry (or failure).
    if (!messagesText) throw new EmptyResultTextError()
    // Text is available. Check that it contains what we expect.
    if (!messagesText.endsWith(expectedMessage)) {
      fail(`"${messagesText}" does not end with "${expectedMessage}"`)
    }
  }

  await retry(async () => {
    await expectMessageTextEndsWith('All hooks passed')
  }, /*errorClassesToIgnore=*/[EmptyResultTextError], driver)

  await retry(async () => {
    await driver.elementByAccessibilityId('test-all-button').click().sleep(500)
    await expectMessageTextEndsWith('All logging passed')
  }, /*errorClassesToIgnore=*/[EmptyResultTextError], driver)
})
