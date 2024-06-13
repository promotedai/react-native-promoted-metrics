import Foundation
import PromotedAIMetricsSDK

extension Money {

  convenience init?(_ dict: ReactNativeDictionary?) {
    guard
      let dict = dict,
      let currencyCodeInt = dict["currencyCode"] as? Int,
      let currencyCode = CurrencyCode(rawValue: currencyCodeInt),
      let amountMicros = dict["amountMicros"] as? Int64
    else { return nil }
    self.init(currencyCode: currencyCode, amountMicros: amountMicros)
  }
}
