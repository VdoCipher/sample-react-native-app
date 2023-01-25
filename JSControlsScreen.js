import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View
} from 'react-native';
import VdoPlayerControls from './VdoPlayerControls';

export default class JSControlsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isFullscreen: false,
      isInPictureInPictureMode: false
    }
    console.log('JSControlsScreen contructor');
  }

  componentDidMount() {
    console.log('JSControlsScreen did mount');
  }

  componentWillUnmount() {
    console.log('JSControlsScreen will unmount');
  }

  _onEnterFullscreen = () => {
    this.setState({isFullscreen: true});
  }

  _onExitFullscreen = () => {
    this.setState({isFullscreen: false});
  }

  _onPictureInPictureModeChanged = (isInPictureInPictureMode) => {
    this.setState({
      isInPictureInPictureMode: isInPictureInPictureMode,
    });
  }

  render() {
    const embedInfo = this.props.route.params.embedInfo;
    var isFullscreen = this.state.isFullscreen;
    var isInPictureInPictureMode = this.state.isInPictureInPictureMode;

    return (
      <View style={styles.container}>
        <VdoPlayerControls style={(isFullscreen || isInPictureInPictureMode) ? styles.playerFullscreen : styles.player}
          embedInfo={embedInfo}
          showNativeControls={false}
          onInitializationSuccess={() => console.log('init success')}
          onInitializationFailure={() => console.log('init failure')}
          onLoading={(args) => console.log('loading')}
          onLoaded={(args) => console.log('loaded')}
          onLoadError={({errorDescription}) => console.log('load error', errorDescription)}
          onError={({errorDescription}) => console.log('error', errorDescription)}
          onTracksChanged={(args) => console.log('tracks changed')}
          onMediaEnded={(args) => console.log('ended')}
          onEnterFullscreen={this._onEnterFullscreen}
          onExitFullscreen={this._onExitFullscreen}
          onPictureInPictureModeChanged={this._onPictureInPictureModeChanged}
        />
        { !isFullscreen &&
        <Text style={styles.description}>
          The ui controls for the player are react-native components
        </Text>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  player: {
    height: 200,
    width: '100%',
  },
  playerFullscreen: {
    height: '100%',
    width: '100%',
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
