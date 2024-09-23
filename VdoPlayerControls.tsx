import React, {useCallback, useEffect, useRef, useState} from 'react';
import {StyleSheet, Text, View, TouchableWithoutFeedback, Modal, Platform, StatusBar, SafeAreaView, LayoutChangeEvent } from 'react-native';
import { InferProps } from 'prop-types';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import MatIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/FontAwesome';
import { ErrorDescription } from './type';
import { Track, MediaInfo, CaptionLanguage, VideoQuality, VdoPropTypes, PlaybackProperty } from 'vdocipher-rn-bridge/type';
// @ts-ignore
import RadioButtonRN from 'radio-buttons-react-native';
// @ts-ignore
import  Orientation from 'react-native-orientation';

function digitalTime(time: number) {
  return ~~(time / 60) + ':' + (time % 60 < 10 ? '0' : '') + (time % 60);
}


const MyPropTypes = VdoPropTypes;

export default function VdoPlayerControls(props: InferProps<typeof MyPropTypes>) {

  const _player = useRef<VdoPlayerView>(null);
  let _seekbarWidth!: number;
  let propInterval: NodeJS.Timeout | string | number | undefined;

  const [init, setInit] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [playWhenReady, setPlayWhenReady] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [ended, setEnded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [seekbarPosition, setSeekbarPosition] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInPictureInPictureMode, setIsInPictureInPictureMode] = useState(false);
  const [isCaptionLanguageAvailable, setIsCaptionLanguageAvailable] = useState(false);
  const [isVideoTrackSelectionAvailable, setIsVideoTrackSelectionAvailable] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [items, setItems] = useState<any>([]);
  const [selectedTrack, setSelectedTrack] = useState<Track>({
    id: 0,
    type: '',
    language: '',
    bitrate: 0,
    width: 0,
    height: 0,
    label: ''
  });
  const [type, setType] = useState('video');
  const [initial, setInitial] = useState(-1);
  const [error, setError] = useState({});

  useEffect(() => {
    console.log('VdoPlayerControls did mount');

    return () => {
      console.log('VdoPlayerControls will unmount');
      // clearInterval(propInterval);
    }
  }, [])

  const _onInitSuccess = () => {
    setInit(true)
  };

  const _onInitFailure = (error: {errorDescription: ErrorDescription}) => {
    setInit(false)
    setError(error.errorDescription)
  };

  const _onLoading = () => {
    setLoaded(false)
  };

  const _onLoaded = (metaData: {mediaInfo: MediaInfo}) => {
    setLoaded(true)
    setDuration( metaData.mediaInfo.duration / 1000)
    // propInterval = setInterval(
    //   () => {
    //     _player.getPlaybackPropertiesV2().then((playbackProperties: PlaybackProperty) => {
    //       console.log("tp:", playbackProperties.totalPlayed);
    //       console.log("tc: ", playbackProperties.totalCovered);
    //     }
    //   )},
    //   10000,
    // );

    _isCaptionLanguageAvailable();
    _isVideoTrackSelectionAvailable();
  };

  const _onTracksChanged = (tracks: {availableTracks: Array<Track>, selectedTracks: Array<Track>}) => {
    //todo
  };

  const _onPlayerStateChanged = (newState: {playWhenReady: boolean, playerState: string}) => {
    const {playerState} = newState;
    setBuffering(playerState === 'buffering')
    setEnded(playerState === 'ended')

    if (playerState === 'ended') {
      setPlayWhenReady(false)
    }
  };

  const _onProgress = (progress: {currentTime: number}) => {
    const newPosition = progress.currentTime / 1000;
    const relativePosition = newPosition / duration;
    const seekbarPosition = _seekbarWidth * relativePosition;

    setPosition(newPosition)
    setSeekbarPosition(seekbarPosition)
  };

  const _onPlayButtonTouch = () => {
    if (ended) {
      _player.current?.seek(0);
      setPlayWhenReady(p => p = true)
      setPosition(po => po = 0)
      setSeekbarPosition(spo => spo = 0)
    } else {
      setPlayWhenReady(p => p = !playWhenReady)
    }
  };

  const _onPictureInPictureModeChanged = (pictureInPictureModeInfo: {isInPictureInPictureMode: boolean}) => {
    setIsInPictureInPictureMode( pictureInPictureModeInfo.isInPictureInPictureMode)
    if (props.onPictureInPictureModeChanged) {
      props.onPictureInPictureModeChanged(
        pictureInPictureModeInfo.isInPictureInPictureMode,
      );
    }
  };

  const _onProgressTouch = (event: any) => {
    if (_seekbarWidth) {
      var positionX = event.nativeEvent.locationX;
      var targetSeconds = Math.floor(
        (positionX / _seekbarWidth) * duration,
      );
      _player.current?.seek(targetSeconds * 1000);
    }
  };

  const _toggleFullscreen = () => {
    if (isFullscreen) {
      if (Platform.OS == 'android'){
        Orientation.lockToPortrait();
        StatusBar.setHidden(false);
      }
      props.onExitFullscreen?.();
    } else {
      if (Platform.OS == 'android'){
        Orientation.lockToLandscape();
        StatusBar.setHidden(true);
      }
      props.onEnterFullscreen?.();
    }

    setIsFullscreen(!isFullscreen)
  };

  const _isCaptionLanguageAvailable = () => {
    _player.current?.getCaptionLanguages()
    .then(async (captionLanguages: any) => {
      if (captionLanguages.length > 0) {
        setIsCaptionLanguageAvailable(true)
      }
    });
  }

  const _isVideoTrackSelectionAvailable = () => {
    _player.current?.getVideoQualities()
    .then(async (videoQualities: any) => {
      if (videoQualities.length > 1) {
        setIsVideoTrackSelectionAvailable(true)
      }
    });
  }

  const _showCaptionTrackSelectionDialog = () => {
    _player.current?.getCaptionLanguages()
      .then(async (captionLanguages: any) => {
        var selectedTrack = await _player.current?.getSelectedCaptionLanguage();

        captionLanguages.forEach((captionLanguage: CaptionLanguage) => {
          captionLanguage.label = captionLanguage.language;
        });

        var disable = {id: -1, language: "", label: "Turn off Captions"};
        captionLanguages.push(disable);

        if (selectedTrack == null) {
          selectedTrack = captionLanguages[captionLanguages.length - 1];
        }

        _loadDialog(captionLanguages, 'caption', selectedTrack);
      })
      .catch((error: any) => {
        console.log('Api call error');
        alert(error.message);
      });
  };

  const _showVideoTrackSelectionDialog = () => {
    _player.current?.getVideoQualities()
      .then(async (videoQualities: any) => {
        var [videoDuration, selectedTrack, isAdaptive] = await Promise.all([
          _player.current?.getDuration(),
          _player.current?.getSelectedVideoQuality(),
          _player.current?.isAdaptive(),
        ]);
        if (Platform.OS == "android") {
          var audioQuality: any = await _player.current?.getSelectedAudioQuality();
        }
        videoQualities.forEach(async (videoQuality: VideoQuality & {label?: string}) => {
          if (Platform.OS == "android") {
            var bitrateInKbps =
            (videoQuality.bitrate + audioQuality.bitrate) / 1024;
          } else {
            var bitrateInKbps =
              (videoQuality.bitrate) / 1024;
          }
          var roundedOffBitrateInKbps = Math.round(bitrateInKbps / 10.0) * 10;
          var videoDurations: any = videoDuration;
          if (Platform.OS == "android") {
            var dataExpenditureInMB = _totalDataExpenditureInMb(
              videoQuality.bitrate + audioQuality.bitrate,
              videoDurations.duration,
            );
          } else {
            var dataExpenditureInMB = _totalDataExpenditureInMb(
              videoQuality.bitrate,
              videoDurations.duration,
            );
          }
          videoQuality.label =
            '(' +
            dataExpenditureInMB +
            ', ' +
            roundedOffBitrateInKbps +
            'kbps)';
        });
        var auto = {id: -2, bitrate: 0, width: 0, height: 0, label: 'Auto'};
        videoQualities.push(auto);

        if (selectedTrack == null || isAdaptive) {
          selectedTrack = videoQualities[videoQualities.length - 1];
        }

        _loadDialog(videoQualities, 'video', selectedTrack);
      })
      .catch((error: any) => {
        console.log('Api call error', error);
        alert(error.message);
      });
  };

  const _totalDataExpenditureInMb = (bitsPerSec: number, videoDuration: number) => {
    var totalBytes =
      bitsPerSec <= 0 ? 0 : (bitsPerSec * (videoDuration / 1000)) / 8;
    if (totalBytes == 0) {
      return '-';
    } else {
      var totalMB = totalBytes / (1024 * 1024);

      if (totalMB < 1) {
        return '1MB';
      } else if (totalMB < 1000) {
        return parseInt(totalMB.toString()) + ' MB';
      } else {
        var value = totalMB / 1024;
        return value.toFixed(2) + ' GB';
      }
    }
  };

  const _loadDialog = async (items: any, type: string, selectedTrack: any) => {
    var initial = initialSelectedTrack(items, selectedTrack);

    setItems(items)
    setSelectedTrack(selectedTrack)
    setType(type)
    setInitial(initial)

    changeModalVisibility();
  };

  const initialSelectedTrack = (items: any, selectedTrack: any) => {
    var initial = items.length
    for (var index = 0; index < items.length; index ++) {
      if (items[index].id == selectedTrack.id) {
        initial = index + 1;
        return initial;
      }
    }
  }

  const changeModalVisibility = () => {
    setModalVisible(!modalVisible)
  }

  const handleRadioChange = (e: any) => {
    if (selectedTrack.id == e.id) {
      return;
    }
    changeModalVisibility();
    var player = _player;
    for (var index = 0; index < items.length; index ++) {
      if (items[index].id === e.id) {
        const nextSelectedTrack: Track = items[index];
        setSelectedTrack(s => s = nextSelectedTrack);
        if (nextSelectedTrack.id == -2) {
          player.current?.enableAdaptiveVideo();
        } else if (nextSelectedTrack.id == -1) {
          player.current?.disableCaptions();
        } else if (type === 'video') {
          player.current?.setVideoQuality(nextSelectedTrack);
        } else {
          player.current?.setCaptionLanguage(nextSelectedTrack);
        }
        break;
      }
    }
  }

  const useComponentWidth = () => {
    const [layoutWidth, setLayoutWidth] = useState(0);
    const onLayout = useCallback((event: LayoutChangeEvent) => {
      setLayoutWidth(event.nativeEvent.layout.width);
    }, []);
      return { layoutWidth, onLayout };
  };

  const _renderModal = () => {
    return (
      <View style={styles.player.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          changeModalVisibility();
        }}>
        <View style={styles.player.centeredView}>
          <View style={styles.player.modalView}>
            <RadioButtonRN
              style={{width: 200}}
              data={items}
              selectedBtn={(e: any) => handleRadioChange(e)}
              box={false}
              initial={initial}
              />
          </View>
        </View>
      </Modal>
      </View>
    )
  }

  const _renderSeekbar = () => {
    const {layoutWidth, onLayout} = useComponentWidth();
    _seekbarWidth = layoutWidth;
    return (
      <TouchableWithoutFeedback onPress={_onProgressTouch}>
        <View style={styles.seekbar.container}>
          <View
            style={styles.seekbar.track}
            onLayout={onLayout}>
            <View
              style={[styles.seekbar.fill, {width: seekbarPosition}]}
            />
          </View>
          <View
            style={[styles.seekbar.handle, {left: seekbarPosition}]}>
            <View style={[styles.seekbar.circle, {backgroundColor: '#FFF'}]} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  var showPlayIcon = !playWhenReady;

  return (
    <SafeAreaView style={styles.player.container}>
      <VdoPlayerView
        ref={_player}
        style={styles.player.video}
        {...props}
        playWhenReady={playWhenReady}
        showNativeControls={false}
        onInitializationSuccess={_onInitSuccess}
        onInitializationFailure={_onInitFailure}
        onLoading={_onLoading}
        onLoaded={_onLoaded}
        onTracksChanged={_onTracksChanged}
        onPlayerStateChanged={_onPlayerStateChanged}
        onProgress={_onProgress}
        onPictureInPictureModeChanged={_onPictureInPictureModeChanged}
      />
      {!isInPictureInPictureMode && (
        <View style={styles.controls.container}>
          <TouchableWithoutFeedback onPress={_onPlayButtonTouch}>
            <Icon
              name={showPlayIcon ? 'play' : 'pause'}
              size={30}
              color="#FFF"
            />
          </TouchableWithoutFeedback>
          <Text style={styles.controls.position}>
            {digitalTime(Math.floor(position))}
          </Text>
          {_renderSeekbar()}
          {_renderModal()}
          <Text style={styles.controls.duration}>
            {digitalTime(Math.floor(duration))}
          </Text>
          { isCaptionLanguageAvailable &&
            <TouchableWithoutFeedback
              onPress={() => _showCaptionTrackSelectionDialog()}>
              <MatIcon
                name="closed-caption"
                style={styles.controls.captions}
                size={30}
                color="#FFF"
              />
            </TouchableWithoutFeedback>
          }
          { isVideoTrackSelectionAvailable &&
            <TouchableWithoutFeedback
              onPress={() => _showVideoTrackSelectionDialog()}>
              <MatIcon
                name="high-quality"
                style={styles.controls.quality}
                size={30}
                color="#FFF"
              />
            </TouchableWithoutFeedback>
          }
          <TouchableWithoutFeedback onPress={_toggleFullscreen}>
            <MatIcon
              name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
              style={styles.controls.fullscreen}
              size={30}
              color="#FFF"
            />
          </TouchableWithoutFeedback>
        </View>
      )}
    </SafeAreaView>
  );
}

VdoPlayerControls.propTypes = MyPropTypes;

const styles = {
  player: StyleSheet.create({
    container: {
      backgroundColor: '#000',
      alignSelf: 'stretch',
    },
    video: {
      overflow: 'hidden',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 22,
    },
    modalView: {
      margin: 20,
      backgroundColor: 'white',
      borderRadius: 20,
      padding: 35,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    button: {
      borderRadius: 20,
      padding: 10,
      elevation: 2,
    },
    buttonOpen: {
      backgroundColor: '#F194FF',
    },
    buttonClose: {
      backgroundColor: '#2196F3',
    },
    textStyle: {
      color: 'white',
      fontWeight: 'bold',
      textAlign: 'center',
    },
    modalText: {
      marginBottom: 15,
      textAlign: 'center',
    },
  }),
  controls: StyleSheet.create({
    container: {
      backgroundColor: 'rgba(0, 0, 0, 0.4)',
      height: 48,
      left: 0,
      bottom: 0,
      right: 0,
      position: 'absolute',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
    },
    position: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 14,
      textAlign: 'right',
      paddingHorizontal: 12,
    },
    duration: {
      backgroundColor: 'transparent',
      color: '#FFF',
      fontSize: 14,
      textAlign: 'right',
      paddingLeft: 12,
    },
    progressBarContainer: {
      flexDirection: 'row',
      flex: 1,
      alignItems: 'center',
    },
    progressBar: {
      flex: 1,
    },
    fullscreen: {
      marginLeft: 10,
    },
    captions: {
      marginLeft: 10,
    },
    quality: {
      marginLeft: 10,
    },
  }),
  seekbar: StyleSheet.create({
    container: {
      flex: 1,
      height: 20,
      marginLeft: 20,
      marginRight: 20,
    },
    track: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      height: 2,
      position: 'relative',
      top: 10,
      width: '100%',
    },
    fill: {
      backgroundColor: '#FFF',
      height: 2,
      width: '100%',
    },
    handle: {
      position: 'absolute',
      marginLeft: -6,
      height: 20,
      width: 20,
    },
    circle: {
      borderRadius: 12,
      position: 'relative',
      top: 5,
      left: 6,
      height: 12,
      width: 12,
    },
  }),
};
