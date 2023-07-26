import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableWithoutFeedback, Modal, Platform, StatusBar, SafeAreaView } from 'react-native';
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

type Props = InferProps<typeof MyPropTypes>;

type State = {
  error?: ErrorDescription
  init: boolean,
  loaded: boolean,
  playWhenReady: boolean,
  buffering: boolean,
  ended: boolean,
  duration: number,
  position: number,
  speed: number,
  seekbarPosition: number,
  isFullscreen: boolean,
  isInPictureInPictureMode: boolean,
  isCaptionLanguageAvailable: boolean,
  modalVisible: boolean,
  items: any,
  selectedTrack: any,
  type: string,
  initial: number
};

export default class VdoPlayerControls extends Component<Props, State> {
  _player: any;
  _seekbarWidth!: number;
  propInterval: NodeJS.Timeout | string | number | undefined;
  static propTypes: typeof MyPropTypes;

  constructor(props: Props) {
    super(props);
    this.state = {
      init: false,
      loaded: false,
      playWhenReady: false,
      buffering: false,
      ended: false,
      duration: 0,
      position: 0,
      speed: 1,
      seekbarPosition: 0,
      isFullscreen: false,
      isInPictureInPictureMode: false,
      isCaptionLanguageAvailable: false,
      modalVisible: false,
      items: [],
      selectedTrack: {},
      type: 'video',
      initial: -1
    };
  }

  componentWillUnmount() {
    console.log('VdoPlayerControls will unmount');
    clearInterval(this.propInterval);
  }

  _onInitSuccess = () => {
    this.setState({
      init: true,
    });
  };

  _onInitFailure = (error: {errorDescription: ErrorDescription}) => {
    this.setState({
      init: false,
      error: error.errorDescription,
    });
  };

  _onLoading = () => {
    this.setState({
      loaded: false,
    });
  };

  _onLoaded = (metaData: {mediaInfo: MediaInfo}) => {
    this.setState({
      loaded: true,
      duration: metaData.mediaInfo.duration / 1000,
    });
    this.propInterval = setInterval(
      () => {
        this._player.getPlaybackPropertiesV2().then((playbackProperties: PlaybackProperty) => {
          console.log("tp:", playbackProperties.totalPlayed);
          console.log("tc: ",playbackProperties.totalCovered);
        }    
      )},
      10000,
    );

    this._isCaptionLanguageAvailable();
  };

  _onTracksChanged = (tracks: {availableTracks: Array<Track>, selectedTracks: Array<Track>}) => {
    //todo
  };

  _onPlayerStateChanged = (newState: {playWhenReady: boolean, playerState: string}) => {
    const {playerState} = newState;
    this.setState({
      buffering: playerState === 'buffering',
      ended: playerState === 'ended',
    });
  };

  _onProgress = (progress: {currentTime: number}) => {
    const newPosition = progress.currentTime / 1000;
    const relativePosition = newPosition / this.state.duration;
    const seekbarPosition = this._seekbarWidth * relativePosition;

    this.setState({
      position: newPosition,
      seekbarPosition,
    });
  };

  _onPlayButtonTouch = () => {
    if (this.state.ended) {
      this._player.seek(0);
    } else {
      this.setState(state => {
        return {
          playWhenReady: !state.playWhenReady,
        };
      });
    }
  };

  _onPictureInPictureModeChanged = (pictureInPictureModeInfo: {isInPictureInPictureMode: boolean}) => {
    this.setState({
      isInPictureInPictureMode:
        pictureInPictureModeInfo.isInPictureInPictureMode,
    });
    if (this.props.onPictureInPictureModeChanged) {
      this.props.onPictureInPictureModeChanged(
        pictureInPictureModeInfo.isInPictureInPictureMode,
      );
    }
  };

