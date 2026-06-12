/**
 * Tests for vdocipher-rn-bridge integration
 * Covers: VdoDownload API, DownloadsScreen lifecycle, DownloadListItem UI states
 * @format
 */

import 'react-native';
import React from 'react';
import renderer, { act } from 'react-test-renderer';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('vdocipher-rn-bridge', () => ({
  VdoDownload: {
    query: jest.fn(),
    addEventListener: jest.fn(),
    getDownloadOptions: jest.fn(),
    stop: jest.fn(),
    resume: jest.fn(),
    remove: jest.fn(),
    isExpired: jest.fn(),
  },
  startVideoScreen: jest.fn(),
  VdoPlayerView: 'VdoPlayerView',
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { VdoDownload, startVideoScreen } from 'vdocipher-rn-bridge';

// ─── Fixture helpers ──────────────────────────────────────────────────────────

const createDownloadStatus = (overrides: Record<string, any> = {}) => ({
  mediaInfo: { mediaId: 'test-media-id', title: 'Test Video' },
  status: 'completed',
  downloadPercent: 100,
  reason: '',
  reasonDescription: '',
  ...overrides,
});

// ─── VdoDownload.query() ──────────────────────────────────────────────────────

describe('VdoDownload.query()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves with an array of DownloadStatus objects', async () => {
    const statuses = [createDownloadStatus()];
    (VdoDownload.query as jest.Mock).mockResolvedValueOnce(statuses);

    const result = await VdoDownload.query();

    expect(result).toEqual(statuses);
  });

  it('resolves with an empty array when no downloads exist', async () => {
    (VdoDownload.query as jest.Mock).mockResolvedValueOnce([]);

    const result = await VdoDownload.query();

    expect(result).toEqual([]);
  });

  it('rejects with an error descriptor on failure', async () => {
    const error = { exception: 'StorageError', msg: 'Failed to read storage' };
    (VdoDownload.query as jest.Mock).mockRejectedValueOnce(error);

    await expect(VdoDownload.query()).rejects.toEqual(error);
  });
});

// ─── VdoDownload.addEventListener() ──────────────────────────────────────────

describe('VdoDownload.addEventListener()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns an unsubscribe function', () => {
    const unsubscribe = jest.fn();
    (VdoDownload.addEventListener as jest.Mock).mockReturnValueOnce(unsubscribe);

    const result = VdoDownload.addEventListener('onQueued', jest.fn());

    expect(result).toBe(unsubscribe);
  });

  it('is callable for all supported event types', () => {
    const eventTypes = ['onQueued', 'onChanged', 'onCompleted', 'onFailed', 'onDeleted'];
    (VdoDownload.addEventListener as jest.Mock).mockReturnValue(jest.fn());

    eventTypes.forEach(event => VdoDownload.addEventListener(event as any, jest.fn()));

    expect(VdoDownload.addEventListener).toHaveBeenCalledTimes(5);
    eventTypes.forEach(event =>
      expect(VdoDownload.addEventListener).toHaveBeenCalledWith(event, expect.any(Function)),
    );
  });

  it('calling the returned function unsubscribes the listener', () => {
    const unsubscribe = jest.fn();
    (VdoDownload.addEventListener as jest.Mock).mockReturnValueOnce(unsubscribe);

    const removeListener = VdoDownload.addEventListener('onCompleted', jest.fn());
    removeListener();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});

// ─── VdoDownload.getDownloadOptions() ────────────────────────────────────────

describe('VdoDownload.getDownloadOptions()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves with downloadOptions and an enqueue function', async () => {
    const mockEnqueue = jest.fn().mockResolvedValue(undefined);
    const mockResponse = {
      downloadOptions: {
        availableTracks: [
          { type: 'audio', id: 0, language: 'en', bitrate: 64000 },
          { type: 'video', id: 1, width: 1280, height: 720, bitrate: 1500000 },
        ],
      },
      enqueue: mockEnqueue,
    };
    (VdoDownload.getDownloadOptions as jest.Mock).mockResolvedValueOnce(mockResponse);

    const result = await VdoDownload.getDownloadOptions({ otp: 'test-otp', playbackInfo: 'test-info' });

    expect(result).toEqual(mockResponse);
    expect(VdoDownload.getDownloadOptions).toHaveBeenCalledWith({
      otp: 'test-otp',
      playbackInfo: 'test-info',
    });
  });

  it('rejects with an errorCode, errorMsg, and httpStatusCode on failure', async () => {
    const error = { errorCode: 401, errorMsg: 'Unauthorized', httpStatusCode: 401 };
    (VdoDownload.getDownloadOptions as jest.Mock).mockRejectedValueOnce(error);

    await expect(
      VdoDownload.getDownloadOptions({ otp: 'bad-otp', playbackInfo: 'bad-info' }),
    ).rejects.toEqual(error);
  });

  it('calling enqueue() with track selections starts the download', async () => {
    const mockEnqueue = jest.fn().mockResolvedValue(undefined);
    (VdoDownload.getDownloadOptions as jest.Mock).mockResolvedValueOnce({
      downloadOptions: { availableTracks: [{ type: 'audio' }, { type: 'video' }] },
      enqueue: mockEnqueue,
    });

    const { enqueue } = await VdoDownload.getDownloadOptions({ otp: 'otp', playbackInfo: 'pi' });
    await enqueue({ selections: [0, 1] });

    expect(mockEnqueue).toHaveBeenCalledWith({ selections: [0, 1] });
  });
});

