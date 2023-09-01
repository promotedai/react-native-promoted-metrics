import PromotedMetrics, {
  ActionType,
  ImpressionSourceType,
  useCollectionTracker,
  useMetricsLogger
} from '@promotedai/react-native-metrics'
import type { AncestorIds } from '@promotedai/react-native-metrics'
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react'
import type { Node } from 'react'
import {
  Button,
  FlatList,
  Platform,
  SafeAreaView,
  StatusBar,
  Text,
  View,
  useColorScheme,
} from 'react-native'

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen'

const TestScreen: () => Node = () => {
  const isDarkMode = useColorScheme() === 'dark'

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  }

  const [text, setText] = useState('')

  const handleTestAll = () => {
    var allMessages = text + '\n'
    const recordTestPassed = (message) => {
      allMessages += 'Passed: ' + message + '\n'
    }

    try {
      testStartSession(recordTestPassed)
      testLogEvents(recordTestPassed)
      testCollectionView(recordTestPassed)
      testAncestorIds(recordTestPassed)
      allMessages += 'All logging passed'
      setText(allMessages)
    } catch (err) {
      setText(err.message)
    }
  }

  const testStartSession = (recordTestPassed) => {
    PromotedMetrics.startSessionAndLogUser('foobar')
    recordTestPassed('startSessionAndLogUser')

    PromotedMetrics.startSessionAndLogSignedOutUser()
    recordTestPassed('startSessionAndLogSignedOutUser')
  }

  const testLogEvents = (recordTestPassed) => {
    const content = {
      contentId: 'foobar',
      insertionId: 'batman',
      name: 'Dick Greyson',
    }

    PromotedMetrics.logImpression({
      autoViewId: 'fake-auto-view-id',
      content,
      hasSuperimposedViews: false,
      sourceType: ImpressionSourceType.Delivery,
    })
    recordTestPassed('logImpression')

    PromotedMetrics.logAction({
      actionName: '',
      actionType: ActionType.Navigate,
      autoViewId: 'fake-auto-view-id',
      content,
      destinationScreenName: 'Fake Details Screen',
      hasSuperimposedViews: false,
    })
    recordTestPassed('logAction')

    PromotedMetrics.logView({
      routeKey: 'fake-route-key',
      routeName: 'Fake Route Name',
    })
    recordTestPassed('logView')

    PromotedMetrics.logAutoView({
      autoViewId: 'fake-auto-view-id',
      routeKey: 'route-key',
      routeName: 'Fake Route Name',
    })
    recordTestPassed('logAutoView')
  }

  const testCollectionView = (recordTestPassed) => {
    const content = {
      contentId: 'foobar',
      insertionId: 'batman',
      name: 'Dick Greyson',
    }

    PromotedMetrics.collectionDidMount({
      autoViewId: 'fake-auto-view-id',
      collectionId: 'fake-collection-id',
      sourceType: ImpressionSourceType.Delivery,
    })
    recordTestPassed('collectionViewDidMount')

    PromotedMetrics.collectionDidChange({
      autoViewId: 'fake-auto-view-id',
      collectionId: 'fake-collection-id',
      hasSuperimposedViews: false,
      visibleContent: [content],
    })
    recordTestPassed('collectionViewDidChange')

    PromotedMetrics.collectionActionDidOccur({
      actionName: '',
      actionType: ActionType.Navigate,
      autoViewId: 'fake-auto-view-id',
      collectionId: 'fake-collection-id',
      content,
      hasSuperimposedViews: false,
    })
    recordTestPassed('collectionViewActionDidOccur')

    PromotedMetrics.collectionWillUnmount({
      autoViewId: 'fake-auto-view-id',
      collectionId: 'fake-collection-id',
    })
    recordTestPassed('collectionViewWillUnmount')
  }

  const testAncestorIds = (recordTestPassed) => {
    PromotedMetrics.getCurrentOrPendingAncestorIds()
    recordTestPassed('getCurrentOrPendingAncestorIds')

    const ancestorIds = {
      anonUserId: 'batman',
      sessionId: 'gotham',
      viewId: 'joker'
    } as AncestorIds
    PromotedMetrics.setAncestorIds(ancestorIds)
    recordTestPassed('setAncestorIds')
  }

  let TrackedList = null
  try {

    TrackedList = useCollectionTracker({
      contentCreator: (item) => ({
        contentId: item.contentId,
        insertionId: item.insertionId,
        name: item.title
      }),
      sourceType: ImpressionSourceType.Delivery
    })(FlatList)

    const content = {
      contentId: 'foobar',
      insertionId: 'batman',
      name: 'Dick Greyson',
    }

    const metricsLogger = useMetricsLogger()

    metricsLogger.logImpression({
      content,
      sourceType: ImpressionSourceType.ClientBackend
    })

    metricsLogger.logAction({
      actionName: 'foo',
      actionType: ActionType.AddToCart,
      content,
      destinationScreenName: ''
    })

    metricsLogger.logView({
      routeKey: 'key',
      routeName: 'name'
    })

    useEffect(() => {
      setText('Passed: useCollectionTracker\n' +
              'Passed: metricsLogger\n' +
              'All hooks passed')
    }, [])
  } catch (err) {
    useEffect(() => {
      setText(err.message)
    }, [])
  }

  const testID = (id) => (
    Platform.OS === 'ios' ? {
      testID: id
    } : {
      accessibilityLabel: id
    }
  )

  const Item = ({ name }) => (
    <View>
      <Text>[[[{name}]]]</Text>
    </View>
  );
  const renderItem = ({ item }) => (
    <Item name={item.name} />
  );

  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <Button
        onPress={handleTestAll}
        title='Test All'
        {...testID('test-all-button')}/>
      <Text {...testID('messages-text')}>
        {text}
      </Text>
      <Text>List</Text>
      <TrackedList
        data={[{
          name: 'batman',
          contentId: 'robin',
          insertionId: 'joker'
        }]}
        renderItem={renderItem}
        keyExtractor={item => item.contentId}
      />
    </SafeAreaView>
  )
}

const Stack = createNativeStackNavigator()
const App: () => Node = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={TestScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

export default App
