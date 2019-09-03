/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// TODO(macOS ISS#2323203) Copied from RNTesterApp.ios.js

'use strict';

const AsyncStorage = require('AsyncStorage');
// const BackHandler = require('BackHandler');
const Linking = require('Linking');
const React = require('react');
const ReactNative = require('react-native');
const RNTesterActions = require('./RNTesterActions');
const RNTesterExampleContainer = require('./RNTesterExampleContainer');
const RNTesterExampleList = require('./RNTesterExampleList');
const RNTesterList = require('./RNTesterList.macos');
const RNTesterNavigationReducer = require('./RNTesterNavigationReducer');
const URIActionMap = require('./URIActionMap');

const {
  Button,
  AppRegistry,
  // SnapshotViewIOS,
  StyleSheet,
  Text,
  View,
} = ReactNative;

import type {RNTesterExample} from './RNTesterList.macos';
import type {RNTesterAction} from './RNTesterActions';
import type {RNTesterNavigationState} from './RNTesterNavigationReducer';

type Props = {
  exampleFromAppetizeParams: string,
};

const APP_STATE_KEY = 'RNTesterAppState.v2';

const Header = ({onBack, title}: {onBack?: () => mixed, title: string}) => (
  <View style={styles.headerContainer}>
    <View style={styles.header}>
      <View style={styles.headerCenter}>
        <Text style={styles.title}>{title}</Text>
      </View>
      {onBack && (
        <View style={styles.headerLeft}>
          <Button title="Back" onPress={onBack} />
        </View>
      )}
    </View>
  </View>
);

class RNTesterApp extends React.Component<Props, RNTesterNavigationState> {
  _mounted: boolean; // TODO(OSS Candidate ISS#2710739)

  UNSAFE_componentWillMount() {
    //  BackHandler.addEventListener('hardwareBackPress', this._handleBack);
  }

  componentDidMount() {
    this._mounted = true; // TODO(OSS Candidate ISS#2710739)
    Linking.getInitialURL().then(url => {
      AsyncStorage.getItem(APP_STATE_KEY, (err, storedString) => {
        // [TODO(OSS Candidate ISS#2710739)
        if (!this._mounted) {
          return;
        }
        // ]TODO(OSS Candidate ISS#2710739)
        const exampleAction = URIActionMap(
          this.props.exampleFromAppetizeParams,
        );
        const urlAction = URIActionMap(url);
        const launchAction = exampleAction || urlAction;
        if (err || !storedString) {
          const initialAction = launchAction || {type: 'InitialAction'};
          this.setState(RNTesterNavigationReducer(undefined, initialAction));
          return;
        }
        const storedState = JSON.parse(storedString);
        if (launchAction) {
          this.setState(RNTesterNavigationReducer(storedState, launchAction));
          return;
        }
        this.setState(storedState);
      });
    });

    Linking.addEventListener('url', url => {
      this._handleAction(URIActionMap(url));
    });
  }

  // [TODO(OSS Candidate ISS#2710739)
  componentWillUnmount() {
    this._mounted = false;
  }
  // ]TODO(OSS Candidate ISS#2710739)

  _handleBack = () => {
    this._handleAction(RNTesterActions.Back());
  };

  _handleAction = (action: ?RNTesterAction) => {
    if (!action) {
      return;
    }
    const newState = RNTesterNavigationReducer(this.state, action);
    if (this.state !== newState) {
      this.setState(newState, () =>
        AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(this.state)),
      );
    }
  };

  render() {
    if (!this.state) {
      return null;
    }
    if (this.state.openExample) {
      const Component = RNTesterList.Modules[this.state.openExample];
      if (Component.external) {
        return <Component onExampleExit={this._handleBack} />;
      } else {
        return (
          <View style={styles.exampleContainer}>
            <Header onBack={this._handleBack} title={Component.title} />
            <RNTesterExampleContainer module={Component} />
          </View>
        );
      }
    }
    return (
      <View style={styles.exampleContainer}>
        <Header title="RNTester" />
        {/* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
          * comment suppresses an error when upgrading Flow's support for
          * React. To see the error delete this comment and run Flow. */}
        <RNTesterExampleList
          onNavigate={this._handleAction}
          list={RNTesterList}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: {semantic: 'separatorColor'},
    backgroundColor: {semantic: 'windowBackgroundColor'},
  },
  header: {
    height: 40,
    flexDirection: 'row',
  },
  headerLeft: {},
  headerCenter: {
    flex: 1,
    position: 'absolute',
    top: 7,
    left: 0,
    right: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    color: {dynamic: {light: 'black', dark: 'white'}},
  },
  exampleContainer: {
    flex: 1,
  },
});

AppRegistry.registerComponent('SetPropertiesExampleApp', () =>
  require('./SetPropertiesExampleApp'),
);
AppRegistry.registerComponent('RootViewSizeFlexibilityExampleApp', () =>
  require('./RootViewSizeFlexibilityExampleApp'),
);
AppRegistry.registerComponent('RNTesterApp', () => RNTesterApp);

// Register suitable examples for snapshot tests
/* TODO(tomun)
RNTesterList.ComponentExamples.concat(RNTesterList.APIExamples).forEach(
  (Example: RNTesterExample) => {
    const ExampleModule = Example.module;
    if (ExampleModule.displayName) {
      class Snapshotter extends React.Component<{}> {
        render() {
          return (
            <SnapshotViewIOS>
              <RNTesterExampleContainer module={ExampleModule} />
            </SnapshotViewIOS>
          );
        }
      }

      AppRegistry.registerComponent(
        ExampleModule.displayName,
        () => Snapshotter,
      );
    }
  },
);
*/
module.exports = RNTesterApp;
