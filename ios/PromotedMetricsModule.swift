import Foundation
import PromotedAIMetricsSDK
import os.log

// MARK: -
/**
 `MetricsLogger` methods packaged as a module. Has many of the same methods
 as `MetricsLogger` and `ImpressionTracker`, but delegates those methods to
 instances of those loggers.
 */
@objc(PromotedMetricsModule)
public class PromotedMetricsModule: NSObject {

  public typealias LogImpressionArgs = ReactNativeDictionary
  public typealias LogActionArgs = ReactNativeDictionary
  public typealias LogViewArgs = ReactNativeDictionary
  public typealias LogAutoViewArgs = ReactNativeDictionary

  public typealias CollectionDidMountArgs = ReactNativeDictionary
  public typealias CollectionDidChangeArgs = ReactNativeDictionary
  public typealias CollectionActionDidOccurArgs = ReactNativeDictionary
  public typealias CollectionWillUnmountArgs = ReactNativeDictionary

  private let service: MetricsLoggerService?
  private var metricsLogger: MetricsLogger? {
    validateModuleInitialized()
    return service?.metricsLogger
  }
  private var didPresentAnomalyVC: Bool
  private var idToImpressionTracker: [String: ImpressionTracker]

  private let osLog: OSLog?
  private let impressionLogger: ImpressionTrackerDebugLogger?

  @objc public override convenience init() {
    // Log a debug message instead of throwing an error so that clients
    // can integrate the build dependency without adding configuration
    // in the same change.
    let initialMessageOSLog = OSLog(
      subsystem: "ai.promoted",
      category: "PromotedMetricsModule"
    )
    os_log(
      "PromotedMetricsModule not configured",
      log: initialMessageOSLog,
      type: .debug
    )
    self.init(optionalMetricsLoggerService: nil)
  }

  @objc public convenience init(metricsLoggerService: MetricsLoggerService) {
    self.init(optionalMetricsLoggerService: metricsLoggerService)
  }

  private init(
    optionalMetricsLoggerService: MetricsLoggerService?
  ) {
    self.service = optionalMetricsLoggerService
    self.idToImpressionTracker = [:]
    self.didPresentAnomalyVC = false
    if let service = optionalMetricsLoggerService,
       service.config.osLogLevel >= .debug
    {
      self.osLog = OSLog(
        subsystem: "ai.promoted",
        category: "PromotedMetricsModule"
      )
      self.impressionLogger = ImpressionTrackerDebugLogger(
        osLog: self.osLog!
      )
    } else {
      self.osLog = nil
      self.impressionLogger = nil
    }
  }

  @objc public var methodQueue: DispatchQueue { DispatchQueue.main }

  @objc public static func requiresMainQueueSetup() -> Bool { true }
}

public extension PromotedMetricsModule {
  // MARK: - Starting new sessions
  @objc(startSessionAndLogUser:)
  func startSessionAndLogUser(userID: String) {
    metricsLogger?.startSessionAndLogUser(userID: userID)
  }

  @objc(startSessionAndLogSignedOutUser)
  func startSessionAndLogSignedOutUser() {
    metricsLogger?.startSessionAndLogSignedOutUser()
  }

  // MARK: - Impressions
  @objc(logImpression:)
  func logImpression(_ args: LogImpressionArgs?) {
    guard let args = args, let content = args.content else { return }
    osLog?.debug(args: args)
    metricsLogger?.logImpression(
      content: content,
      sourceType: args.impressionSourceType,
      autoViewState: args.autoViewState,
      collectionInteraction: collectionInteraction(args: args)
    )
  }

  // MARK: - Actions
  @objc(logAction:)
  func logAction(_ args: LogActionArgs?) {
    guard let args = args else { return }
    osLog?.debug(args: args)
    metricsLogger?.logAction(
      type: args.actionType,
      content: args.content,
      // TODO: Use the NavigateAction sub-message for destination.
      name: args.destinationScreenName ?? args.actionName,
      autoViewState: args.autoViewState,
      collectionInteraction: collectionInteraction(args: args)
    )
  }

  // MARK: - Views
  @objc(logView:)
  func logView(_ args: LogViewArgs?) {
    guard let args = args else { return }
    osLog?.debug(args: args)
    metricsLogger?.logView(
      routeName: args.routeName,
      routeKey: args.routeKey
    )
  }

  @objc(logAutoView:)
  func logAutoView(_ args: LogAutoViewArgs?) {
    guard let args = args else { return }
    osLog?.debug(args: args)
    metricsLogger?.logAutoView(
      routeName: args.routeName,
      routeKey: args.routeKey,
      autoViewID: args.autoViewID
    )
  }
}

// MARK: - CollectionTracker
public extension PromotedMetricsModule {

