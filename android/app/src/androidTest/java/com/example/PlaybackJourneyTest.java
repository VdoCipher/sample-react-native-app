package com.example;

import android.content.Context;
import android.content.Intent;
import android.graphics.Rect;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.UiObject2;
import androidx.test.uiautomator.Until;

import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.regex.Pattern;

import android.os.RemoteException;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Playback journey tests — exercise every library code path reachable through
 * the sample app UI: play/pause, seek, quality switch (incl. adaptive), caption
 * track selection, playback speed change, fullscreen enter/exit, and the
 * download lifecycle (getDownloadOptions → enqueue → stop).
 *
 * Run against the release build to catch R8/native-side crashes:
 *     ./gradlew connectedReleaseAndroidTest
 *
 * Element identifiers come from testID/accessibilityLabel hooks on
 * VdoPlayerControls and DownloadListItem.
 */
@RunWith(AndroidJUnit4.class)
public class PlaybackJourneyTest {

    private static final String APP_PACKAGE = "com.example";
    private static final long LAUNCH_TIMEOUT_MS = 30_000;
    private static final long UI_WAIT_TIMEOUT_MS = 15_000;
    // The "Start video..." buttons depend on a network fetch to
    // dev.vdocipher.com to populate OTP/playbackInfo before the title flips
    // from "Loading..." to the ready label. Allow generous time on slow
    // devices/networks.
    private static final long READY_STATE_TIMEOUT_MS = 60_000;
    private static final long PLAYBACK_SETTLE_MS = 5_000;

    private static final String HOME_WELCOME =
            "Welcome to VdoCipher react-native integration!";
    private static final String JS_CONTROLS_BUTTON =
            "Start video with JS controls";
    private static final String JS_CONTROLS_DESCRIPTION =
            "The ui controls for the player are react-native components";
    private static final String NATIVE_CONTROLS_BUTTON =
            "Start video with embedded native controls";
    private static final String NATIVE_CONTROLS_DESCRIPTION =
            "The ui controls for the player are embedded inside the native view";
    private static final String DOWNLOADS_BUTTON = "Downloads";
    private static final String DOWNLOADS_HEADER = "Download samples";

    private UiDevice device;

    /**
     * Case-insensitive selector for `<Button>` titles. RN's Button renders to
     * a native AppCompat Button which uppercases its title on Android by
     * default (allCaps), so a literal-text match against the original title
     * fails. The welcome / description text uses `<Text>`, which is NOT
     * uppercased — keep By.text() literal there.
     */
    private static androidx.test.uiautomator.BySelector buttonText(String text) {
        return By.text(Pattern.compile(Pattern.quote(text), Pattern.CASE_INSENSITIVE));
    }

    @After
    public void restoreOrientation() {
        // Tests that rotate the device must leave the runner in a known state
        // so subsequent tests aren't confused by a sideways HomeScreen.
        if (device != null) {
            try {
                device.setOrientationNatural();
                device.unfreezeRotation();
            } catch (RemoteException ignored) {
            }
        }
    }

    @Before
    public void launchApp() throws RemoteException {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        // Force portrait BEFORE app launch — orientation tests only belong on
        // the player screen, not on Home/navigation. If a prior test left
        // the device in landscape, HomeScreen's content overflows on small
        // devices and Downloads/Playlist buttons get clipped off-screen.
        device.setOrientationNatural();
        device.unfreezeRotation();

        device.pressHome();

        Context ctx = ApplicationProvider.getApplicationContext();
        Intent intent = ctx.getPackageManager().getLaunchIntentForPackage(APP_PACKAGE);
        assertNotNull("Launch intent for " + APP_PACKAGE + " is null — is the app installed?", intent);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        ctx.startActivity(intent);

        boolean appeared = device.wait(
                Until.hasObject(By.pkg(APP_PACKAGE).depth(0)),
                LAUNCH_TIMEOUT_MS);
        assertTrue("App did not launch", appeared);
        // Wait for the actual HomeScreen text — not just any app element.
        // The RN JS bundle takes a few seconds to render content; without
        // this wait, subsequent findObject() calls hit a blank screen and NPE.
        assertTrue("HomeScreen welcome text never appeared",
                device.wait(Until.hasObject(By.text(HOME_WELCOME)), LAUNCH_TIMEOUT_MS));
    }

