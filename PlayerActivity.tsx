import React, {Component, useEffect, useState} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import { EmbedInfo } from 'vdocipher-rn-bridge/type';

// Entry point for PlayerActivity, used to open payer in new activity
export default function PlayerActivity() {

  const [isFullscreen, setIsFullscreen] = useState(false);
  let _player: any;

  useEffect(() => {
    console.log('PlayerActivity did mount');

    return() => {
      console.log('PlayerActivity will unmount');
    }
  }, [])

  const _onEnterFullscreen = () => {
    console.log('onEnterFullscreen');
    setIsFullscreen(true);
  };

  const _onExitFullscreen = () => {
    console.log('onExitFullscreen');
    setIsFullscreen(false);
  };

    const embedInfo: EmbedInfo = {otp: "20160313versASE323o9FvTrF17VOTTAQFP9OTAPHJY2Dxw0XH8l2EWr3p9lbSal", playbackInfo: "eyJ2aWRlb0lkIjoiMDE1ZGU3ZTk3ZjQzNDg2NWFhMTU1Y2E4M2I2OTBmNGIifQ"};

  return (
    <View style={styles.container}>
      <VdoPlayerView
        ref={(player: any) => (_player = player)}
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
        onEnterFullscreen={_onEnterFullscreen}
        onExitFullscreen={_onExitFullscreen}
      />
      {!isFullscreen && (
        <Text style={styles.description}>
          The ui controls for the player are embedded inside the native view
        </Text>
      )}
    </View>
  );
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