  _onProgressTouch = (event: any) => {
    if (this._seekbarWidth) {
      var positionX = event.nativeEvent.locationX;
      var targetSeconds = Math.floor(
        (positionX / this._seekbarWidth) * this.state.duration,
      );
      this._player.seek(targetSeconds * 1000);
    }
  };

  _toggleFullscreen = () => {
    if (this.state.isFullscreen) {
      if (Platform.OS == 'android'){
        Orientation.lockToPortrait();
        StatusBar.setHidden(false);
      }
      this.props.onExitFullscreen?.();
    } else {
      if (Platform.OS == 'android'){
        Orientation.lockToLandscape();
        StatusBar.setHidden(true);
      }
      this.props.onEnterFullscreen?.();
    }

    this.setState({
      isFullscreen: !this.state.isFullscreen,
    });
  };

  _isCaptionLanguageAvailable = () => {
    this._player
      .getCaptionLanguages()
      .then(async (captionLanguages: Array<CaptionLanguage>) => {
        if (captionLanguages.length > 0) {
          this.setState({
            isCaptionLanguageAvailable: true
          })
        }
      });
  }

  _showCaptionTrackSelectionDialog = () => {
    this._player
      .getCaptionLanguages()
      .then(async (captionLanguages: Array<CaptionLanguage>) => {
        var selectedTrack = await this._player.getSelectedCaptionLanguage();

        captionLanguages.forEach((captionLanguage: CaptionLanguage) => {
          captionLanguage.label = captionLanguage.language;
        });

        var disable = {id: -1, language: "", label: "Turn off Captions"};
        captionLanguages.push(disable);

        if (selectedTrack == null) {
          selectedTrack = captionLanguages[captionLanguages.length - 1];
        }

        this._loadDialog(captionLanguages, 'caption', selectedTrack);
      })
      .catch((error: any) => {
        console.log('Api call error');
        alert(error.message);
      });
  };