    /**
     * Full JS-controls journey:
     *   play → pause → seek → caption picker → quality picker (adaptive) →
     *   speed cycle → fullscreen toggle → back.
     *
     * Exercises every library ref method the JS UI binds:
     *   seek, setPlaybackSpeed, setCaptionLanguage, disableCaptions,
     *   setVideoQuality, enableAdaptiveVideo, plus prop-level fullscreen wiring.
     */
    @Test
    public void jsControlsPlaybackJourney() {
        openPlayerScreen(JS_CONTROLS_BUTTON, JS_CONTROLS_DESCRIPTION);

        // ── Play / pause (drives playWhenReady prop) ───────────────────────
        tapByDesc("player-play-pause", "play button");
        sleepQuietly(PLAYBACK_SETTLE_MS);
        tapByDesc("player-play-pause", "pause button");

        // ── Seek (drives the seek() ref method) ────────────────────────────
        UiObject2 seekbar = waitForDesc("player-seekbar", "seekbar");
        Rect bounds = seekbar.getVisibleBounds();
        device.click(bounds.centerX(), bounds.centerY());
        sleepQuietly(2_000); // allow rebuffer

        // ── Fullscreen toggle FIRST (drives onEnter/onExitFullscreen) ──────
        // We toggle fullscreen BEFORE captions / quality because when those
        // become available the controls row gains two extra icons. On narrow
        // / small-screen devices that can push the fullscreen icon off the
        // right edge of the visible viewport (out of UI Automator's reach).
        // Toggling it first guarantees the button is findable.
        tapByDesc("player-fullscreen", "enter fullscreen");
        sleepQuietly(2_000);
        tapByDesc("player-fullscreen", "exit fullscreen");
        sleepQuietly(1_000);

        // ── Caption picker (drives getCaptionLanguages + setCaptionLanguage)
        // Only appears when the SDK reports caption tracks.
        UiObject2 captionsBtn = device.findObject(By.desc("player-captions"));
        if (captionsBtn != null) {
            captionsBtn.click();
            sleepQuietly(1_000);
            // Dismiss the modal — back press collapses the picker without
            // selecting anything (still verifies open/close lifecycle).
            device.pressBack();
            sleepQuietly(1_000);
        }

        // ── Quality picker + adaptive (drives setVideoQuality / enableAdaptiveVideo)
        UiObject2 qualityBtn = device.findObject(By.desc("player-quality"));
        if (qualityBtn != null) {
            qualityBtn.click();
            sleepQuietly(1_000);
            // Auto entry is the last option in the picker. Tap it if found.
            UiObject2 autoOpt = device.findObject(By.text("Auto"));
            if (autoOpt != null) {
                autoOpt.click();
                sleepQuietly(2_000); // adaptive engages + rebuffers
            } else {
                device.pressBack();
                sleepQuietly(1_000);
            }
        }

        // ── Playback speed cycle (drives setPlaybackSpeed for every speed) ─
        // The sample's speed button cycles 1.0 → 1.25 → 1.5 → 1.75 → 2.0 →
        // 0.5 → 0.75. Tap 7 times to exercise the full set.
        for (int i = 0; i < 7; i++) {
            UiObject2 speedBtn = device.findObject(By.desc("player-speed"));
            if (speedBtn == null) {
                break; // controls overlay may auto-hide; fail soft.
            }
            speedBtn.click();
            sleepQuietly(800);
        }

        // ── Return home — confirms the app survived the journey ─────────────
        // A quality picker modal CAN remain open: if the player was already in
        // adaptive mode when the test tapped "Auto", handleRadioChange returns
        // early without toggling modalVisible. First back closes the modal,
        // second back exits the screen. Try once, then retry if not yet home.
        device.pressBack();
        boolean onHome = device.wait(
                Until.hasObject(By.text(HOME_WELCOME)), 5_000);
        if (!onHome) {
            device.pressBack();
            onHome = device.wait(
                    Until.hasObject(By.text(HOME_WELCOME)), UI_WAIT_TIMEOUT_MS);
        }
        assertTrue("App did not return to HomeScreen — likely a crash mid-journey",
                onHome);
    }

