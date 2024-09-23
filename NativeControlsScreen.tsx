import React, {useEffect} from 'react';
import {StyleSheet, Text, SafeAreaView} from 'react-native';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { RootStackParamList } from './type';


export default function NativeControlsScreen(props: NativeStackScreenProps<RootStackParamList, 'NativeControls'>) {
  let _player: any;

  useEffect(() => {
    console.log('NativeControlsScreen did mount');

    return() => {
      console.log('NativeControlsScreen will unmount');
    }
  }, [])

    const embedInfo = props.route.params.embedInfo;
    
  return (
    <SafeAreaView style={styles.container}>
      <VdoPlayerView
        ref={(player: any) => (_player = player)}
        style={styles.player}
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
        onEnterFullscreen={() => console.log('onEnterFullscreen')}
        onExitFullscreen={() => console.log('onExitFullscreen')}
      />
      <Text style={styles.description}>
        The ui controls for the player are embedded inside the native view
      </Text>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  player: {
    height: 'auto',
    width: '100%',
    resizeMode: 'contain'
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
});
