import React, {Component} from 'react';
import {StyleSheet, Text, View, FlatList} from 'react-native';
import {VdoDownload} from 'vdocipher-rn-bridge';
import { Track, DownloadOptions, DownloadStatus, OfflineEmbedInfo } from 'vdocipher-rn-bridge/type';
import DownloadListItem from './DownloadListItem';
import { DownloadData } from './type'
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import { RootStackParamList } from './type';

const SAMPLE_EMBED_INFOS = [
  {
    mediaId: '3f29b5434a5c615cda18b16a6232fd75',
    otp: '20160313versASE313BlEe9YKEaDuju5J0XcX2Z03Hrvm5rzKScvuyojMSBZBxfZ',
    playbackInfo:
      'eyJ2aWRlb0lkIjoiM2YyOWI1NDM0YTVjNjE1Y2RhMThiMTZhNjIzMmZkNzUifQ==',
    enableAutoResume: true,
  },
  {
    mediaId: 'c8e104c7f45143e68f3a7765740038f9',
    otp: '20160313versASE323s9V7v17viqWJWjEO1taLwOofloK8CItveDgOju99fbOjLp',
    playbackInfo:
      'eyJ2aWRlb0lkIjoiYzhlMTA0YzdmNDUxNDNlNjhmM2E3NzY1NzQwMDM4ZjkifQ==',
    enableAutoResume: false,
  },
];