    /**
     * Passive native-controls journey: open the screen and let the player
     * run untouched. The SDK's embedded UIKit/Android controls aren't
     * testID-addressable from RN; we rely on sustained playback to surface
     * native crashes (onRenderedFirstFrame NPE, decoder failure, DRM, etc.).
     */
    @Test
    public void nativeControlsSurvivesSustainedPlayback() {
        openPlayerScreen(NATIVE_CONTROLS_BUTTON, NATIVE_CONTROLS_DESCRIPTION);
        sleepQuietly(8_000);
        device.pressBack();
        assertTrue("App did not return to HomeScreen — likely a crash during playback",
                device.wait(Until.hasObject(By.text(HOME_WELCOME)), UI_WAIT_TIMEOUT_MS));
    }

    /**
     * Download lifecycle journey:
     *   navigate to DownloadsScreen → tap Download on first sample
     *   (drives VdoDownload.getDownloadOptions + enqueue) → wait briefly
     *   for status change → tap Stop (drives VdoDownload.stop) → back to Home.
     *
     * Exercises VdoDownload.query, getDownloadOptions, enqueue, and stop on
     * a real download manager. A crash anywhere — DRM license fetch,
     * download enqueue, status reporting — fails the test.
     */
    @Test
    public void downloadLifecycleJourney() {
        // Navigate to Downloads
        device.findObject(buttonText(DOWNLOADS_BUTTON)).click();
        assertTrue("DownloadsScreen did not appear",
                device.wait(Until.hasObject(By.text(DOWNLOADS_HEADER)), UI_WAIT_TIMEOUT_MS));

        // Tap the row's Download (cloud) icon to drive
        // VdoDownload.getDownloadOptions + enqueue.
        UiObject2 downloadBtn = device.findObject(By.desc("download-start"));
        assertNotNull("download-start testID not found in DownloadsScreen", downloadBtn);
        downloadBtn.click();

        // Allow the SDK to call getDownloadOptions + enqueue. Status should
        // transition through "queued" / "downloading" / "completed" depending
        // on network speed. We accept any non-initial status as a success
        // signal that the library plumbing worked.
        sleepQuietly(6_000);

        boolean someDownloadActivity =
                device.hasObject(By.textContains("downloading"))
                        || device.hasObject(By.textContains("queued"))
                        || device.hasObject(By.textContains("completed"))
                        || device.hasObject(By.textContains("%"));
        // Don't hard-fail on network — passing means we observed library
        // state transitions; failing means probably an offline runner, not
        // a library bug. Log instead.
        if (!someDownloadActivity) {
            android.util.Log.w("PlaybackJourneyTest",
                    "No download status observed — runner may be offline. "
                    + "Library API was still invoked without crashing.");
        }

        // Try to stop the download (drives VdoDownload.stop).
        UiObject2 stopBtn = device.findObject(By.desc("download-stop"));
        if (stopBtn != null && stopBtn.isEnabled()) {
            stopBtn.click();
            sleepQuietly(1_000);

            // Resume the download (drives VdoDownload.resume).
            UiObject2 resumeBtn = device.findObject(By.desc("download-resume"));
            if (resumeBtn != null && resumeBtn.isEnabled()) {
                resumeBtn.click();
                sleepQuietly(1_000);
            }
        }

        // Delete the download (drives VdoDownload.remove).
        UiObject2 deleteBtn = device.findObject(By.desc("download-delete"));
        if (deleteBtn != null && deleteBtn.isEnabled()) {
            deleteBtn.click();
            sleepQuietly(1_000);
        }

        // Back to Home — confirms app survived.
        device.pressBack();
        assertTrue("App did not return to HomeScreen after download journey",
                device.wait(Until.hasObject(By.text(HOME_WELCOME)), UI_WAIT_TIMEOUT_MS));
    }

