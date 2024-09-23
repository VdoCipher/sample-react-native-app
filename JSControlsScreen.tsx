import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, SafeAreaView} from 'react-native';
import VdoPlayerControls from './VdoPlayerControls';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { RootStackParamList } from './type';


type State = {
  isFullscreen: boolean;
  isInPictureInPictureMode: boolean;
};

export default function JSControlsScreen(props: NativeStackScreenProps<RootStackParamList, 'JSControls'>) {

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInPictureInPictureMode, setIsInPictureInPictureMode] = useState(false);

  useEffect(() => {
    console.log('JSControlsScreen did mount');

    return () => {
      console.log('JSControlsScreen will unmount');
    }
  }, [])

  const _onEnterFullscreen = () => {
    setIsFullscreen(true)
  };

  const _onExitFullscreen = () => {
    setIsFullscreen(false)
  };

  const _onPictureInPictureModeChanged = (isInPictureInPictureMode: boolean) => {
    setIsInPictureInPictureMode(isInPictureInPictureMode)
  };

  const embedInfo = props.route.params.embedInfo;

  return (
    <SafeAreaView style={styles.container}>
      <VdoPlayerControls
        style={
          isFullscreen || isInPictureInPictureMode
            ? styles.playerFullscreen
            : styles.player
        }
        embedInfo={embedInfo}
        showNativeControls={false}
        onInitializationSuccess={() => console.log('init success')}
        onInitializationFailure={() => console.log('init failure')}
        onLoading={(args: any) => console.log('loading')}
        onLoaded={(args: any) => console.log('loaded')}
        onLoadError={({errorDescription}: any) =>
          console.log('load error', errorDescription)
        }
        onError={({errorDescription}: any) =>
          console.log('error', errorDescription)
        }
        onTracksChanged={(args: any) => console.log('tracks changed')}
        onMediaEnded={(args: any) => console.log('ended')}
        onEnterFullscreen={_onEnterFullscreen}
        onExitFullscreen={_onExitFullscreen}
        onPictureInPictureModeChanged={_onPictureInPictureModeChanged}
      />
      {!isFullscreen && (
        <Text style={styles.description}>
          The ui controls for the player are react-native components
        </Text>
      )}
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
