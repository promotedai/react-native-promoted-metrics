import Foundation
import PromotedAIMetricsSDK
import os.log

extension OSLog {
  func debug(
    args: @autoclosure () -> ReactNativeDictionary?,
    function: @autoclosure () -> String = #function
  ) {
    var argsCopy = args() ?? [:]
    // Replace keys for readability.
    argsCopy.replaceIfPresent(key: "actionType") {
      guard let n = $0 as? Int else { return $0 }
      return ActionType(rawValue: n) ?? .unknown
    }
    argsCopy.replaceIfPresent(key: "content") {
      guard let dict = $0 as? ReactNativeDictionary else { return $0 }
      return Content(dict) ?? Content()
    }
    argsCopy.replaceIfPresent(key: "hasSuperimposedViews") {
      guard let n = $0 as? Int else { return $0 }
      return (n != 0)
    }
    argsCopy.replaceIfPresent(key: "indexPath") {
      guard let a = $0 as? [Int] else { return $0 }
      return String(describing: a)
    }
    argsCopy.replaceIfPresent(key: "indexPaths") {
      guard let a = $0 as? [[Int]] else { return $0 }
      return String(describing: a)
    }
    argsCopy.replaceIfPresent(key: "sourceType") {
      guard let n = $0 as? Int else { return $0 }
      return ImpressionSourceType(rawValue: n) ?? .unknown
    }
    argsCopy.replaceIfPresent(key: "visibleContent") {
      guard let dict = $0 as? [ReactNativeDictionary] else { return $0 }
      return "ReactNativeDictionary[\(dict.count)]"
    }
    os_log(
      "%{private}s %{private}s",
      log: self,
      type: .debug,
      function(),
      argsCopy.debugDescription
    )
  }
}

private extension Dictionary {
  mutating func replaceIfPresent(key: Key, value: (Value) -> Value) {
    if let v = self[key] {
      self[key] = value(v)
    }
  }
}
