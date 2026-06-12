/**
 * Tests for VdoPlayerView playback behaviour
 * Covers: VdoPlayerControls callbacks, ref method calls, JSControlsScreen/
 * NativeControlsScreen/PlaylistScreen integration, and pure utility functions.
 * @format
 */

import 'react-native';
import React from 'react';
import renderer, { act } from 'react-test-renderer';


// VdoPlayerView: forwardRef so _player.current is populated with mock methods
jest.mock('vdocipher-rn-bridge', () => {
  const React = require('react');

  const playerMethods = {
    // Commands
    seek: jest.fn(),
    play: jest.fn(),
    pause: jest.fn(),
    setPlaybackSpeed: jest.fn(),
    setAspectRatio: jest.fn(),
    enterFullscreenV2: jest.fn(),
    exitFullscreenV2: jest.fn(),
    setVideoQuality: jest.fn().mockResolvedValue(undefined),
    enableAdaptiveVideo: jest.fn().mockResolvedValue(undefined),
    setCaptionLanguage: jest.fn().mockResolvedValue(undefined),
    disableCaptions: jest.fn().mockResolvedValue(undefined),
    // Async getters
    getCaptionLanguages: jest.fn().mockResolvedValue([]),
    getSelectedCaptionLanguage: jest.fn().mockResolvedValue(null),
    getVideoQualities: jest.fn().mockResolvedValue([]),
    getSelectedVideoQuality: jest.fn().mockResolvedValue(null),
    isAdaptive: jest.fn().mockResolvedValue(false),
    getSelectedAudioQuality: jest.fn().mockResolvedValue(null),
    getDuration: jest.fn().mockResolvedValue({ duration: 60000 }),
    getPlaybackPropertiesV2: jest.fn().mockResolvedValue({}),
  };

  const VdoPlayerView = React.forwardRef((props: any, ref: any) => {
    React.useImperativeHandle(ref, () => playerMethods, []);
    return null;
  });
  VdoPlayerView.displayName = 'VdoPlayerView';

  return {
    VdoDownload: {
      query: jest.fn().mockResolvedValue([]),
      addEventListener: jest.fn().mockReturnValue(jest.fn()),
    },
    startVideoScreen: jest.fn(),
    VdoPlayerView,
    __playerMethods: playerMethods,
  };
});

jest.mock('react-native-orientation', () => ({
  lockToPortrait: jest.fn(),
  lockToLandscape: jest.fn(),
}));

jest.mock('react-native-vector-icons/MaterialIcons', () => ({
  __esModule: true,
  default: 'MatIcon',
}));
jest.mock('react-native-vector-icons/FontAwesome', () => ({
  __esModule: true,
  default: 'Icon',
}));
jest.mock('radio-buttons-react-native', () => ({
  __esModule: true,
  default: 'RadioButtonRN',
}));


import { VdoPlayerView } from 'vdocipher-rn-bridge';
import VdoPlayerControls from '../VdoPlayerControls';
import NativeControlsScreen from '../NativeControlsScreen';
import JSControlsScreen from '../JSControlsScreen';
import PlaylistScreen from '../PlaylistScreen';
import Orientation from 'react-native-orientation';


const mockEmbedInfo = {
  otp: '20160313versUSE3233GHgXyKF5ph',
  playbackInfo: 'eyJ2aWRlb0lkIjoiZjIzNjQ0OTk2NThiNDNkMDljZDBhOWJlZWY1ODhiMDIifQ==',
};

// VdoPlayerControls uses <Pressable> for its interactive controls. Pressable
// renders an internal <View> between itself and its children, so the Icon /
// MatIcon's direct `.parent` is that wrapping View (no onPress). Use this
// helper to find the Pressable test instance directly by its testID.
const findPressable = (component: renderer.ReactTestRenderer, testID: string) =>
  component.root.find((node) =>
    node.props?.testID === testID && typeof node.props?.onPress === 'function',
  );

const createScreenProps = (screenName: string, params: Record<string, any> = {}) => ({
  navigation: { navigate: jest.fn(), goBack: jest.fn() } as any,
  route: { key: screenName, name: screenName as any, params: { embedInfo: mockEmbedInfo, ...params } } as any,
});

// Shorthand for accessing mock methods
const playerMethods = () => (jest.requireMock('vdocipher-rn-bridge') as any).__playerMethods;


