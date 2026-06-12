/**
 * Integration tests for the vdocipher-rn-bridge download flow: DownloadsScreen
 * (VdoDownload wiring + lifecycle) and DownloadListItem (UI states + actions).
 */
import 'react-native';
import React from 'react';
import renderer, {act} from 'react-test-renderer';

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
}));

import {VdoDownload, startVideoScreen} from 'vdocipher-rn-bridge';
import DownloadsScreen from '../DownloadsScreen';
import DownloadListItem from '../DownloadListItem';
import HomeScreen from '../HomeScreen';

const mockVdoDownload = VdoDownload as any;
const mockStartVideoScreen = startVideoScreen as jest.Mock;

const SAMPLE_MEDIA_ID = 'c81d4678d1b54b80a26b0470f1328e25';

const createStatus = (overrides: Record<string, any> = {}) => ({
  mediaInfo: {mediaId: SAMPLE_MEDIA_ID, title: 'Test Video'},
  status: 'completed',
  downloadPercent: 100,
  reason: '',
  reasonDescription: '',
  ...overrides,
});

const screenProps = () =>
  ({navigation: {navigate: jest.fn()}, route: {params: {}}} as any);

// react-test-renderer surfaces testID on both the composite and its host node;
// the composite is the one carrying our onPress handler.
const pressables = (root: any, id: string) =>
  root.findAll(
    (n: any) => n.props && n.props.testID === id && typeof n.props.onPress === 'function',
  );
const pressable = (root: any, id: string) => pressables(root, id)[0];
const allText = (root: any) =>
  JSON.stringify(root.findAllByType('Text' as any).map((t: any) => t.props.children));

const flush = () => act(async () => {await new Promise(setImmediate);});

const renderScreen = async (props = screenProps()) => {
  let tree!: any;
  await act(async () => {
    tree = renderer.create(<DownloadsScreen {...props} />);
  });
  return {tree, props};
};

beforeEach(() => {
  jest.clearAllMocks();
  mockVdoDownload.query.mockResolvedValue([]);
  mockVdoDownload.addEventListener.mockReturnValue(jest.fn());
});

describe('DownloadsScreen — lifecycle & bridge wiring', () => {
  it('queries existing downloads on mount', async () => {
    await renderScreen();
    expect(mockVdoDownload.query).toHaveBeenCalledTimes(1);
  });

  it('registers all five download event listeners on mount', async () => {
    await renderScreen();
    const events = mockVdoDownload.addEventListener.mock.calls.map(c => c[0]);
    expect(events).toEqual(
      expect.arrayContaining(['onQueued', 'onChanged', 'onCompleted', 'onFailed', 'onDeleted']),
    );
  });

  it('unregisters every listener on unmount', async () => {
    const unsubscribe = jest.fn();
    mockVdoDownload.addEventListener.mockReturnValue(unsubscribe);
    const {tree} = await renderScreen();
    await act(async () => {tree.unmount();});
    expect(unsubscribe).toHaveBeenCalledTimes(5);
  });

  it('renders one row per sample video', async () => {
    const {tree} = await renderScreen();
    expect(pressables(tree.root, 'download-start').length).toBe(2);
  });

  it('re-queries the list when a download completes', async () => {
    await renderScreen();
    const onCompleted = mockVdoDownload.addEventListener.mock.calls.find(
      c => c[0] === 'onCompleted',
    )![1];
    mockVdoDownload.query.mockClear();
    await act(async () => {onCompleted(SAMPLE_MEDIA_ID, createStatus());});
    expect(mockVdoDownload.query).toHaveBeenCalledTimes(1);
  });
});

describe('DownloadsScreen — actions call the bridge', () => {
  it('enqueues audio + video tracks when the download button is pressed', async () => {
    const enqueue = jest.fn().mockResolvedValue(undefined);
    mockVdoDownload.getDownloadOptions.mockResolvedValue({
      downloadOptions: {availableTracks: [{type: 'audio'}, {type: 'video'}]},
      enqueue,
    });
    const {tree} = await renderScreen();

    await act(async () => {pressable(tree.root, 'download-start').props.onPress();});
    await flush();

    expect(mockVdoDownload.getDownloadOptions).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith({selections: [0, 1]});
  });

  it('stops a download via the Stop button', async () => {
    mockVdoDownload.query.mockResolvedValue([createStatus({status: 'downloading'})]);
    mockVdoDownload.stop.mockResolvedValue(undefined);
    const {tree} = await renderScreen();

    await act(async () => {pressable(tree.root, 'download-stop').props.onPress();});

    expect(mockVdoDownload.stop).toHaveBeenCalledWith([SAMPLE_MEDIA_ID]);
  });

  it('resumes a download via the Resume button', async () => {
    mockVdoDownload.query.mockResolvedValue([createStatus({status: 'downloading'})]);
    mockVdoDownload.resume.mockResolvedValue(undefined);
    const {tree} = await renderScreen();

    await act(async () => {pressable(tree.root, 'download-resume').props.onPress();});

    expect(mockVdoDownload.resume).toHaveBeenCalledWith([SAMPLE_MEDIA_ID]);
  });

  it('removes a download via the Delete button', async () => {
    mockVdoDownload.query.mockResolvedValue([createStatus()]);
    mockVdoDownload.remove.mockResolvedValue(undefined);
    const {tree} = await renderScreen();

    await act(async () => {pressable(tree.root, 'download-delete').props.onPress();});

    expect(mockVdoDownload.remove).toHaveBeenCalledWith([SAMPLE_MEDIA_ID]);
  });

  it('navigates to the offline player for a completed download', async () => {
    mockVdoDownload.query.mockResolvedValue([createStatus()]);
    const {tree, props} = await renderScreen();

    await act(async () => {pressable(tree.root, 'download-play').props.onPress();});

    expect(props.navigation.navigate).toHaveBeenCalledWith(
      'NativeControls',
      expect.objectContaining({
        embedInfo: expect.objectContaining({offline: true, mediaId: SAMPLE_MEDIA_ID}),
      }),
    );
  });
});

