import { EmbedInfo, OfflineEmbedInfo } from "vdocipher-rn-bridge/type";
import PropTypes from 'prop-types';

export type DownloadData = {
  mediaId: string;
  otp: string;
  playbackInfo: string;
  enableAutoResume?: boolean;
}

export type RootStackParamList = {
  Home: undefined;
  NativeControls: {embedInfo: EmbedInfo | OfflineEmbedInfo};
  JSControls: {embedInfo: EmbedInfo | OfflineEmbedInfo};
  Downloads: undefined; 
}

export const PlayerControlsPropTypes = {
  onEnterFullscreen: PropTypes.func,
  onExitFullscreen: PropTypes.func,
  onPictureInPictureModeChanged: PropTypes.func,
}

export type ErrorDescription = {
  errorCode: number; 
  errorMsg: string; 
  httpStatusCode: number
}