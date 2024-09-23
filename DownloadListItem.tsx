import React, {Component} from 'react';
import {StyleSheet, Text, View, TouchableOpacity, Image, Button} from 'react-native';
import { DownloadStatus } from 'vdocipher-rn-bridge/type';

const statusDescription = (downloadStatus: DownloadStatus) => {
  if (downloadStatus.status === 'downloading') {
    return 'Downloading ' + downloadStatus.downloadPercent + '%';
  } else if (downloadStatus.status === 'failed') {
    return (
      'Error ' +
      downloadStatus.reason +
      (downloadStatus.reasonDescription
        ? ': ' + downloadStatus.reasonDescription
        : '')
    );
  } else {
    return downloadStatus.status;
  }
};

export default function DownloadListItem(props:{
    title: string;
    downloadStatus?: DownloadStatus;
    onDownload: () => void;
    onPlay: () => void;
    onStop: () => void;
    onResume: () => void;
    onInfo: () => void;
    onDelete: () => void;
  } ) {

    const {title, downloadStatus, onDownload, onPlay, onStop, onResume, onInfo, onDelete} =
      props;
    const {mediaInfo, status, downloadPercent, reason, reasonDescription} =
      downloadStatus || {};
    const playEnabled =
      downloadStatus !== undefined && downloadStatus.status === 'completed';
    const stopOrResumeEnabled =
      downloadStatus !== undefined && downloadStatus.status !== 'completed' && downloadStatus.status !== 'removing';
    const playOpacity = playEnabled ? 1 : 0.4;
    const deleteEnabled = downloadStatus !== undefined;
    const deleteOpacity = deleteEnabled ? 1 : 0.4;
    const statusView = downloadStatus ? (
      <View style={styles.statusViewContainer}>
        <Text style={{fontSize: 20}}>{mediaInfo?.title}</Text>
        <Text style={{fontSize: 14, fontWeight: 'bold'}}>
          {statusDescription(downloadStatus).toUpperCase()}
        </Text>
      </View>
    ) : (
      <View style={styles.statusViewContainer}>
        <Text style={{fontSize: 20}}>
          Tap the download icon to save this sample to local storage.
        </Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text
          style={{flex: 1, paddingLeft: 8, fontSize: 22, fontWeight: 'bold'}}>
          {title}
        </Text>
        <TouchableOpacity onPress={onDownload} activeOpacity={0.8}>
          <Image source={require('./baseline_save_alt_black_18.png')} />
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flex: 1,
          alignItems: 'center',
          borderRadius: 2,
          overflow: 'hidden',
        }}>
        {statusView}
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          onPress={onPlay}
          activeOpacity={0.8}
          disabled={!playEnabled}
          style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            style={{opacity: playOpacity}}
            source={require('./round_play_arrow_black_24.png')}
          />
        </TouchableOpacity>
        <View style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Button
            disabled={!stopOrResumeEnabled}
            title={"Stop"}
            onPress={onStop}
          />
        </View>
        <View style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Button
            disabled={!stopOrResumeEnabled}
            title={"Resume"}
            onPress={onResume}
          />
        </View>
        {/* <TouchableOpacity
          onPress={onInfo}
          activeOpacity={0.8}
          disabled={true}
          style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            style={{opacity: 0.4}}
            source={require('./baseline_info_black_18.png')}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          onPress={onDelete}
          activeOpacity={0.8}
          disabled={!deleteEnabled}
          style={{
            width: 80,
            height: 80,
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <Image
            style={{opacity: deleteOpacity}}
            source={require('./baseline_delete_black_18.png')}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'lightsteelblue',
    borderColor: 'lightsteelblue',
    borderRadius: 2,
    borderWidth: 4,
  },
  header: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusViewContainer: {
    padding: 10,
    width: '100%',
    backgroundColor: 'aliceblue',
    height: 90,
  },
  actionsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderRadius: 2,
    overflow: 'hidden',
  },
});