describe('DownloadListItem — UI states', () => {
  const props = (over: Record<string, any> = {}) => ({
    title: 'Sample 1',
    onDownload: jest.fn(),
    onPlay: jest.fn(),
    onStop: jest.fn(),
    onResume: jest.fn(),
    onInfo: jest.fn(),
    onDelete: jest.fn(),
    ...over,
  });

  const render = (p: any) => {
    let tree!: any;
    act(() => {tree = renderer.create(<DownloadListItem {...p} />);});
    return tree;
  };

  it('prompts to download when there is no status', () => {
    const tree = render(props({downloadStatus: undefined}));
    expect(allText(tree.root)).toContain('Tap the download icon');
  });

  it('disables Play until the download is completed', () => {
    const tree = render(props({downloadStatus: createStatus({status: 'downloading'})}));
    expect(pressable(tree.root, 'download-play').props.disabled).toBe(true);
  });

  it('enables Play once completed', () => {
    const tree = render(props({downloadStatus: createStatus({status: 'completed'})}));
    expect(pressable(tree.root, 'download-play').props.disabled).toBe(false);
  });

  it('disables Stop/Resume once completed', () => {
    const tree = render(props({downloadStatus: createStatus({status: 'completed'})}));
    expect(pressable(tree.root, 'download-stop').props.disabled).toBe(true);
    expect(pressable(tree.root, 'download-resume').props.disabled).toBe(true);
  });

  it('disables Delete when there is no status', () => {
    const tree = render(props({downloadStatus: undefined}));
    expect(pressable(tree.root, 'download-delete').props.disabled).toBe(true);
  });

  it('fires the matching callback for each action button', () => {
    const p = props({downloadStatus: createStatus({status: 'downloading'})});
    const tree = render(p);

    pressable(tree.root, 'download-start').props.onPress();
    pressable(tree.root, 'download-stop').props.onPress();
    pressable(tree.root, 'download-resume').props.onPress();
    pressable(tree.root, 'download-delete').props.onPress();

    expect(p.onDownload).toHaveBeenCalledTimes(1);
    expect(p.onStop).toHaveBeenCalledTimes(1);
    expect(p.onResume).toHaveBeenCalledTimes(1);
    expect(p.onDelete).toHaveBeenCalledTimes(1);
  });

  it('shows the download percentage while downloading', () => {
    const tree = render(props({downloadStatus: createStatus({status: 'downloading', downloadPercent: 42})}));
    expect(allText(tree.root)).toContain('DOWNLOADING 42%');
  });

  it('shows the failure reason when a download fails', () => {
    const tree = render(
      props({downloadStatus: createStatus({status: 'failed', reason: 'NETWORK', reasonDescription: 'offline'})}),
    );
    expect(allText(tree.root)).toContain('ERROR NETWORK: OFFLINE');
  });
});

describe('HomeScreen — playback entry points', () => {
  beforeEach(() => {
    (global as any).fetch = jest.fn(() =>
      Promise.resolve({json: () => Promise.resolve({otp: 'fetched-otp', playbackInfo: 'fetched-pi'})}),
    );
  });

  const buttonByTitle = (root: any, title: string) =>
    root.findAll((n: any) => n.props && n.props.title === title)[0];

  const renderHome = async () => {
    const props = screenProps();
    let tree!: any;
    await act(async () => {tree = renderer.create(<HomeScreen {...props} />);});
    await flush();
    return {tree, props};
  };

  it('launches the native fullscreen player via startVideoScreen(embedInfo, true)', async () => {
    const {tree} = await renderHome();
    act(() => {buttonByTitle(tree.root, 'Start video in native fullscreen').props.onPress();});
    expect(mockStartVideoScreen).toHaveBeenCalledWith(
      expect.objectContaining({
        embedInfo: expect.objectContaining({otp: expect.any(String), playbackInfo: expect.any(String)}),
      }),
      true,
    );
  });

  it('opens embedded-native-controls playback carrying the embedInfo', async () => {
    const {tree, props} = await renderHome();
    act(() => {buttonByTitle(tree.root, 'Start video with embedded native controls').props.onPress();});
    expect(props.navigation.navigate).toHaveBeenCalledWith(
      'NativeControls',
      expect.objectContaining({embedInfo: expect.any(Object)}),
    );
  });

  it('opens JS-controls playback carrying the embedInfo', async () => {
    const {tree, props} = await renderHome();
    act(() => {buttonByTitle(tree.root, 'Start video with JS controls').props.onPress();});
    expect(props.navigation.navigate).toHaveBeenCalledWith(
      'JSControls',
      expect.objectContaining({embedInfo: expect.any(Object)}),
    );
  });
});
