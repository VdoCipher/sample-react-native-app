import React, {Component} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import { EmbedInfo } from 'vdocipher-rn-bridge/type';

type Props = {};

type State = {
  isFullscreen: boolean;
};

// Entry point for PlayerActivity, used to open payer in new activity
export default class PlayerActivity extends Component<Props, State> {
  _player: any;
  constructor(props: Props) {
    super(props);
    this.state = {
      isFullscreen: false,
    };
    console.log('PlayerActivity contructor');
  }

  componentDidMount() {
    console.log('PlayerActivity did mount');
  }

  componentWillUnmount() {
    console.log('PlayerActivity will unmount');
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
    const embedInfo: EmbedInfo = {otp: "20160313versASE323WnGTFV06zFoQdBkWO59LyjjYBISl5p5w7LJaaDzQhe5Sos", playbackInfo: "eyJ2aWRlb0lkIjoiY2M2ZDhlMjc3NzE4NDI0NWE0M2E1NmM4ZDhlNGYwZjMifQ"};
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