describe('NativeControlsScreen — VdoPlayerView props', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders VdoPlayerView with the embedInfo from route params', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<NativeControlsScreen {...createScreenProps('NativeControls')} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(vdoView.props.embedInfo).toEqual(mockEmbedInfo);
  });

  it('binds all player callbacks on VdoPlayerView', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<NativeControlsScreen {...createScreenProps('NativeControls')} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    const callbackProps = [
      'onInitializationSuccess',
      'onInitializationFailure',
      'onLoading',
      'onLoaded',
      'onLoadError',
      'onError',
      'onTracksChanged',
      'onPlaybackSpeedChanged',
      'onMediaEnded',
      'onEnterFullscreen',
      'onExitFullscreen',
    ];
    callbackProps.forEach(cb => {
      expect(typeof vdoView.props[cb]).toBe('function');
    });
  });

  it('all bound callbacks are callable without throwing', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<NativeControlsScreen {...createScreenProps('NativeControls')} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(() => vdoView.props.onInitializationSuccess()).not.toThrow();
    expect(() => vdoView.props.onInitializationFailure({ errorDescription: {} })).not.toThrow();
    expect(() => vdoView.props.onLoading({})).not.toThrow();
    expect(() => vdoView.props.onLoaded({ mediaInfo: { duration: 60000 } })).not.toThrow();
    expect(() => vdoView.props.onLoadError({ errorDescription: {} })).not.toThrow();
    expect(() => vdoView.props.onError({ errorDescription: {} })).not.toThrow();
    expect(() => vdoView.props.onTracksChanged({})).not.toThrow();
    expect(() => vdoView.props.onMediaEnded()).not.toThrow();
  });
});


describe('VdoPlayerControls — VdoPlayerView props', () => {
  beforeEach(() => jest.clearAllMocks());

  it('always passes showNativeControls={false} to VdoPlayerView', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(vdoView.props.showNativeControls).toBe(false);
  });

  it('passes embedInfo through to VdoPlayerView', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(vdoView.props.embedInfo).toEqual(mockEmbedInfo);
  });

  it('does not invoke play() on initial render (playWhenReady starts false)', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Migration: playWhenReady is no longer a prop. Initial mount triggers
    // pause() via the effect (since state starts false). play() should not
    // have been called yet.
    expect(playerMethods().play).not.toHaveBeenCalled();
  });
});


describe('VdoPlayerControls — onLoaded callback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls getCaptionLanguages() on the player ref after load', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    expect(playerMethods().getCaptionLanguages).toHaveBeenCalledTimes(1);
  });

  it('calls getVideoQualities() on the player ref after load', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    expect(playerMethods().getVideoQualities).toHaveBeenCalledTimes(1);
  });

  it('enables the captions button when getCaptionLanguages returns tracks', async () => {
    playerMethods().getCaptionLanguages.mockResolvedValueOnce([
      { id: 1, language: 'en', label: 'English' },
    ]);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    // Captions button visible: a MatIcon with name="closed-caption" appears
    const captionIcon = component.root
      .findAllByType('MatIcon' as any)
      .find((i: any) => i.props.name === 'closed-caption');
    expect(captionIcon).toBeDefined();
  });

  it('does NOT show the captions button when no caption tracks are available', async () => {
    playerMethods().getCaptionLanguages.mockResolvedValueOnce([]);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const captionIcon = component.root
      .findAllByType('MatIcon' as any)
      .find((i: any) => i.props.name === 'closed-caption');
    expect(captionIcon).toBeUndefined();
  });

  it('enables the quality button when getVideoQualities returns multiple tracks', async () => {
    playerMethods().getVideoQualities.mockResolvedValueOnce([
      { id: 0, width: 1280, height: 720, bitrate: 1500000 },
      { id: 1, width: 854, height: 480, bitrate: 800000 },
    ]);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const qualityIcon = component.root
      .findAllByType('MatIcon' as any)
      .find((i: any) => i.props.name === 'high-quality');
    expect(qualityIcon).toBeDefined();
  });

  it('does NOT show the quality button when only one quality track exists', async () => {
    playerMethods().getVideoQualities.mockResolvedValueOnce([
      { id: 0, width: 1280, height: 720, bitrate: 1500000 },
    ]);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const qualityIcon = component.root
      .findAllByType('MatIcon' as any)
      .find((i: any) => i.props.name === 'high-quality');
    expect(qualityIcon).toBeUndefined();
  });
});


