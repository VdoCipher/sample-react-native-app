import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList
} from 'react-native';
import { VdoDownload } from 'vdocipher-rn-bridge';
import DownloadListItem from './DownloadListItem';

const SAMPLE_EMBED_INFOS = [
  {
    mediaId: '661f6861d521a24288d608923d2c73f9',
    otp: '20160313versASE313WAGCdGbRSkojp0pMJpESFT9RVVrbGSnzwVOr2ANUxMrfZ5',
    playbackInfo: 'eyJ2aWRlb0lkIjoiNjYxZjY4NjFkNTIxYTI0Mjg4ZDYwODkyM2QyYzczZjkifQ==',
    enableAutoResume: true
  },
  {
    mediaId: '3f29b5434a5c615cda18b16a6232fd75',
    otp: '20160313versASE313BlEe9YKEaDuju5J0XcX2Z03Hrvm5rzKScvuyojMSBZBxfZ',
    playbackInfo: 'eyJ2aWRlb0lkIjoiM2YyOWI1NDM0YTVjNjE1Y2RhMThiMTZhNjIzMmZkNzUifQ==',
    enableAutoResume: true
  },
  {
    mediaId: '5392515b761ef71e8c00a2301e1cece3',
    otp: '20160313versASE313TKtOGPa5FImICHI4Q62Gkmj41zyTBlAOV8V2uLVgMUPYgT',
    playbackInfo: 'eyJ2aWRlb0lkIjoiNTM5MjUxNWI3NjFlZjcxZThjMDBhMjMwMWUxY2VjZTMifQ==',
    enableAutoResume: false
  }
];

const makeOfflineEmbedInfo = (mediaId, enableAutoResume) => {
  return {
    offline: true,
    mediaId,
    enableAutoResume
  };
}

export default class DownloadsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      downloadStatusArray: [],
      unregister: []
    };
  }

  componentDidMount() {
    console.log('DownloadsScreen did mount');
    this._refreshDownloadList();
    this.state.unregister.push(
      VdoDownload.addEventListener('onQueued', (mediaId, status) => this._onQueued(mediaId, status)));
    this.state.unregister.push(
      VdoDownload.addEventListener('onChanged', (mediaId, status) => this._onChanged(mediaId, status)));
    this.state.unregister.push(
      VdoDownload.addEventListener('onCompleted', (mediaId, status) => this._onCompleted(mediaId, status)));
    this.state.unregister.push(
      VdoDownload.addEventListener('onFailed', (mediaId, status) => this._onFailed(mediaId, status)));
    this.state.unregister.push(
      VdoDownload.addEventListener('onDeleted', (mediaId) => this._onDeleted(mediaId)));
  }

  componentWillUnmount() {
    console.log('DownloadsScreen will unmount');
    this.state.unregister.forEach((fn) => fn());
  }

  _onQueued(mediaId, downloadStatus) {
    console.log('queued', mediaId);
    this._refreshDownloadList();
  }

  _onChanged(mediaId, downloadStatus) {
    console.log('changed', mediaId, downloadStatus.downloadPercent + '%');
    this._updateItem(mediaId, downloadStatus);
  }

  _onCompleted(mediaId, downloadStatus) {
    console.log('completed', mediaId);
    this._refreshDownloadList();
  }

  _onFailed(mediaId, downloadStatus) {
    console.warn('failed', mediaId, downloadStatus.reason);
    this._refreshDownloadList();
  }

  _onDeleted(mediaId) {
    console.log('deleted', mediaId);
    this._refreshDownloadList();
  }

  _refreshDownloadList() {
    VdoDownload.query()
      .then(statusArray => {
        console.log('query results', statusArray);
        //invalidateUI(statusList);
        this.setState({downloadStatusArray:statusArray});
      })
      .catch(err => console.warn(err));
  }

  _updateItem(mediaId, downloadStatus) {
    const updateIndex = this.state.downloadStatusArray.findIndex((s) => s.mediaInfo.mediaId === mediaId);
    console.log('updateIndex', updateIndex);
    if (updateIndex > -1) {
      let newState = Object.assign({}, this.state);
      newState.downloadStatusArray[updateIndex] = downloadStatus;
      this.setState(newState);
    }
  }

  _getSelection(availableTracks) {
    var selected = [];
    selected.push(availableTracks.findIndex(track => track.type === 'audio'));
    selected.push(availableTracks.findIndex(track => track.type === 'video'));
    return selected;
  }

  _getOptions(otp, playbackInfo) {
    console.log('get download options');
    VdoDownload.getDownloadOptions({otp, playbackInfo})
      .then( ({downloadOptions, enqueue}) => {
        console.log('Got options', downloadOptions);
        const selections = this._getSelection(downloadOptions.availableTracks);
        console.log('selections', selections);
      })
      .catch((errorDescription) => { console.warn('Error getting options', errorDescription) });
  }

  _enqueueDownload(otp, playbackInfo) {
    console.log('enqueue download');
    VdoDownload.getDownloadOptions({otp, playbackInfo})
      .then( ({downloadOptions, enqueue}) => {
        console.log('Got options', downloadOptions);
        const selections = this._getSelection(downloadOptions.availableTracks);
        console.log('selections', selections);
        return enqueue({selections});
      })
      .then(() => console.log('enqueue success'))
      .catch((errorDescription) => { console.warn('Error getting options', errorDescription) });
  }

  _removeDownload(mediaId) {
    console.log('remove ' + mediaId);
    VdoDownload.remove([mediaId])
      .catch((error) => console.warn('Error removing ' + mediaId));
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.welcome}>
            Download samples
          </Text>
        </View>
        <View style={styles.listContainer}>
          <FlatList
            data={SAMPLE_EMBED_INFOS}
            renderItem={({ item, index }) =>
              <DownloadListItem
                title={'Sample ' + (index + 1)}
                downloadStatus={this.state.downloadStatusArray.find(e => e.mediaInfo.mediaId === item.mediaId)}
                onDownload={() => this._enqueueDownload(item.otp, item.playbackInfo)}
                onPlay={() => this.props.navigation.navigate('NativeControls', {embedInfo: makeOfflineEmbedInfo(item.mediaId, item.enableAutoResume)})}
                onInfo={() => console.warn('show info: to be implemented')}
                onDelete={() => this._removeDownload(item.mediaId)}
              />
            }
            keyExtractor={item => item.mediaId}
            ItemSeparatorComponent={() => <View style={{flex: 1, height: 12}} />}
            ListEmptyComponent={
              <Text style={{color: 'grey', fontSize: 20, fontStyle: 'italic', textAlign: 'center'}}>
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
    alignItems: 'center'
  },
  welcome: {
    fontSize: 24,
    textAlign: 'center',
    margin: 10,
  },
  listContainer: {
    flex:1,
    width: '100%',
    justifyContent: 'flex-end',
    paddingVertical: 20
  },
});
