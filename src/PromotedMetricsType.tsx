import type { ActionType } from './ActionType'
import type { Cart } from './Cart'
import type { Content } from './Content'
import type { ImpressionSourceType } from './ImpressionSourceType'
import type {
  InternalLogImpressionArgs,
  InternalLogActionArgs,
  LogAutoViewArgs,
  LogViewArgs,
} from './LoggerArgs'

/** Provides session context for Promoted integration points. */
export interface AncestorIds {
  logUserId?: string
  sessionId?: string
  viewId?: string
}

export interface CollectionDidMountArgs {
  /** AutoViewId for impression */
  autoViewId: string
  /** Identifier for collection view to track */
  collectionId: string
  /** Origin of impressed content */
  sourceType: ImpressionSourceType
}

export interface CollectionDidChangeArgs {
  /** AutoViewId for impression */
  autoViewId: string
  /** Identifier for collection view to track */
  collectionId: string
  /** Whether this view may not be topmost. */
  hasSuperimposedViews: boolean
  /** Index paths for visible content. */
  indexPaths: Array<Array<number>>
  /** List of currently visible content */
  visibleContent: Array<Content>
}

export interface CollectionActionDidOccurArgs {
  /** Action name, used if `actionType` is Custom */
  actionName: string
  actionType: ActionType
  /** AutoViewId for action */
  autoViewId: string
  /** Shopping cart involved in the action */
  cart: Cart
  /** Identifier for collection view to track */
  collectionId: string
  /** Content involved in the action. */
  content: Content
  /** Whether this view may not be topmost. */
  hasSuperimposedViews: boolean
  /** Index path for content. */
  indexPath: Array<number>
}

export interface CollectionWillUnmountArgs {
  /** AutoViewId for impression */
  autoViewId: string
  /** Identifier for collection view to track */
  collectionId: string
}

// Maintainers:
// IF YOU CHANGE THIS FILE, also update BuildProject/App.tsx
// to include a test for your change.

/** Logging interface. */
export type PromotedMetricsType = {
  /**
   * Call when sign-in completes with specified user ID.
   * Starts logging session with the provided user and logs a
   * user event.
   */
  startSessionAndLogUser(
    userId: string
  ): void

  /**
   * Call when sign-in completes with no user.
   * Starts logging session with signed-out user and logs a
   * user event.
   */
  startSessionAndLogSignedOutUser(): void

  /**
   * Logs an impression for given content.
   * Typically, you would call withCollectionTracker() for use with
   * SectionLists and FlatLists. This method should only be used
   * outside of those components.
   */
  logImpression({
    autoViewId,
    content,
    hasSuperimposedViews,
    sourceType,
  } : InternalLogImpressionArgs): void

  /**
   * Logs an action on given content.
   * Any action type can have a custom name to distinguish different
   * actions in the same class. If you use ActionType.CustomActionType,
   * use this method and provide a name for the action.
   */
  logAction({
    actionName,
    actionType,
    autoViewId,
    cart,
    content,
    destinationScreenName,
    hasSuperimposedViews,
  } : InternalLogActionArgs): void

  // View logging

  /**
   * Logs a screen view. Prefer to use `CollectionTracker` and
   * `ViewTracker` if you can. In situations where you cannot do so,
   * such as logging a view for a screen that generates no impressions
   * or action, use this method.
   */
  logView({
    routeName,
    routeKey,
  } : LogViewArgs): void

  /**
   * Used internally to log auto views.
   * Don't call this method from outside the `@promotedai` library.
   */
  logAutoView({
    routeName,
    routeKey,
    autoViewId,
  } : LogAutoViewArgs): void

  // Collection tracking

  /**
   * Begins tracking session for given collection view.
   * Can be called multiple times in succession, such as when a collection
   * view reloads on a timer. In these cases, the impression logging state
   * from the previous session will persist.
   */
  collectionDidMount({
    autoViewId,
    collectionId,
    sourceType,
  } : CollectionDidMountArgs): void

  /**
   * Logs impressions for changed content.
   * Call this method with currently visible content and the underlying
   * `ImpressionLogger` will calculate deltas and log appropriate events.
   */
  collectionDidChange({
    autoViewId,
    collectionId,
    hasSuperimposedViews,
    indexPaths,
    visibleContent,
  } : CollectionDidChangeArgs): void

  /**
   * Logs actions for content in a given collection view.
   * Call this method when an action occurs within a tracked collection.
   */
  collectionActionDidOccur({
    actionName,
    actionType,
    autoViewId,
    cart,
    collectionId,
    content,
    hasSuperimposedViews,
    indexPath,
  } : CollectionActionDidOccurArgs): void

  /**
   * Ends tracking session for given collection.
   * Drops all associated impression logging state.
   */
  collectionWillUnmount({
    autoViewId,
    collectionId,
  } : CollectionWillUnmountArgs): void

  // Ancestor IDs

  /** Returns ancestor IDs that will be used for initial values. */
  getCurrentOrPendingAncestorIds(): Promise<AncestorIds>

  /** Sets external ancestor IDs in logger. */
  setAncestorIds(
    ancestorIds: AncestorIds
  ): void
}