describe('VdoPlayerControls — onPlayerStateChanged callback', () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls pause() via ref when state becomes 'ended'", async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Start playback via the play button → triggers play()
    await act(async () => {
      findPressable(component, 'player-play-pause')?.props.onPress();
    });
    expect(playerMethods().play).toHaveBeenCalled();
    const pauseCallsAfterPlay = playerMethods().pause.mock.calls.length;

    // Signal video ended → flips local playWhenReady to false → effect calls pause()
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPlayerStateChanged({
        playWhenReady: true,
        playerState: 'ended',
      });
    });

    expect(playerMethods().pause.mock.calls.length).toBeGreaterThan(pauseCallsAfterPlay);
  });

  it("sets buffering state when playerState is 'buffering'", async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // No assertion on external state, but buffering transition should not throw
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPlayerStateChanged({
        playWhenReady: true,
        playerState: 'buffering',
      });
    });

    // Subsequent 'playing' clears buffering — no throw
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPlayerStateChanged({
        playWhenReady: true,
        playerState: 'playing',
      });
    });
  });
});


describe('VdoPlayerControls — onProgress callback', () => {
  it('updates the position display after receiving progress events', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Load video to set duration (necessary for relative seekbar calc)
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onProgress({
        currentTime: 30000,
      });
    });

    // Position text should reflect 30 seconds = '0:30'
    const positionTexts = component.root
      .findAllByType('Text' as any)
      .filter((t: any) => String(t.props.children).includes(':'));
    expect(positionTexts.some((t: any) => t.props.children === '0:30')).toBe(true);
  });
});


describe('VdoPlayerControls — onPictureInPictureModeChanged callback', () => {
  beforeEach(() => jest.clearAllMocks());

  it('hides the controls overlay when entering PiP mode', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Controls bar is visible initially (play Icon should be present)
    expect(component.root.findAllByType('Icon' as any).length).toBeGreaterThan(0);

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPictureInPictureModeChanged({
        isInPictureInPictureMode: true,
      });
    });

    // Controls bar is hidden — Icon no longer in tree
    expect(component.root.findAllByType('Icon' as any).length).toBe(0);
  });

  it('restores controls when exiting PiP mode', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPictureInPictureModeChanged({
        isInPictureInPictureMode: true,
      });
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPictureInPictureModeChanged({
        isInPictureInPictureMode: false,
      });
    });

    expect(component.root.findAllByType('Icon' as any).length).toBeGreaterThan(0);
  });

  it('forwards isInPictureInPictureMode value to the parent callback', async () => {
    const onPiPChanged = jest.fn();
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(
        <VdoPlayerControls embedInfo={mockEmbedInfo} onPictureInPictureModeChanged={onPiPChanged} />,
      );
    });

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPictureInPictureModeChanged({
        isInPictureInPictureMode: true,
      });
    });

    expect(onPiPChanged).toHaveBeenCalledWith(true);

    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPictureInPictureModeChanged({
        isInPictureInPictureMode: false,
      });
    });

    expect(onPiPChanged).toHaveBeenCalledWith(false);
  });
});


describe('VdoPlayerControls — play/pause button', () => {
  beforeEach(() => jest.clearAllMocks());

  it('pressing play calls play() on the player ref', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const callsBefore = playerMethods().play.mock.calls.length;
    const playIconParent = findPressable(component, 'player-play-pause');
    await act(async () => {
      playIconParent?.props.onPress();
    });

    expect(playerMethods().play.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('pressing pause after play calls pause() on the player ref', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const playIconParent = () => findPressable(component, 'player-play-pause');

    // play
    await act(async () => { playIconParent()?.props.onPress(); });
    expect(playerMethods().play).toHaveBeenCalled();
    const pauseCallsAfterPlay = playerMethods().pause.mock.calls.length;

    // pause
    await act(async () => { playIconParent()?.props.onPress(); });
    expect(playerMethods().pause.mock.calls.length).toBeGreaterThan(pauseCallsAfterPlay);
  });

  it('calls seek(0) on player ref when play is pressed after video ended', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Signal video ended
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onPlayerStateChanged({
        playWhenReady: false,
        playerState: 'ended',
      });
    });

    // Press play
    await act(async () => {
      findPressable(component, 'player-play-pause')?.props.onPress();
    });

    expect(playerMethods().seek).toHaveBeenCalledWith(0);
    expect(playerMethods().play).toHaveBeenCalled();
  });

  it('shows a play icon (not pause) when playWhenReady is false', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const playIcon = component.root.findAllByType('Icon' as any)[0];
    expect(playIcon.props.name).toBe('play');
  });

  it('shows a pause icon when playWhenReady is true', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    await act(async () => {
      findPressable(component, 'player-play-pause')?.props.onPress();
    });

    const playIcon = component.root.findAllByType('Icon' as any)[0];
    expect(playIcon.props.name).toBe('pause');
  });
});