const makeOfflineEmbedInfo = (mediaId: string, enableAutoResume?: boolean) : OfflineEmbedInfo  => {
  return {
    offline: true,
    mediaId,
    enableAutoResume,
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Downloads'>;

type State = { 
  unregister: Array<() => void>;
  downloadStatusArray: Array<DownloadStatus>;
};

export default class DownloadsScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      downloadStatusArray: [],
      unregister: [],
    };
  }

  componentDidMount() {
    console.log('DownloadsScreen did mount');
    this._refreshDownloadList();
    this.state.unregister.push(
      VdoDownload.addEventListener('onQueued', (mediaId: string, status: DownloadStatus) =>
        this._onQueued(mediaId, status),
      ),
    );
    this.state.unregister.push(
      VdoDownload.addEventListener('onChanged', (mediaId: string, status: DownloadStatus) =>
        this._onChanged(mediaId, status),
      ),
    );
    this.state.unregister.push(
      VdoDownload.addEventListener('onCompleted', (mediaId: string, status: DownloadStatus) =>
        this._onCompleted(mediaId, status),
      ),
    );
    this.state.unregister.push(
      VdoDownload.addEventListener('onFailed', (mediaId: string, status: DownloadStatus) =>
        this._onFailed(mediaId, status),
      ),
    );
    this.state.unregister.push(
      VdoDownload.addEventListener('onDeleted', (mediaId: string) =>
        this._onDeleted(mediaId),
      ),
    );
  }

  componentWillUnmount() {
    console.log('DownloadsScreen will unmount');
    this.state.unregister.forEach((fn: () => void) => fn());
  }

  _onQueued(mediaId: string, downloadStatus: DownloadStatus) {
    console.log('queued', mediaId);
    this._refreshDownloadList();
  }

  _onChanged(mediaId: string, downloadStatus: DownloadStatus) {
    console.log('changed', mediaId, downloadStatus.downloadPercent + '%');
    this._updateItem(mediaId, downloadStatus);
  }

  _onCompleted(mediaId: string, downloadStatus: DownloadStatus) {
    console.log('completed', mediaId);
    this._refreshDownloadList();
  }

  _onFailed(mediaId: string, downloadStatus: DownloadStatus) {
    console.warn('failed', mediaId, downloadStatus.reason);
    this._refreshDownloadList();
  }

  _onDeleted(mediaId: string) {
    console.log('deleted', mediaId);
    this._refreshDownloadList();
  }

  _refreshDownloadList() {
    VdoDownload.query()
      .then((statusArray: Array<DownloadStatus>) => {
        console.log('query results', statusArray);
        //invalidateUI(statusList);
        this.setState({downloadStatusArray: statusArray});
      })
      .catch((err: {exception: string, msg: string}) => console.warn(err));
  }

  _updateItem(mediaId: string, downloadStatus: DownloadStatus) {
    const updateIndex = this.state.downloadStatusArray.findIndex(
      (s: DownloadStatus) => s.mediaInfo.mediaId === mediaId,
    );
    console.log('updateIndex', updateIndex);
    if (updateIndex > -1) {
      let newState = Object.assign({}, this.state);
      newState.downloadStatusArray[updateIndex] = downloadStatus;
      this.setState(newState);
    }
  }

  _getSelection(availableTracks: Array<Track>) {
    var selected: number[] = [];
    var audioIndex = availableTracks.findIndex((track: Track) => track.type === 'audio');
    var videoIndex = availableTracks.findIndex((track: Track) => track.type === 'video');
    if (audioIndex != -1) {
      selected.push(
        audioIndex,
      );
    }
    if (videoIndex != -1) {
      selected.push(
        videoIndex,
      );
    } else {
      console.log("Atlease one video track required");
    }
    return selected;
  }

  _getOptions(otp: string, playbackInfo: string) {
    console.log('get download options');
    VdoDownload.getDownloadOptions({otp, playbackInfo})
      .then(({downloadOptions, enqueue}: {downloadOptions: DownloadOptions, enqueue: (selections: Array<number>) => void}) => {
        console.log('Got options', downloadOptions);
        const selections = this._getSelection(downloadOptions.availableTracks);
        console.log('selections', selections);
      })
      .catch((errorDescription: {errorCode: number, errorMsg: string, httpStatusCode: number}) => {
        console.warn('Error getting options', errorDescription);
      });
  }

  _enqueueDownload(otp: string, playbackInfo: string) {
    console.log('enqueue download');
    VdoDownload.getDownloadOptions({otp, playbackInfo /* ,customPlayerId: "avaI83RCHxfvLwhC"*/})
      .then(({downloadOptions, enqueue}: {downloadOptions: DownloadOptions, enqueue: (downloadSelections: {selections: Array<number>}) => void}) => {
        console.log('Got options', downloadOptions);
        const selections = this._getSelection(downloadOptions.availableTracks);
        console.log('selections', selections);
        return enqueue({selections});
      })
      .then(() => console.log('enqueue success'))
      .catch((errorDescription: {errorCode: number, errorMsg: string, httpStatusCode: number}) => {
        console.warn('Error getting options', errorDescription);
      });
  }

  _removeDownload(mediaId: string) {
    console.log('remove ' + mediaId);
    VdoDownload.remove([mediaId]).catch((error: {exception: string, msg: string}) =>
      console.warn('Error removing ' + mediaId),
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Download samples</Text>
        </View>
        <View style={styles.listContainer}>
          <FlatList
            data={SAMPLE_EMBED_INFOS}
            renderItem={({item, index}: {item: DownloadData, index: number}) => (
              <DownloadListItem
                title={'Sample ' + (index + 1)}
                downloadStatus={this.state.downloadStatusArray.find(
                  (e: DownloadStatus) => e.mediaInfo.mediaId === item.mediaId,
                )}
                onDownload={() =>
                  this._enqueueDownload(item.otp, item.playbackInfo)
                }
                onPlay={() =>
                  this.props.navigation.navigate('NativeControls', {
                    embedInfo: makeOfflineEmbedInfo(
                      item.mediaId,
                      item.enableAutoResume,
                    ),
                  })
                }
                onInfo={() => console.warn('show info: to be implemented')}
                onDelete={() => this._removeDownload(item.mediaId)}
              />
            )}
            keyExtractor={(item: DownloadData) => item.mediaId}
            ItemSeparatorComponent={() => (
              <View style={{flex: 1, height: 12}} />
            )}
            ListEmptyComponent={
              <Text
                style={{
                  color: 'grey',
                  fontSize: 20,
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}>
                No downloads yet
              </Text>
            }
          />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  header: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    textAlign: 'center',
    margin: 10,
  },
  listContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingVertical: 20,
  },
});
