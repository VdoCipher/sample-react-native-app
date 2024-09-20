import { EmbedInfo, OfflineEmbedInfo } from "vdocipher-rn-bridge/type";

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
  Playlist: undefined;
}

export type ErrorDescription = {
  errorCode: number; 
  errorMsg: string; 
  httpStatusCode: number
}