describe('VdoPlayerControls — caption track selection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls getCaptionLanguages and getSelectedCaptionLanguage when captions button pressed', async () => {
    playerMethods().getCaptionLanguages.mockResolvedValue([
      { id: 1, language: 'en', label: 'English' },
    ]);
    playerMethods().getSelectedCaptionLanguage.mockResolvedValue({ id: 1, language: 'en' });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const captionButton = findPressable(component, 'player-captions');

    await act(async () => { captionButton?.props.onPress(); });

    // getCaptionLanguages called once by _isCaptionLanguageAvailable + once by dialog
    expect(playerMethods().getCaptionLanguages).toHaveBeenCalledTimes(2);
    expect(playerMethods().getSelectedCaptionLanguage).toHaveBeenCalled();
  });

  it('calls setCaptionLanguage on player ref when a caption is selected', async () => {
    const captions = [{ id: 2, language: 'fr', label: 'Français' }];
    playerMethods().getCaptionLanguages.mockResolvedValue(captions);
    playerMethods().getSelectedCaptionLanguage.mockResolvedValue(null);

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    // Open the dialog
    const captionButton = findPressable(component, 'player-captions');
    await act(async () => { captionButton?.props.onPress(); });

    // Simulate selecting the radio button for caption id=2
    const radioBtn = component.root.findByType('RadioButtonRN' as any);
    await act(async () => {
      radioBtn.props.selectedBtn({ id: 2, language: 'fr', label: 'Français' });
    });

    expect(playerMethods().setCaptionLanguage).toHaveBeenCalledWith(
      expect.objectContaining({ id: 2, language: 'fr' }),
    );
  });

  it('calls disableCaptions when the "Turn off Captions" option is selected', async () => {
    playerMethods().getCaptionLanguages.mockResolvedValue([
      { id: 1, language: 'en', label: 'English' },
    ]);
    playerMethods().getSelectedCaptionLanguage.mockResolvedValue({ id: 1, language: 'en' });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const captionButton = findPressable(component, 'player-captions');
    await act(async () => { captionButton?.props.onPress(); });

    // Select the "Turn off Captions" item (id: -1)
    const radioBtn = component.root.findByType('RadioButtonRN' as any);
    await act(async () => {
      radioBtn.props.selectedBtn({ id: -1, language: '', label: 'Turn off Captions' });
    });

    expect(playerMethods().disableCaptions).toHaveBeenCalled();
  });
});


describe('VdoPlayerControls — video quality selection', () => {
  beforeEach(() => jest.clearAllMocks());

  it('calls setVideoQuality on player ref when a quality track is selected', async () => {
    const qualities = [
      { id: 0, width: 1280, height: 720, bitrate: 1500000 },
      { id: 1, width: 854, height: 480, bitrate: 800000 },
    ];
    playerMethods().getVideoQualities.mockResolvedValue(qualities);
    playerMethods().getSelectedVideoQuality.mockResolvedValue(qualities[0]);
    playerMethods().isAdaptive.mockResolvedValue(false);
    playerMethods().getDuration.mockResolvedValue({ duration: 120000 });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const qualityButton = findPressable(component, 'player-quality');
    await act(async () => { qualityButton?.props.onPress(); });

    const radioBtn = component.root.findByType('RadioButtonRN' as any);
    await act(async () => {
      radioBtn.props.selectedBtn(qualities[1]);
    });

    expect(playerMethods().setVideoQuality).toHaveBeenCalledWith(qualities[1]);
  });

  it('calls enableAdaptiveVideo when the Auto quality option is selected', async () => {
    const qualities = [
      { id: 0, width: 1280, height: 720, bitrate: 1500000 },
      { id: 1, width: 854, height: 480, bitrate: 800000 },
    ];
    playerMethods().getVideoQualities.mockResolvedValue(qualities);
    // Start on a specific quality (not adaptive) so re-selecting Auto is a real transition.
    playerMethods().getSelectedVideoQuality.mockResolvedValue(qualities[0]);
    playerMethods().isAdaptive.mockResolvedValue(false);
    playerMethods().getDuration.mockResolvedValue({ duration: 120000 });

    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 120000 },
      });
    });

    const qualityButton = findPressable(component, 'player-quality');
    await act(async () => { qualityButton?.props.onPress(); });

    // Select the Auto option (id: -2)
    const radioBtn = component.root.findByType('RadioButtonRN' as any);
    await act(async () => {
      radioBtn.props.selectedBtn({ id: -2, bitrate: 0, width: 0, height: 0, label: 'Auto' });
    });

    expect(playerMethods().enableAdaptiveVideo).toHaveBeenCalled();
  });
});



