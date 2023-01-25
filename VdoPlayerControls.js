import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback
} from 'react-native';
import { ViewPropTypes } from 'deprecated-react-native-prop-types';
import PropTypes from 'prop-types';
import { VdoPlayerView } from 'vdocipher-rn-bridge';
import MatIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/FontAwesome';
import DialogAndroid from 'react-native-dialogs';

function digitalTime(time) {
  return ~~(time / 60) + ":" + (time % 60 < 10 ? "0" : "") + time % 60;
}

export default class VdoPlayerControls extends Component {

  constructor(props) {
    super(props);
    this.state = {
      error: false,
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
    };
    this.propInterval = null;
  }

  componentWillUnmount() {
    console.log('VdoPlayerControls will unmount');
    clearInterval(this.propInterval);
  }

  _onInitSuccess = () => {
    this.setState({
      init: true
    });
  }

  _onInitFailure = error => {
    this.setState({
      init: false,
      error: error.errorDescription
    });
  }

  _onLoading = () => {
    this.setState({
      loaded: false
    });
  }

  _onLoaded = metaData => {
    this.setState({
      loaded: true,
      duration: metaData.mediaInfo.duration / 1000
    });
    this.propInterval = setInterval(() => this._player.getPlaybackProperties(), 10000);
  }

  _onTracksChanged = tracks => {
    //todo
  }

  _onPlayerStateChanged = newState => {
    const { playerState } = newState;
    this.setState({
      buffering: playerState === 'buffering',
      ended: playerState === 'ended'
    })
  }

  _onProgress = progress => {
    const newPosition = progress.currentTime / 1000;
    const relativePosition = newPosition / this.state.duration;
    const seekbarPosition = this._seekbarWidth * relativePosition;

    this.setState({
      position: newPosition,
      seekbarPosition
    });
  }

  _onPlaybackProperties = properties => {
    console.log('total played', properties.totalPlayed);
    console.log('total covered', properties.totalCovered);
  }

  _onPlayButtonTouch = () => {
    if (this.state.ended) {
      this._player.seek(0);
    } else {
      this.setState(state => {
        return {
          playWhenReady: !state.playWhenReady
        };
      });
    }
  }

  _onEnterFullscreen = () => {
    this.setState({isFullscreen: true});
    if (this.props.onEnterFullscreen) {
      this.props.onEnterFullscreen();
    }
  }

  _onExitFullscreen = () => {
    this.setState({isFullscreen: false});
    if (this.props.onEnterFullscreen) {
      this.props.onExitFullscreen();
    }
  }

  _onPictureInPictureModeChanged = pictureInPictureModeInfo => {
    this.setState({
      isInPictureInPictureMode: pictureInPictureModeInfo.isInPictureInPictureMode,
    });
    if (this.props.onPictureInPictureModeChanged) {
      this.props.onPictureInPictureModeChanged(pictureInPictureModeInfo.isInPictureInPictureMode);
    }
  }

  _onProgressTouch = event => {
    if (this._seekbarWidth) {
      var positionX = event.nativeEvent.locationX;
      var targetSeconds = Math.floor((positionX / this._seekbarWidth) * this.state.duration);
      this._player.seek(targetSeconds * 1000);
    }
  }

  _toggleFullscreen = () => {
    if (this.state.isFullscreen) {
      this._player.exitFullscreen();
    } else {
      this._player.enterFullscreen();
    }
  }

  _loadDialog = async(items, type, selectedTrack) => {

    const { selectedItem } = await DialogAndroid.showPicker(type, null, {
      // positiveText: null, // if positiveText is null, then on select of item, it dismisses dialog
      negativeText: 'Cancel',
      type: DialogAndroid.listRadio,
      selectedId: selectedTrack.id,
      labelKey: "dialogLabel",
      items: items
    });
    if (selectedItem) {
      // when negative button is clicked, selectedItem is not present, so it doesn't get here
      if (selectedItem.id == -2) {
        this._player.enableAdaptiveVideo();
      } else if (selectedItem.id == -1) {
        this._player.disableCaptions();
      } else if (type === "video") { 
        this._player.setVideoQuality(selectedItem);
      } else {
        this._player.setCaptionLanguage(selectedItem);
      }
    }
  }

  _showCaptionTrackSelectionDialog = () => {

    this._player.getCaptionLanguages().then(async captionLanguages => {
      var selectedTrack = await this._player.getSelectedCaptionLanguage();
      captionLanguages.forEach(captionLanguage => {
        captionLanguage["dialogLabel"] = captionLanguage.language;
      });
      var disable = {id: -1, dialogLabel: "Turn off Captions"};
      captionLanguages.push(disable);

      if (selectedTrack == null) {
        selectedTrack = captionLanguages[captionLanguages.length - 1];
      }

      this._loadDialog(captionLanguages, "caption", selectedTrack);
    }).catch((error)=>{
      console.log("Api call error");
      alert(error.message);
    });

  }

