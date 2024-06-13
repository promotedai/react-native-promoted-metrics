import Foundation
import PromotedAIMetricsSDK

extension CartContent {

  convenience init?(_ dict: ReactNativeDictionary?) {
    guard
      let dict = dict,
      let content = dict.content,
      let quantity = dict["quantity"] as? Int
    else { return nil }
    let price: Money?
    if let priceDict = dict["pricePerUnit"] as? ReactNativeDictionary {
      price = Money(priceDict)
    } else {
      price = nil
    }
    self.init(content: content, quantity: quantity, pricePerUnit: price)
  }
}