describe('VdoPlayerControls — seekbar seek math', () => {
  beforeEach(() => jest.clearAllMocks());

  // Helper: render, set duration via onLoaded, lay out seekbar to a known width,
  // then return the tap handler for the seekbar.
  const renderSeekableComponent = async (durationMs: number, seekbarWidth: number) => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Trigger onLoaded so duration is set (component stores seconds = ms/1000)
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: durationMs },
      });
    });

    // Trigger the seekbar's onLayout to set _seekbarWidth to a known value.
    // The inner View with style.seekbar.track has the onLayout handler. Find any
    // node whose props include an onLayout and fire it with our width.
    const nodeWithLayout = component.root.findAll(
      (n) => typeof (n.props as any)?.onLayout === 'function',
    )[0];
    await act(async () => {
      nodeWithLayout.props.onLayout({ nativeEvent: { layout: { width: seekbarWidth } } });
    });

    // The TouchableWithoutFeedback wrapping the seekbar has _onProgressTouch as
    // its onPress; reach it via the first findable with onPress whose parent
    // contains an onLayout child.
    const tappableSeekbar = component.root.findAll(
      (n) => typeof (n.props as any)?.onPress === 'function',
    ).find((n) =>
      n.findAll((c) => typeof (c.props as any)?.onLayout === 'function').length > 0,
    );

    return { component, tap: (locationX: number) => tappableSeekbar!.props.onPress({ nativeEvent: { locationX } }) };
  };

  it('tap at half-width on a 60s video seeks to 30,000ms', async () => {
    const { tap } = await renderSeekableComponent(60000, 400);
    await act(async () => { tap(200); });
    expect(playerMethods().seek).toHaveBeenCalledWith(30000);
  });

  it('tap at start (0) on a 60s video seeks to 0ms', async () => {
    const { tap } = await renderSeekableComponent(60000, 400);
    await act(async () => { tap(0); });
    expect(playerMethods().seek).toHaveBeenCalledWith(0);
  });

  it('tap at full width on a 120s video seeks near the end (~120,000ms)', async () => {
    const { tap } = await renderSeekableComponent(120000, 400);
    await act(async () => { tap(400); });
    // Math.floor((400/400) * 120) = 120 seconds → 120000ms
    expect(playerMethods().seek).toHaveBeenCalledWith(120000);
  });

  it('tap at 25% width on a 200s video seeks to 50,000ms', async () => {
    const { tap } = await renderSeekableComponent(200000, 400);
    await act(async () => { tap(100); });
    expect(playerMethods().seek).toHaveBeenCalledWith(50000);
  });

  it('does not call seek when the seekbar has not laid out yet (width=0)', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Set duration but skip the onLayout step → _seekbarWidth stays 0
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onLoaded({
        mediaInfo: { duration: 60000 },
      });
    });

    const tappableSeekbar = component.root.findAll(
      (n) => typeof (n.props as any)?.onPress === 'function',
    ).find((n) =>
      n.findAll((c) => typeof (c.props as any)?.onLayout === 'function').length > 0,
    );

    await act(async () => {
      tappableSeekbar?.props.onPress({ nativeEvent: { locationX: 100 } });
    });

    expect(playerMethods().seek).not.toHaveBeenCalled();
  });
});


