import React, {Component} from 'react';
import {StyleSheet, Text, SafeAreaView, Image, TouchableOpacity, FlatList, View} from 'react-native';
import {VdoPlayerView} from 'vdocipher-rn-bridge';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { RootStackParamList } from './type';

type Props = NativeStackScreenProps<RootStackParamList, 'Playlist'>;

type State = {
  currentVideoIndex: number,
  videoPlaylist: any,
};

export default class PlaylistScreen extends Component<Props, State> {
  _player: any;
  constructor(props: Props) {
    super(props);
    console.log('PlaylistScreen contructor');

    this.state = {
      currentVideoIndex: 0,
      videoPlaylist: [
        {
          id: "df18b398c85a48b2827ec694d96e0967",
          title: "Big Buck Bunny",
          poster: "https://d1z78r8i505acl.cloudfront.net/poster/w5wTtBSuo2Mv3.480.jpeg",
          otp: "20160313versASE323yV19xZdf8ir7Bg2fO4YUxMJB7eVi0ag2eU4XLJg0rpCcq2",
          playbackInfo: "eyJ2aWRlb0lkIjoiZGYxOGIzOThjODVhNDhiMjgyN2VjNjk0ZDk2ZTA5NjcifQ==",
        },
        {
          id: "786673d2ff8f4790a5b79f107c3e567f",
          title: "Tears of Steel",
          poster: "https://d1z78r8i505acl.cloudfront.net/poster/ev5iTFAwmGoCL.480.jpeg",
          otp: "20160313versASE323JN6ECwfzS1s9NSSVEYVObAc34FoHMHgyQoBgraBa5xEK5K",
          playbackInfo: "eyJ2aWRlb0lkIjoiNzg2NjczZDJmZjhmNDc5MGE1Yjc5ZjEwN2MzZTU2N2YifQ==",
        },
        {
          id: "48f744dd24494b7d82a77cdea045b61f",
          title: "Elephant Dream",
          poster: "https://d1z78r8i505acl.cloudfront.net/poster/FRFTAbZDfXk8f.480.jpeg",
          otp: "20160313versASE323YZWe4AC1Mm1Agz4BsRzCKJSuOIYKR21q2iVVCVL78vRpiv",
          playbackInfo: "eyJ2aWRlb0lkIjoiNDhmNzQ0ZGQyNDQ5NGI3ZDgyYTc3Y2RlYTA0NWI2MWYifQ==",
        },
        {
          id: "ca9bc81eb44348dd94ef9d6b6164a711",
          title: "Sintel",
          poster: "https://d1z78r8i505acl.cloudfront.net/poster/FmDaw6i6JVSvr.480.jpeg",
          otp: "20160313versASE3234ou3rA1Bb3uX7uNX5vK6obwFC7DL4FkwLBl6kLIaJGtLH3",
          playbackInfo: "eyJ2aWRlb0lkIjoiY2E5YmM4MWViNDQzNDhkZDk0ZWY5ZDZiNjE2NGE3MTEifQ==",
        },
        // Add more videos here
      ]
    };
  }

  componentDidMount() {
    console.log('PlaylistScreen did mount');
  }

  componentWillUnmount() {
    console.log('PlaylistScreen will unmount');
  }

  // Function to play the next video, loops back to the first video after the last
  playNextVideo = () => {
    const { currentVideoIndex, videoPlaylist } = this.state;
    this.setState({
      currentVideoIndex: (currentVideoIndex + 1) % videoPlaylist.length,
    });
  };

  // Function to handle video selection from the list
  handleVideoSelection = (index: number) => {
    this.setState({ currentVideoIndex: index });
  };

  renderVideoItem = ({ item, index }: any) => {
    const { currentVideoIndex } = this.state;
    const isPlaying = index === currentVideoIndex;
    return (
      <TouchableOpacity onPress={() => this.handleVideoSelection(index)} style={styles.videoItem}>
      <Image source={{ uri: item.poster }} style={styles.poster} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle}>{item.title}</Text>
        {isPlaying && <Text style={styles.playingIcon}>▶</Text>}
      </View>
      </TouchableOpacity>
    );
  };

  render() {

    const { currentVideoIndex, videoPlaylist } = this.state;
    
    return (
      <SafeAreaView style={styles.container}>
        <VdoPlayerView
          ref={(player: any) => (this._player = player)}
          style={styles.player}
          embedInfo={videoPlaylist[currentVideoIndex]}
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
          onMediaEnded={this.playNextVideo}
          onEnterFullscreen={() => console.log('onEnterFullscreen')}
          onExitFullscreen={() => console.log('onExitFullscreen')}
        />
        <Text style={styles.heading}>Media Queue</Text>
        <FlatList
          data={videoPlaylist}
          renderItem={this.renderVideoItem}
          keyExtractor={(item) => item.id}
          style={styles.videoList}
        />
      </SafeAreaView>
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
    height: 'auto',
    width: '100%',
    resizeMode: 'contain'
  },
  description: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  videoList: {
    marginTop: 20,
    width: '100%',
  },
  videoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  videoTitle: {
    fontSize: 16,
  },
  playingIcon: {
    fontSize: 20,
    color: 'green',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  poster: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 5,
  },
  videoInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
