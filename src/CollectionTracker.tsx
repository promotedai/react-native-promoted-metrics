import * as React from 'react'
import { NativeModules, View } from 'react-native'
import { State, TapGestureHandler } from 'react-native-gesture-handler'
import { useNavigation } from 'react-navigation-hooks'
import { v4 as uuidv4 } from 'uuid'

import { ActionType } from './ActionType'
import type { Content } from './PromotedMetricsType'
import { ImpressionSourceType } from './ImpressionSourceType'
import { useImpressionTracker } from './useImpressionTracker'

const { PromotedMetrics } = NativeModules

export interface CollectionTrackerProps {
  onViewableItemsChanged: (any) => void
  renderItem: (any) => any
  viewabilityConfig: any
  viewabilityConfigCallbackPairs: Array<any>
}

export interface CollectionTrackerArgs {
  contentCreator: (any) => Content
  sourceType: ImpressionSourceType
}

export function CollectionTracker<P extends CollectionTrackerProps>({
  contentCreator,
  sourceType = ImpressionSourceType.ClientBackend
} : CollectionTrackerArgs) {
  return (Component: React.ComponentType<P>) => {
    const trackerId = uuidv4()

    const WrappedComponent = (
      {
        onViewableItemsChanged,
        renderItem,
        viewabilityConfig,
        viewabilityConfigCallbackPairs,
        ...rest
      }: P
    ) : React.ReactElement => {
      const navigation = useNavigation()

      const {
        _viewabilityConfig,
        _onViewableItemsChanged,
      } = useImpressionTracker(
        ({ item }) => contentCreator(item),
        trackerId,
        sourceType,
      )

      // Merge existing viewability configs with our own if needed.
      // Otherwise, just use our viewability config.
      const viewabilityArgs = (
        onViewableItemsChanged ||
        viewabilityConfig ||
        viewabilityConfigCallbackPairs
      ) ? {
        viewabilityConfigCallbackPairs: React.useRef([
          ...(viewabilityConfigCallbackPairs || []),
          ...((onViewableItemsChanged != null && viewabilityConfig != null)
            ? [{ onViewableItemsChanged, viewabilityConfig }]
            : []),
          {
            onViewableItemsChanged: _onViewableItemsChanged,
            viewabilityConfig: _viewabilityConfig,
          },
        ])
      } : {
        onViewableItemsChanged: _onViewableItemsChanged,
        viewabilityConfig: _viewabilityConfig,
      }

      // Wrap the rendered item with an action logger.
      // TODO: Allow configuration so that controls within
      // the rendered item can trigger different actions.
      const _renderItem = ({ item }) => {
        const _onTapForItem = (item) => (event) => {
          if (event.nativeEvent.state === State.ACTIVE) {
            PromotedMetrics.collectionViewActionDidOccur(
              ActionType.Navigate,
              contentCreator(item),
              trackerId
            )
          }
        }
        return (
          <TapGestureHandler
            onGestureEvent={_onTapForItem(item)}
            onHandlerStateChange={_onTapForItem(item)}
          >
            <View>
              {renderItem({ item })}
            </View>
          </TapGestureHandler>
        )
      }

      return (
        <Component
          renderItem={_renderItem}
          {...viewabilityArgs}
          {...rest}
        />
      )
    }

    WrappedComponent.displayName = `CollectionTracker(${
      Component.displayName || Component.name
    })`

    return WrappedComponent //React.useCallback(WrappedComponent, [])
  }
}

export function useCollectionTracker<
  P extends CollectionTrackerProps
>(
  args: CollectionTrackerArgs
) {
  return (Component: React.ComponentType<P>) => {
    return React.useCallback(CollectionTracker(args)(Component), [])
  }
}