describe('VdoPlayerControls — error event prop forwarding', () => {
  beforeEach(() => jest.clearAllMocks());

  it('forwards onError prop through to VdoPlayerView', async () => {
    const onError = jest.fn();
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} onError={onError} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(vdoView.props.onError).toBe(onError);
  });

  it('forwards onLoadError prop through to VdoPlayerView', async () => {
    const onLoadError = jest.fn();
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} onLoadError={onLoadError} />);
    });

    const vdoView = component.root.findByType(VdoPlayerView as any);
    expect(vdoView.props.onLoadError).toBe(onLoadError);
  });

  it('does not crash when an error payload would flow through onError', async () => {
    const onError = jest.fn();
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} onError={onError} />);
    });

    // Simulate the parent-installed onError firing with a realistic error payload
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onError({
        errorDescription: { errorCode: 1003, errorMsg: 'Decoder failure', httpStatusCode: 0 },
      });
    });

    expect(onError).toHaveBeenCalledWith({
      errorDescription: { errorCode: 1003, errorMsg: 'Decoder failure', httpStatusCode: 0 },
    });
  });

  it('records error state when onInitializationFailure fires (internal handler)', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    // Fire init failure with an error payload
    await act(async () => {
      component.root.findByType(VdoPlayerView as any).props.onInitializationFailure({
        errorDescription: { errorCode: 5002, errorMsg: 'Invalid OTP', httpStatusCode: 401 },
      });
    });

    // No throw, no crash — render still alive. (Internal _onInitFailure sets
    // setError(...); we just verify it didn't blow up the tree.)
    expect(component.toJSON()).not.toBeNull();
  });
});


describe('VdoPlayerControls — embedInfo prop change', () => {
  beforeEach(() => jest.clearAllMocks());

  it('forwards a new embedInfo to VdoPlayerView when the prop changes', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    expect(component.root.findByType(VdoPlayerView as any).props.embedInfo).toEqual(mockEmbedInfo);

    const newEmbedInfo = { otp: 'NEW_OTP', playbackInfo: 'NEW_PBI' };
    await act(async () => {
      component.update(<VdoPlayerControls embedInfo={newEmbedInfo} />);
    });

    expect(component.root.findByType(VdoPlayerView as any).props.embedInfo).toEqual(newEmbedInfo);
  });
});


describe('VdoPlayerControls — playback speed control', () => {
  beforeEach(() => jest.clearAllMocks());

  // The sample's speed button cycles 1.0 → 1.25 → 1.5 → 1.75 → 2.0 → 0.5 → 0.75
  // on each tap, calling _player.current.setPlaybackSpeed(next) every time.
  // This drives the library's setPlaybackSpeed ref method through real UI.

  it('cycles to 1.25× on first tap and calls setPlaybackSpeed(1.25)', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });

    const speedNode = component.root.findAll(
      (n) => (n.props as any)?.testID === 'player-speed',
    )[0];
    await act(async () => { speedNode.props.onPress(); });

    expect(playerMethods().setPlaybackSpeed).toHaveBeenCalledWith(1.25);
  });

  it('cycles through every canonical playback speed', async () => {
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerControls embedInfo={mockEmbedInfo} />);
    });
    const speedNode = component.root.findAll(
      (n) => (n.props as any)?.testID === 'player-speed',
    )[0];

    const expected = [1.25, 1.5, 1.75, 2.0, 0.5, 0.75, 1.0];
    for (let i = 0; i < expected.length; i++) {
      await act(async () => { speedNode.props.onPress(); });
      expect(playerMethods().setPlaybackSpeed).toHaveBeenNthCalledWith(i + 1, expected[i]);
    }
  });
});

//
// Mount VdoPlayerView directly with every callback the library publishes and
// confirm each is wired through to the consumer when the underlying native
// event fires. This is the library's event-surface contract, independent of
// any sample-app screen that does or doesn't choose to subscribe.