  /// Begins tracking session for given collection view.
  /// Can be called multiple times in succession, such as when a collection
  /// view reloads on a timer. In these cases, the impression logging state
  /// from the previous session will persist.
  @objc(collectionDidMount:)
  func collectionDidMount(_ args: CollectionDidMountArgs?) {
    guard let args = args, let id = args.collectionID else { return }
    // A load without a previous unmount can be due to a page refresh.
    // Don't recreate the logger in this case.
    if let _ = idToImpressionTracker[id] { return }
    osLog?.debug(args: args)
    let s = args.impressionSourceType
    if let tracker = service?.impressionTracker(sourceType: s) {
      idToImpressionTracker[id] = tracker
      tracker.delegate = impressionLogger
    }
  }

  /// Logs impressions for changed content.
  /// Call this method with currently visible content and the underlying
  /// `ImpressionTracker` will calculate deltas and log appropriate events.
  @objc(collectionDidChange:)
  func collectionDidChange(_ args: CollectionDidChangeArgs?) {
    guard
      let args = args,
      let id = args.collectionID,
      let tracker = idToImpressionTracker[id]
    else { return }
    osLog?.debug(args: args)
    if let interactionArray = collectionInteractionArray(args: args) {
      let contentsAndCollectionInteractions =
        zip(args.visibleContentArray, interactionArray)
          .reduce(into: [Content: CollectionInteraction]()) {
            $0[$1.0] = $1.1
          }
      tracker.collectionViewDidChangeVisibleContent(
        contentsAndCollectionInteractions,
        autoViewState: args.autoViewState
      )
    } else {
      tracker.collectionViewDidChangeVisibleContent(
        args.visibleContentArray,
        autoViewState: args.autoViewState
      )
    }
  }

  /// Logs actions for content in a given collection view.
  /// Call this method when an action occurs within a tracked collection view.
  @objc(collectionActionDidOccur:)
  func collectionActionDidOccur(_ args: CollectionActionDidOccurArgs?) {
    guard
      let args = args,
      let content = args.content,
      let id = args.collectionID,
      let tracker = idToImpressionTracker[id]
    else { return }
    let impressionID = tracker.impressionID(for: content)
    osLog?.debug(args: args)
    metricsLogger?.logAction(
      type: args.actionType,
      content: content,
      name: args.actionName,
      autoViewState: args.autoViewState,
      collectionInteraction: collectionInteraction(args: args),
      impressionID: impressionID
    )
  }

  /// Ends tracking session for given collection view.
  /// Drops all associated impression logging state.
  @objc(collectionWillUnmount:)
  func collectionWillUnmount(_ args: CollectionWillUnmountArgs?) {
    guard
      let args = args,
      let id = args.collectionID,
      let tracker = idToImpressionTracker.removeValue(forKey: id)
    else { return }
    osLog?.debug(args: args)
    tracker.collectionViewDidHideAllContent(autoViewState: args.autoViewState)
  }

  private func collectionInteraction(
    args: ReactNativeDictionary
  ) -> CollectionInteraction? {
    guard
      let service = service,
      service.config.eventsIncludeClientPositions
    else { return nil }
    return args.collectionInteraction
  }

  private func collectionInteractionArray(
    args: ReactNativeDictionary
  ) -> [CollectionInteraction]? {
    guard
      let service = service,
      service.config.eventsIncludeClientPositions
    else { return nil }
    return args.collectionInteractionArray
  }
}

// MARK: - Ancestor IDs
public extension PromotedMetricsModule {
  @objc(getCurrentOrPendingAncestorIds:rejecter:)
  func currentOrPendingAncestorIDs(
    resolver: RCTPromiseResolveBlock,
    rejecter: RCTPromiseRejectBlock
  ) {
    guard let metricsLogger = metricsLogger else {
      resolver([:])
      return
    }
    let sessionInfo = [
      "logUserId": metricsLogger.currentOrPendingLogUserID,
      "sessionId": metricsLogger.currentOrPendingSessionID,
      "viewId": metricsLogger.currentOrPendingViewID,
    ]
    resolver(sessionInfo)
  }

  @objc(setAncestorIds:)
  func setAncestorIDs(_ ancestorIDs: ReactNativeDictionary?) {
    guard let metricsLogger = metricsLogger else { return }
    if let logUserID = ancestorIDs?["logUserId"] as? String {
      metricsLogger.logUserID = logUserID
    }
    if let sessionID = ancestorIDs?["sessionId"] as? String {
      metricsLogger.sessionID = sessionID
    }
    if let viewID = ancestorIDs?["viewId"] as? String {
      metricsLogger.viewID = viewID
    }
  }
}

// MARK: - Anomaly Handling
private extension PromotedMetricsModule {
  private func validateModuleInitialized() {
    #if DEBUG || PROMOTED_ERROR_HANDLING
    if service == nil && !didPresentAnomalyVC {
      ErrorModalViewController.presentForReactNativeError(
        error: ReactNativeError.moduleNotInitialized
      )
      didPresentAnomalyVC = true
    }
    #endif
  }
}