  _showVideoTrackSelectionDialog = () => {

    this._player.getVideoQualities().then(async videoQualities => {  
      var [audioQuality, videoDuration, selectedTrack ] = await Promise.all([this._player.getSelectedAudioQuality(),this._player.getDuration(), this._player.getSelectedVideoQuality()]);
      videoQualities.forEach(async videoQuality => {
        var bitrateInKbps = (videoQuality.bitrate + audioQuality.bitrate) / 1024;
        var roundedOffBitrateInKbps = Math.round(bitrateInKbps/10.0) * 10;
        var dataExpenditureInMB = this._totalDataExpenditureInMb(videoQuality.bitrate + audioQuality.bitrate, videoDuration.duration);
        videoQuality["dialogLabel"] = "(" + dataExpenditureInMB + ", " + roundedOffBitrateInKbps + "kbps)";
      });
      var auto = {id: -2, dialogLabel: "Auto"};
      videoQualities.push(auto);

      if (selectedTrack == null) {
        selectedTrack = videoQualities[videoQualities.length - 1];
      }

      this._loadDialog(videoQualities, "video", selectedTrack);
    }).catch((error)=>{
      console.log("Api call error", error);
      alert(error.message);
    });
  }

  _totalDataExpenditureInMb = (bitsPerSec, videoDuration) => {
    var totalBytes = bitsPerSec <= 0 ? 0 : (bitsPerSec * (videoDuration/1000)) / 8;
      if (totalBytes == 0) {
      return "-";
      } else {
          var totalMB = totalBytes /  (1024 * 1024);

          if(totalMB < 1) {
              return "1MB";
          } else if (totalMB < 1000) {
              return parseInt(totalMB) + " MB";
          } else {
              var value = (totalMB / 1024);
              return value.toFixed(2) + " GB";
          }
      }
  }

  _renderSeekbar() {
    return (   
      <TouchableWithoutFeedback
        onPress={this._onProgressTouch}>
        <View style={styles.seekbar.container}>
          <View
            style={styles.seekbar.track}
            onLayout={event => this._seekbarWidth = event.nativeEvent.layout.width}>
            <View
              style={[styles.seekbar.fill, {width: this.state.seekbarPosition}]}
            />
          </View>
          <View
            style={[styles.seekbar.handle, {left: this.state.seekbarPosition}]}>
            <View
              style={[
                styles.seekbar.circle,
                {backgroundColor: '#FFF'},
              ]}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    var showPlayIcon = this.state.ended || !this.state.playWhenReady;
    var isFullscreen = this.state.isFullscreen;
    var isInPictureInPictureMode = this.state.isInPictureInPictureMode;

    return (
      <View style={styles.player.container}>
        <VdoPlayerView ref={player => this._player = player}
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
          onPlaybackProperties={this._onPlaybackProperties}
          onEnterFullscreen={this._onEnterFullscreen}
          onExitFullscreen={this._onExitFullscreen}
          onPictureInPictureModeChanged={this._onPictureInPictureModeChanged}
        />
        { !isInPictureInPictureMode && 
          <View style={styles.controls.container}>
            <TouchableWithoutFeedback onPress={this._onPlayButtonTouch}>
              <Icon name = {showPlayIcon ? "play" : "pause"}
                size={30}
                color="#FFF"
              />
            </TouchableWithoutFeedback>
            <Text
              style={styles.controls.position}>
              {digitalTime(Math.floor(this.state.position))}
            </Text>
            {this._renderSeekbar()}
            <Text
              style={styles.controls.duration}>
              {digitalTime(Math.floor(this.state.duration))}
            </Text>
            <TouchableWithoutFeedback onPress={()=>this._showCaptionTrackSelectionDialog()}>
            <MatIcon name = "closed-caption"
              style={styles.controls.captions}
              size={30}
              color="#FFF"
            />
          </TouchableWithoutFeedback>
          <TouchableWithoutFeedback onPress={()=>this._showVideoTrackSelectionDialog()}>
            <MatIcon name = "high-quality"
              style={styles.controls.quality}
              size={30}
              color="#FFF"
            />
          </TouchableWithoutFeedback>
            <TouchableWithoutFeedback onPress={this._toggleFullscreen}>
              <MatIcon name = {isFullscreen ? "fullscreen-exit" : "fullscreen"}
                style={styles.controls.fullscreen}
                size={30}
                color="#FFF"
              />
            </TouchableWithoutFeedback>
          </View>
        }
      </View>
    );
  }
}

VdoPlayerControls.propTypes = {
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,

  /* Required */
  ...ViewPropTypes,
}

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
  }),
  controls: StyleSheet.create({
    container: {
      backgroundColor: "rgba(0, 0, 0, 0.4)",
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
    }
  }),
  seekbar: StyleSheet.create({
    container: {
      flex: 1,
      height: 20,
      marginLeft: 20,
      marginRight: 20,
    },
    track: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      height: 2,
      position: 'relative',
      top: 10,
      width: '100%',
    },
    fill: {
      backgroundColor: "#FFF",
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