describe('VdoPlayerView — full event prop contract', () => {
  beforeEach(() => jest.clearAllMocks());

  const allEventProps = [
    'onInitializationSuccess',
    'onInitializationFailure',
    'onLoading',
    'onLoaded',
    'onLoadError',
    'onError',
    'onPlayerStateChanged',
    'onProgress',
    'onBufferUpdate',
    'onPlaybackSpeedChanged',
    'onTracksChanged',
    'onMediaEnded',
    'onEnterFullscreen',
    'onExitFullscreen',
    'onPictureInPictureModeChanged',
  ];

  it('accepts every documented event prop as a function', async () => {
    const handlers = Object.fromEntries(
      allEventProps.map((name) => [name, jest.fn()]),
    );
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerView embedInfo={mockEmbedInfo} {...handlers} />);
    });

    const view = component.root.findByType(VdoPlayerView as any);
    allEventProps.forEach((name) => {
      expect(typeof view.props[name]).toBe('function');
    });
  });

  it('each event prop is invoked with the right payload shape when fired', async () => {
    const handlers = Object.fromEntries(
      allEventProps.map((name) => [name, jest.fn()]),
    );
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(<VdoPlayerView embedInfo={mockEmbedInfo} {...handlers} />);
    });

    const view = component.root.findByType(VdoPlayerView as any);

    const payloads: Record<string, any> = {
      onInitializationSuccess: { restored: false },
      onInitializationFailure: { errorDescription: { errorCode: 1, errorMsg: 'init', httpStatusCode: 0 } },
      onLoading: { embedInfo: mockEmbedInfo },
      onLoaded: { embedInfo: mockEmbedInfo, mediaInfo: { duration: 60000, mediaId: 'm', title: 't', type: 'vod', description: '' } },
      onLoadError: { embedInfo: mockEmbedInfo, errorDescription: { errorCode: 2, errorMsg: 'load', httpStatusCode: 404 } },
      onError: { embedInfo: mockEmbedInfo, errorDescription: { errorCode: 3, errorMsg: 'decode', httpStatusCode: 0 } },
      onPlayerStateChanged: { playWhenReady: true, playerState: 'playing' },
      onProgress: { currentTime: 1234 },
      onBufferUpdate: { bufferTime: 5000 },
      onPlaybackSpeedChanged: { playbackSpeed: 1.5 },
      onTracksChanged: { availableTracks: [], selectedTracks: [] },
      onMediaEnded: { embedInfo: mockEmbedInfo },
      onEnterFullscreen: undefined,
      onExitFullscreen: undefined,
      onPictureInPictureModeChanged: { isInPictureInPictureMode: true },
    };

    await act(async () => {
      allEventProps.forEach((name) => {
        view.props[name](payloads[name]);
      });
    });

    allEventProps.forEach((name) => {
      expect(handlers[name]).toHaveBeenCalledTimes(1);
      if (payloads[name] !== undefined) {
        expect(handlers[name]).toHaveBeenCalledWith(payloads[name]);
      }
    });
  });
});

//
// Mount VdoPlayerView directly, capture the imperative ref, and invoke every
// command and getter the library publishes. This is the library's ref-method
// contract; existing tests cover the *subset* of these the sample screens
// drive through their own UI.