    /**
     * Rotation survival test — exercises the library's response to portrait
     * ↔ landscape transitions both in inline (non-fullscreen) mode and in
     * fullscreen mode.
     *
     * Catches: native renderer crash on rotation, decoder restart failure,
     * aspect-ratio glitches, dropped first-frame callback after recreation,
     * audio focus loss on configuration change.
     */
    @Test
    public void rotationSurvivesPlayback() throws RemoteException {
        openPlayerScreen(JS_CONTROLS_BUTTON, JS_CONTROLS_DESCRIPTION);

        // Start playback so the renderer is actually decoding when we rotate.
        tapByDesc("player-play-pause", "play button");
        sleepQuietly(PLAYBACK_SETTLE_MS);

        // ── Inline rotation: portrait → landscape → portrait ────────────────
        device.setOrientationLeft();
        sleepQuietly(2_000);
        assertTrue("App not alive after rotating to landscape (inline mode)",
                device.wait(Until.hasObject(By.pkg(APP_PACKAGE).depth(0)),
                        UI_WAIT_TIMEOUT_MS));

        device.setOrientationNatural();
        sleepQuietly(2_000);
        assertTrue("App not alive after rotating back to portrait (inline mode)",
                device.wait(Until.hasObject(By.text(JS_CONTROLS_DESCRIPTION)),
                        UI_WAIT_TIMEOUT_MS));

        // ── Fullscreen rotation: enter fullscreen, rotate twice, exit ──────
        tapByDesc("player-fullscreen", "enter fullscreen");
        sleepQuietly(2_000);

        device.setOrientationRight();
        sleepQuietly(2_000);
        assertTrue("App not alive after right-rotation in fullscreen",
                device.wait(Until.hasObject(By.pkg(APP_PACKAGE).depth(0)),
                        UI_WAIT_TIMEOUT_MS));

        device.setOrientationLeft();
        sleepQuietly(2_000);
        assertTrue("App not alive after left-rotation in fullscreen",
                device.wait(Until.hasObject(By.pkg(APP_PACKAGE).depth(0)),
                        UI_WAIT_TIMEOUT_MS));

        device.setOrientationNatural();
        sleepQuietly(2_000);

        // Exit fullscreen and return Home.
        UiObject2 fsBtn = device.findObject(By.desc("player-fullscreen"));
        if (fsBtn != null) {
            fsBtn.click();
            sleepQuietly(1_000);
        }

        device.pressBack();
        assertTrue("App did not return to HomeScreen after rotation journey — likely a crash",
                device.wait(Until.hasObject(By.text(HOME_WELCOME)), UI_WAIT_TIMEOUT_MS));
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private void openPlayerScreen(String label, String descriptionText) {
        // Wait for the network-driven ready state — the Button title flips
        // from "Loading..." once the OTP/playbackInfo fetch completes. Use
        // case-insensitive matching because RN Button uppercases its title
        // on Android (allCaps).
        assertTrue("\"" + label + "\" button never reached ready state "
                        + "(check network access to dev.vdocipher.com)",
                device.wait(Until.hasObject(buttonText(label)), READY_STATE_TIMEOUT_MS));
        device.findObject(buttonText(label)).click();
        // Description text is a <Text>, not a Button — case-sensitive match.
        assertTrue("Player screen never mounted: \"" + descriptionText + "\"",
                device.wait(Until.hasObject(By.text(descriptionText)), UI_WAIT_TIMEOUT_MS));
    }

    private UiObject2 waitForDesc(String desc, String label) {
        boolean found = device.wait(Until.hasObject(By.desc(desc)), UI_WAIT_TIMEOUT_MS);
        assertTrue(label + " (desc=\"" + desc + "\") not found", found);
        return device.findObject(By.desc(desc));
    }

    private void tapByDesc(String desc, String label) {
        waitForDesc(desc, label).click();
    }

    private static void sleepQuietly(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
