package com.example;

import android.content.Context;
import android.content.Intent;
import android.os.RemoteException;

import androidx.test.core.app.ApplicationProvider;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.By;
import androidx.test.uiautomator.UiDevice;
import androidx.test.uiautomator.Until;

import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

import java.util.regex.Pattern;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

/**
 * Pre-release smoke tests.
 *
 * Run against the release build (R8 + ProGuard active) to catch native
 * crashes that don't appear in Jest:
 *     ./gradlew connectedReleaseAndroidTest
 *
 * Against debug:
 *     ./gradlew connectedDebugAndroidTest
 *
 * UI Automator (not Espresso ViewMatchers) is used because React Native
 * renders into a single native ReactRootView, which Espresso can't drill
 * into cleanly. UI Automator works at the accessibility layer and finds
 * RN-rendered text reliably across platforms.
 */
@RunWith(AndroidJUnit4.class)
public class SmokeTest {

    private static final String APP_PACKAGE = "com.example";
    private static final long LAUNCH_TIMEOUT_MS = 30_000;
    private static final long UI_WAIT_TIMEOUT_MS = 15_000;
    // The "Start video..." buttons depend on a network fetch to
    // dev.vdocipher.com to populate OTP/playbackInfo before the title flips
    // from "Loading..." to the ready label. Allow generous time on slow
    // devices/networks.
    private static final long READY_STATE_TIMEOUT_MS = 60_000;

    private static final String HOME_WELCOME =
            "Welcome to VdoCipher react-native integration!";
    private static final String NATIVE_CONTROLS_BUTTON =
            "Start video with embedded native controls";
    private static final String NATIVE_CONTROLS_DESCRIPTION =
            "The ui controls for the player are embedded inside the native view";
    private static final String JS_CONTROLS_BUTTON =
            "Start video with JS controls";
    private static final String JS_CONTROLS_DESCRIPTION =
            "The ui controls for the player are react-native components";

    private UiDevice device;

    @Before
    public void launchApp() throws RemoteException {
        device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation());

        // Force portrait BEFORE app launch — Home/navigation must never be in
        // landscape. Orientation testing belongs to the player screen only.
        // If a prior test left the device in landscape, HomeScreen's content
        // overflows and buttons get clipped off-screen.
        device.setOrientationNatural();
        device.unfreezeRotation();

        // Start from a known state — Home screen.
        device.pressHome();

        // Launch the app via its launcher intent.
        Context ctx = ApplicationProvider.getApplicationContext();
        Intent intent = ctx.getPackageManager().getLaunchIntentForPackage(APP_PACKAGE);
        assertNotNull("Launch intent for " + APP_PACKAGE + " is null — is the app installed?", intent);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TASK);
        ctx.startActivity(intent);

        // Wait for the package to appear (first frame of the activity).
        boolean appeared = device.wait(
                Until.hasObject(By.pkg(APP_PACKAGE).depth(0)),
                LAUNCH_TIMEOUT_MS);
        assertTrue("App did not launch within " + LAUNCH_TIMEOUT_MS + "ms", appeared);
    }

    /**
     * Verifies the JS bundle loaded and HomeScreen rendered. A failure here
     * usually means a crash in startup — JS bundle parse error, native module
     * registration failure, R8 stripping of a required class, etc.
     */
    @Test
    public void appLaunchesAndRendersHome() {
        boolean homeVisible = device.wait(
                Until.hasObject(By.text(HOME_WELCOME)),
                UI_WAIT_TIMEOUT_MS);
        assertTrue("HomeScreen welcome text never appeared", homeVisible);
    }

    /**
     * Flow A: Home → NativeControlsScreen → back.
     *
     * Exercises the player with `showNativeControls=true` (Android SDK's
     * embedded UI). Crashes specific to the native control overlay surface
     * here.
     */
    @Test
    public void canNavigateToNativeControlsAndBack() {
        assertCanReachAndReturn(NATIVE_CONTROLS_BUTTON, NATIVE_CONTROLS_DESCRIPTION);
    }

    /**
     * Flow B: Home → JSControlsScreen → back.
     *
     * Exercises the player with `showNativeControls=false`, where the
     * controls are RN components. This is the flow that catches the
     * R8/Parcelable NPE in production — the crash fires inside
     * VdoPlayerView$c.onRenderedFirstFrame shortly after this screen mounts.
     */
    @Test
    public void canNavigateToJsControlsAndBack() {
        assertCanReachAndReturn(JS_CONTROLS_BUTTON, JS_CONTROLS_DESCRIPTION);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private void assertCanReachAndReturn(String buttonText, String screenSignature) {
        // Confirm HomeScreen has rendered before tapping anything.
        boolean homeVisible = device.wait(
                Until.hasObject(By.text(HOME_WELCOME)),
                UI_WAIT_TIMEOUT_MS);
        assertTrue("HomeScreen never appeared", homeVisible);

        // The button label flips to "Loading..." until a network fetch to
        // dev.vdocipher.com returns OTP/playbackInfo. RN's Button uppercases
        // titles on Android (allCaps), so we match case-insensitively.
        androidx.test.uiautomator.BySelector btn = By.text(
                Pattern.compile(Pattern.quote(buttonText), Pattern.CASE_INSENSITIVE));
        boolean ready = device.wait(Until.hasObject(btn), READY_STATE_TIMEOUT_MS);
        assertTrue("\"" + buttonText + "\" button never reached ready state "
                + "(check network access to dev.vdocipher.com)", ready);

        // Navigate into the player screen.
        device.findObject(btn).click();

        // Wait for the screen's distinctive text. If init+first-frame crashes,
        // this assertion times out instead of finding the text.
        boolean mounted = device.wait(
                Until.hasObject(By.text(screenSignature)),
                UI_WAIT_TIMEOUT_MS);
        assertTrue(
                "Player screen never mounted (crash during init?): expected \""
                        + screenSignature + "\"",
                mounted);

        // Back to Home.
        device.pressBack();

        boolean backOnHome = device.wait(
                Until.hasObject(By.text(HOME_WELCOME)),
                UI_WAIT_TIMEOUT_MS);
        assertTrue("Did not return to HomeScreen after back press", backOnHome);
    }
}