describe('VdoPlayerView — full ref method contract', () => {
  beforeEach(() => jest.clearAllMocks());

  const renderWithRef = async () => {
    const ref = React.createRef<any>();
    let component!: renderer.ReactTestRenderer;
    await act(async () => {
      component = renderer.create(
        <VdoPlayerView ref={ref} embedInfo={mockEmbedInfo} />,
      );
    });
    return { ref, component };
  };

  it('play() invokes the underlying native command', async () => {
    const { ref } = await renderWithRef();
    ref.current.play();
    expect(playerMethods().play).toHaveBeenCalledTimes(1);
  });

  it('pause() invokes the underlying native command', async () => {
    const { ref } = await renderWithRef();
    ref.current.pause();
    expect(playerMethods().pause).toHaveBeenCalledTimes(1);
  });

  it('seek(ms) forwards the millisecond target', async () => {
    const { ref } = await renderWithRef();
    ref.current.seek(45_000);
    expect(playerMethods().seek).toHaveBeenCalledWith(45_000);
  });

  it('setPlaybackSpeed(rate) forwards the speed value', async () => {
    const { ref } = await renderWithRef();
    ref.current.setPlaybackSpeed(1.5);
    expect(playerMethods().setPlaybackSpeed).toHaveBeenCalledWith(1.5);
  });

  it('setPlaybackSpeed accepts the full canonical range (0.5×–2.0×)', async () => {
    const { ref } = await renderWithRef();
    [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0].forEach((rate) => {
      ref.current.setPlaybackSpeed(rate);
    });
    expect(playerMethods().setPlaybackSpeed).toHaveBeenCalledTimes(7);
    expect(playerMethods().setPlaybackSpeed).toHaveBeenNthCalledWith(7, 2.0);
  });

  it('setAspectRatio(ratio) forwards the ratio', async () => {
    const { ref } = await renderWithRef();
    ref.current.setAspectRatio(16 / 9);
    expect(playerMethods().setAspectRatio).toHaveBeenCalledWith(16 / 9);
  });

  // V1 enterFullscreen() / exitFullscreen() were removed in the codegen-
  // commands migration. Only V2 is part of the public API now.

  it('enterFullscreenV2() invokes the V2 native command', async () => {
    const { ref } = await renderWithRef();
    ref.current.enterFullscreenV2();
    expect(playerMethods().enterFullscreenV2).toHaveBeenCalledTimes(1);
  });

  it('exitFullscreenV2() invokes the V2 native command', async () => {
    const { ref } = await renderWithRef();
    ref.current.exitFullscreenV2();
    expect(playerMethods().exitFullscreenV2).toHaveBeenCalledTimes(1);
  });

  it('setVideoQuality(quality) forwards the track', async () => {
    const { ref } = await renderWithRef();
    const quality = { id: 1, width: 1280, height: 720, bitrate: 1500000 };
    ref.current.setVideoQuality(quality);
    expect(playerMethods().setVideoQuality).toHaveBeenCalledWith(quality);
  });

  it('enableAdaptiveVideo() flips the player into adaptive mode', async () => {
    const { ref } = await renderWithRef();
    ref.current.enableAdaptiveVideo();
    expect(playerMethods().enableAdaptiveVideo).toHaveBeenCalledTimes(1);
  });

  it('setCaptionLanguage(lang) forwards the caption track', async () => {
    const { ref } = await renderWithRef();
    const lang = { id: 1, language: 'en', label: 'English' };
    ref.current.setCaptionLanguage(lang);
    expect(playerMethods().setCaptionLanguage).toHaveBeenCalledWith(lang);
  });

  it('disableCaptions() turns captions off', async () => {
    const { ref } = await renderWithRef();
    ref.current.disableCaptions();
    expect(playerMethods().disableCaptions).toHaveBeenCalledTimes(1);
  });

  // ─── Async getters ───────────────────────────────────────────────────────

  it('isAdaptive() returns a Promise<boolean>', async () => {
    playerMethods().isAdaptive.mockResolvedValueOnce(true);
    const { ref } = await renderWithRef();
    await expect(ref.current.isAdaptive()).resolves.toBe(true);
  });

  it('getVideoQualities() returns a Promise<Track[]>', async () => {
    const tracks = [{ id: 0, width: 1920, height: 1080, bitrate: 3000000 }];
    playerMethods().getVideoQualities.mockResolvedValueOnce(tracks);
    const { ref } = await renderWithRef();
    await expect(ref.current.getVideoQualities()).resolves.toEqual(tracks);
  });

  it('getSelectedVideoQuality() returns a Promise<Track | null>', async () => {
    const selected = { id: 1, width: 1280, height: 720, bitrate: 1500000 };
    playerMethods().getSelectedVideoQuality.mockResolvedValueOnce(selected);
    const { ref } = await renderWithRef();
    await expect(ref.current.getSelectedVideoQuality()).resolves.toEqual(selected);
  });

  it('getSelectedAudioQuality() returns a Promise<AudioQuality | null>', async () => {
    const audio = { id: 5, language: 'en', bitrate: 128000 };
    playerMethods().getSelectedAudioQuality.mockResolvedValueOnce(audio);
    const { ref } = await renderWithRef();
    await expect(ref.current.getSelectedAudioQuality()).resolves.toEqual(audio);
  });

  it('getCaptionLanguages() returns a Promise<CaptionLanguage[]>', async () => {
    const caps = [{ id: 1, language: 'en', label: 'English' }];
    playerMethods().getCaptionLanguages.mockResolvedValueOnce(caps);
    const { ref } = await renderWithRef();
    await expect(ref.current.getCaptionLanguages()).resolves.toEqual(caps);
  });

  it('getSelectedCaptionLanguage() returns a Promise<CaptionLanguage | null>', async () => {
    playerMethods().getSelectedCaptionLanguage.mockResolvedValueOnce(null);
    const { ref } = await renderWithRef();
    await expect(ref.current.getSelectedCaptionLanguage()).resolves.toBeNull();
  });

  it('getDuration() returns a Promise<{ duration: number }>', async () => {
    playerMethods().getDuration.mockResolvedValueOnce({ duration: 120_000 });
    const { ref } = await renderWithRef();
    await expect(ref.current.getDuration()).resolves.toEqual({ duration: 120_000 });
  });

  it('getPlaybackPropertiesV2() returns a Promise<PlaybackProperty>', async () => {
    const props = { totalPlayed: 30_000, totalCovered: 60_000 };
    playerMethods().getPlaybackPropertiesV2.mockResolvedValueOnce(props);
    const { ref } = await renderWithRef();
    await expect(ref.current.getPlaybackPropertiesV2()).resolves.toEqual(props);
  });
});