  _showVideoTrackSelectionDialog = () => {
    this._player
      .getVideoQualities()
      .then(async (videoQualities: Array<VideoQuality>) => {
        var [audioQuality, videoDuration, selectedTrack, isAdaptive] = await Promise.all([
          this._player.getSelectedAudioQuality(),
          this._player.getDuration(),
          this._player.getSelectedVideoQuality(),
          this._player.isAdaptive(),
        ]);
        videoQualities.forEach(async (videoQuality: VideoQuality & {label?: string}) => {
          var bitrateInKbps =
            (videoQuality.bitrate + audioQuality.bitrate) / 1024;
          var roundedOffBitrateInKbps = Math.round(bitrateInKbps / 10.0) * 10;
          var dataExpenditureInMB = this._totalDataExpenditureInMb(
            videoQuality.bitrate + audioQuality.bitrate,
            videoDuration.duration,
          );
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

        this._loadDialog(videoQualities, 'video', selectedTrack);
      })
      .catch((error: any) => {
        console.log('Api call error', error);
        alert(error.message);
      });
  };

  _totalDataExpenditureInMb = (bitsPerSec: number, videoDuration: number) => {
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

  _loadDialog = async (items: any, type: string, selectedTrack: any) => {
    var initial = this.initialSelectedTrack(items, selectedTrack);

    this.setState({
      items: items,
      selectedTrack: selectedTrack,
      type: type,
      initial: initial
    })
    this.changeModalVisibility();
  };

  initialSelectedTrack(items: any, selectedTrack: any) {
    var initial = this.state.items.length
    for (var index = 0; index < items.length; index ++) {
      if (items[index].id == selectedTrack.id) {
        initial = index + 1;
        return initial;
      }
    }
  }

  changeModalVisibility() {
    this.setState({
      modalVisible: !this.state.modalVisible,
    })
  }

  handleRadioChange(e: any) {
    if (this.state.selectedTrack.id == e.id) {
      return;
    }
    this.changeModalVisibility();
    var items = this.state.items;
    for (var index = 0; index < items.length; index ++) {
      if (items[index].id === e.id) {
        Promise.resolve(this.setState({
          selectedTrack: items[index],
        })).then(()=>{
          if (this.state.selectedTrack.id == -2) {
            this._player.enableAdaptiveVideo();
          } else if (this.state.selectedTrack.id == -1) {
            this._player.disableCaptions();
          } else if (this.state.type === 'video') {
            this._player.setVideoQuality(this.state.selectedTrack);
          } else {
            this._player.setCaptionLanguage(this.state.selectedTrack);
          }
        })
       break;
      }
    }
  }

  _renderModal() {
    return (
      <View style={styles.player.centeredView}>
      <Modal
        animationType="slide"
        transparent={true}
        visible={this.state.modalVisible}
        onRequestClose={() => {
          this.changeModalVisibility();
        }}>
        <View style={styles.player.centeredView}>
          <View style={styles.player.modalView}>
            <RadioButtonRN
              style={{width: 200}}
              data={this.state.items}
              selectedBtn={(e: any) =>this.handleRadioChange(e)}
              box={false}
              initial={this.state.initial}
              />
          </View>
        </View>
      </Modal>
      </View>
    )
  }

  _renderSeekbar() {
    return (
      <TouchableWithoutFeedback onPress={this._onProgressTouch}>
        <View style={styles.seekbar.container}>
          <View
            style={styles.seekbar.track}
            onLayout={(event: any) =>
              (this._seekbarWidth = event.nativeEvent.layout.width)
            }>
            <View
              style={[styles.seekbar.fill, {width: this.state.seekbarPosition}]}
            />
          </View>
          <View
            style={[styles.seekbar.handle, {left: this.state.seekbarPosition}]}>
            <View style={[styles.seekbar.circle, {backgroundColor: '#FFF'}]} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    var showPlayIcon = this.state.ended || !this.state.playWhenReady;
    var isFullscreen = this.state.isFullscreen;
    var isInPictureInPictureMode = this.state.isInPictureInPictureMode;
    var isCaptionLanguageAvailable = this.state.isCaptionLanguageAvailable;
    var isVideoTrackSelectionAvailable = Platform.OS != "ios"

    return (
      <SafeAreaView style={styles.player.container}>
        <VdoPlayerView
          ref={player => this._player = player}
          style={styles.player.video}
          {...this.props}
          playWhenReady={this.state.playWhenReady}
          showNativeControls={false}
          onInitializationSuccess={this._onInitSuccess}
          onInitializationFailure={this._onInitFailure}
          onLoading={this._onLoading}
          onLoaded={this._onLoaded}
          onTracksChanged={this._onTracksChanged}
          onPlayerStateChanged={this._onPlayerStateChanged}
          onProgress={this._onProgress}
          onPictureInPictureModeChanged={this._onPictureInPictureModeChanged}
        />
        {!isInPictureInPictureMode && (
          <View style={styles.controls.container}>
            <TouchableWithoutFeedback onPress={this._onPlayButtonTouch}>
              <Icon
                name={showPlayIcon ? 'play' : 'pause'}
                size={30}
                color="#FFF"
              />
            </TouchableWithoutFeedback>
            <Text style={styles.controls.position}>
              {digitalTime(Math.floor(this.state.position))}
            </Text>
            {this._renderSeekbar()}
            {this._renderModal()}
            <Text style={styles.controls.duration}>
              {digitalTime(Math.floor(this.state.duration))}
            </Text>
            { isCaptionLanguageAvailable &&
              <TouchableWithoutFeedback
                onPress={() => this._showCaptionTrackSelectionDialog()}>
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
                onPress={() => this._showVideoTrackSelectionDialog()}>
                <MatIcon
                  name="high-quality"
                  style={styles.controls.quality}
                  size={30}
                  color="#FFF"
                />
              </TouchableWithoutFeedback>
            }
            <TouchableWithoutFeedback onPress={this._toggleFullscreen}>
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