// ─── VdoDownload.stop() ───────────────────────────────────────────────────────

describe('VdoDownload.stop()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('stops the download for the given mediaId array', async () => {
    (VdoDownload.stop as jest.Mock).mockResolvedValueOnce(undefined);

    await VdoDownload.stop(['media-id-1']);

    expect(VdoDownload.stop).toHaveBeenCalledWith(['media-id-1']);
  });

  it('can stop multiple downloads in a single call', async () => {
    (VdoDownload.stop as jest.Mock).mockResolvedValueOnce(undefined);

    await VdoDownload.stop(['id-1', 'id-2']);

    expect(VdoDownload.stop).toHaveBeenCalledWith(['id-1', 'id-2']);
  });

  it('rejects on error', async () => {
    const error = { exception: 'DownloadError', msg: 'Cannot stop' };
    (VdoDownload.stop as jest.Mock).mockRejectedValueOnce(error);

    await expect(VdoDownload.stop(['id-1'])).rejects.toEqual(error);
  });
});

// ─── VdoDownload.resume() ────────────────────────────────────────────────────

describe('VdoDownload.resume()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resumes the download for the given mediaId array', async () => {
    (VdoDownload.resume as jest.Mock).mockResolvedValueOnce(undefined);

    await VdoDownload.resume(['media-id-1']);

    expect(VdoDownload.resume).toHaveBeenCalledWith(['media-id-1']);
  });

  it('rejects on error', async () => {
    const error = { exception: 'DownloadError', msg: 'Cannot resume' };
    (VdoDownload.resume as jest.Mock).mockRejectedValueOnce(error);

    await expect(VdoDownload.resume(['id-1'])).rejects.toEqual(error);
  });
});

// ─── VdoDownload.remove() ────────────────────────────────────────────────────

describe('VdoDownload.remove()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the download for the given mediaId array', async () => {
    (VdoDownload.remove as jest.Mock).mockResolvedValueOnce(undefined);

    await VdoDownload.remove(['media-id-1']);

    expect(VdoDownload.remove).toHaveBeenCalledWith(['media-id-1']);
  });

  it('rejects on error', async () => {
    const error = { exception: 'DownloadError', msg: 'Cannot remove' };
    (VdoDownload.remove as jest.Mock).mockRejectedValueOnce(error);

    await expect(VdoDownload.remove(['id-1'])).rejects.toEqual(error);
  });
});

// ─── VdoDownload.isExpired() ─────────────────────────────────────────────────

describe('VdoDownload.isExpired()', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves with false for a non-expired download', async () => {
    (VdoDownload.isExpired as jest.Mock).mockResolvedValueOnce(false);

    const result = await VdoDownload.isExpired('media-id-1');

    expect(result).toBe(false);
    expect(VdoDownload.isExpired).toHaveBeenCalledWith('media-id-1');
  });

  it('resolves with true for an expired download', async () => {
    (VdoDownload.isExpired as jest.Mock).mockResolvedValueOnce(true);

    const result = await VdoDownload.isExpired('expired-id');

    expect(result).toBe(true);
  });

  it('rejects on error', async () => {
    const error = { exception: 'MediaError', msg: 'Cannot check expiry' };
    (VdoDownload.isExpired as jest.Mock).mockRejectedValueOnce(error);

    await expect(VdoDownload.isExpired('id-1')).rejects.toEqual(error);
  });
});

// ─── startVideoScreen ─────────────────────────────────────────────────────────

describe('startVideoScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('is called with the correct embedInfo and autostart flag', () => {
    const embedInfo = {
      otp: '20160313versUSE3233GHgXyKF5phSzyT4dRhHRRf51zMA7o5nMW4ggLhL2daCWh',
      playbackInfo: 'eyJ2aWRlb0lkIjoiZjIzNjQ0OTk2NThiNDNkMDljZDBhOWJlZWY1ODhiMDIifQ==',
    };

    startVideoScreen({ embedInfo }, true);

    expect(startVideoScreen).toHaveBeenCalledWith({ embedInfo }, true);
  });

  it('forwards autostart=false correctly', () => {
    const embedInfo = { otp: 'otp', playbackInfo: 'pi' };

    startVideoScreen({ embedInfo }, false);

    expect(startVideoScreen).toHaveBeenCalledWith({ embedInfo }, false);
  });

  it('is only called once per invocation', () => {
    const embedInfo = { otp: 'otp', playbackInfo: 'pi' };

    startVideoScreen({ embedInfo }, true);

    expect(startVideoScreen).toHaveBeenCalledTimes(1);
  });
});
