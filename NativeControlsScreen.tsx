import React, {Component} from 'react';
import {StyleSheet, Text, View, Button} from 'react-native';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { RootStackParamList } from './type';

type Props = NativeStackScreenProps<RootStackParamList, 'NativeControls'>;

type State = {
  isFullscreen: boolean;
};

export default class NativeControlsScreen extends Component<Props, State> {
  _player: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      isFullscreen: false,
    };
    console.log('NativeControlsScreen contructor');
  }

  componentDidMount() {
    console.log('NativeControlsScreen did mount');
  }

  componentWillUnmount() {
    console.log('NativeControlsScreen will unmount');
  }

  _onEnterFullscreen = () => {
    console.log('onEnterFullscreen');
    this.setState({isFullscreen: true});
  };

  _onExitFullscreen = () => {
    console.log('onExitFullscreen');
    this.setState({isFullscreen: false});
  };

  render() {
    const embedInfo = this.props.route.params.embedInfo;
    var isFullscreen = this.state.isFullscreen;

    return (
      <View style={styles.container}>
        <VdoPlayerView
          ref={(player: any) => (this._player = player)}
          style={isFullscreen ? styles.playerFullscreen : styles.player}
          embedInfo={embedInfo}
          onInitializationSuccess={() => console.log('init success')}
          onInitializationFailure={(error: any) =>
            console.log('init failure', error)
          }
          onLoading={(args: any) => console.log('loading')}
          onLoaded={(args: any) => console.log('loaded')}
          onLoadError={({errorDescription}: any) =>
            console.log('load error', errorDescription)
          }
          onError={({errorDescription}: any) =>
            console.log('error', errorDescription)
          }
          onTracksChanged={(args: any) => console.log('tracks changed')}
          onPlaybackSpeedChanged={(speed: any) =>
            console.log('speed changed to', speed)
          }
          onMediaEnded={(args: any) => console.log('ended')}
          onEnterFullscreen={this._onEnterFullscreen}
          onExitFullscreen={this._onExitFullscreen}
        />
        {!isFullscreen && (
          <Text style={styles.description}>
            The ui controls for the player are embedded inside the native view
          </Text>
        )}
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
