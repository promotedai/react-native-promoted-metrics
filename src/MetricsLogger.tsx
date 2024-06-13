import * as React from 'react'
import { NativeModules } from 'react-native'

import { ImpressionSourceType } from './ImpressionSourceType'
import type {
  LogImpressionArgs,
  LogActionArgs,
  LogViewArgs,
} from './LoggerArgs'
import type { PromotedMetricsType } from './PromotedMetricsType'
import { AutoViewState, useAutoViewState  } from './ViewTracker'

const { PromotedMetrics } = NativeModules
const P = PromotedMetrics as PromotedMetricsType

/**
 * You can create a `MetricsLogger` tied into a Component
 * in the hierarchy to automatically inherit the view scope
 * of that Component. See `useMetricsLogger()`.
 *
 * Alternatively, if no Component is available to you, you
 * can create an unscoped `MetricsLogger` that inherits the
 * frontmost view scope. This is not the preferred usage;
 * use the scoped version when available. See
 * `useUnscopedMetricsLogger()`.
 */
export class MetricsLogger {

  autoViewStateRef?: React.MutableRefObject<AutoViewState>

  constructor(
    autoViewStateRef?: React.MutableRefObject<AutoViewState>
  ) {
    this.autoViewStateRef = autoViewStateRef
  }

  logImpression({
    content,
    sourceType = ImpressionSourceType.Unknown,
  }: LogImpressionArgs): void {
    const {
      autoViewId,
      hasSuperimposedViews,
    } = this.autoViewStateRef.current
    P.logImpression({
      autoViewId,
      content,
      hasSuperimposedViews,
      sourceType,
    })
  }

  logAction({
    cart = undefined,
    content,
    actionType,
    destinationScreenName = '',
    actionName = '',
  }: LogActionArgs): void {
    const {
      autoViewId,
      hasSuperimposedViews,
    } = this.autoViewStateRef.current
    P.logAction({
      actionName,
      actionType,
      autoViewId,
      cart,
      content,
      destinationScreenName,
      hasSuperimposedViews,
    })
  }

  logView({
    routeName,
    routeKey,
  }: LogViewArgs): void {
    P.logView({ routeName, routeKey })
  }
}

export function useMetricsLogger() {
  const autoViewState = useAutoViewState()
  return new MetricsLogger(autoViewState)
}

export function useUnscopedMetricsLogger() {
  return new MetricsLogger(null)
}

export function withMetricsLogger<P>(
  Component: React.ComponentType<P>
) {
  const MetricsLoggerComponent = ({
    ...rest
  }) : React.ReactElement => {
    const autoViewStateRef = useAutoViewState()
    const metricsLogger = new MetricsLogger(autoViewStateRef)
    return (
      <Component
        autoViewStateRef={autoViewStateRef}
        metricsLogger={metricsLogger}
        {...rest}
      />
    )
  }
  return MetricsLoggerComponent
}
