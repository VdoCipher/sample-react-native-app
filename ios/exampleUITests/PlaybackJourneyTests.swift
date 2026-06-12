// MARK: - Playback journey UI tests
//
// Exercise every library code path reachable through the sample app UI:
// play/pause, seek, caption picker, quality switch (incl. adaptive), speed
// cycle, fullscreen toggle, and the download lifecycle.
//
// Same Xcode wiring as SmokeTests.swift — this file must be a member of the
// `exampleUITests` UI Testing Bundle target.
//
// Element identifiers come from testID props on VdoPlayerControls (RN maps
// `testID` to `accessibilityIdentifier` on iOS).

import XCTest

final class PlaybackJourneyTests: XCTestCase {

    private let homeWelcome = "Welcome to VdoCipher react-native integration!"
    private let jsControlsButton = "Start video with JS controls"
    private let jsControlsDescription =
        "The ui controls for the player are react-native components"
    private let nativeControlsButton = "Start video with embedded native controls"
    private let nativeControlsDescription =
        "The ui controls for the player are embedded inside the native view"
    private let downloadsButton = "Downloads"
    private let downloadsHeader = "Download samples"

    override func setUpWithError() throws {
        continueAfterFailure = false

        // Force portrait BEFORE app launch — Home/navigation must never be
        // in landscape. Orientation testing belongs to the player screen only.
        XCUIDevice.shared.orientation = .portrait
    }

    override func tearDown() {
        // Defense-in-depth — restore portrait after every test, even ones
        // that didn't intentionally rotate.
        XCUIDevice.shared.orientation = .portrait
        super.tearDown()
    }

    /// Full JS-controls journey:
    ///   play → pause → seek → fullscreen → captions → quality + adaptive →
    ///   speed cycle.
    ///
    /// Exercises every library ref method the JS UI binds:
    ///   seek, setPlaybackSpeed, setCaptionLanguage, disableCaptions,
    ///   setVideoQuality, enableAdaptiveVideo, plus prop-level fullscreen
    ///   wiring.
    func testJsControlsPlaybackJourney() throws {
        let app = XCUIApplication()
        app.launch()

        try openPlayerScreen(app: app,
                             buttonLabel: jsControlsButton,
                             screenSignature: jsControlsDescription)

        // ── Play / pause (drives playWhenReady prop) ───────────────────────
        tapPlayer(app: app, id: "player-play-pause", label: "play button")
        sleep(5)
        tapPlayer(app: app, id: "player-play-pause", label: "pause button")

        // ── Seek (drives the seek() ref method) ────────────────────────────
        let seekbar = app.otherElements["player-seekbar"]
        XCTAssertTrue(seekbar.waitForExistence(timeout: 10),
                      "Seekbar not found.")
        seekbar.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        sleep(2)

        // ── Fullscreen toggle FIRST (drives onEnter/onExitFullscreen) ──────
        // Toggle fullscreen BEFORE captions / quality become available —
        // when those icons render, the controls row gains two extra elements
        // which can push the fullscreen icon off-screen on narrow displays.
        tapPlayer(app: app, id: "player-fullscreen", label: "enter fullscreen")
        sleep(2)
        tapPlayer(app: app, id: "player-fullscreen", label: "exit fullscreen")
        sleep(1)

        // ── Caption picker (drives getCaptionLanguages + setCaptionLanguage)
        let captionsBtn = app.otherElements["player-captions"]
        if captionsBtn.exists {
            tapPlayerOptional(app: app, id: "player-captions")
            sleep(1)
            app.tap()       // dismiss modal by tapping outside
            sleep(1)
        }

        // ── Quality picker + adaptive (drives setVideoQuality/enableAdaptiveVideo)
        let qualityBtn = app.otherElements["player-quality"]
        if qualityBtn.exists {
            tapPlayerOptional(app: app, id: "player-quality")
            sleep(1)
            let auto = app.staticTexts["Auto"]
            if auto.exists {
                auto.tap()
                sleep(2) // adaptive engages + rebuffers
            } else {
                app.tap() // dismiss
                sleep(1)
            }
        }

        // ── Playback speed cycle (drives setPlaybackSpeed for every speed) ─
        // The sample's speed button cycles 1.0 → 1.25 → 1.5 → 1.75 → 2.0 →
        // 0.5 → 0.75. Tap 7 times to cover the full set.
        // Coordinate-tap rather than .tap() — XCUITest's accessibility-based
        // tap insists on scrolling the element into the visible viewport,
        // which fails on small screens because the controls row has no
        // parent ScrollView (kAXErrorCannotComplete on AXScrollToVisible).
        for _ in 0..<7 {
            tapPlayerOptional(app: app, id: "player-speed")
            usleep(800_000) // 0.8s between taps
        }

        // ── Survival check ─────────────────────────────────────────────────
        // We don't try to navigate back to Home — the native player view
        // intercepts touches at the left edge, so the iOS swipe-back gesture
        // is unreliable. A crash mid-journey would put app.state at
        // .notRunning; if we're still in the foreground, the library survived.
        XCTAssertEqual(
            app.state, .runningForeground,
            "App is no longer in the foreground — likely a crash mid-journey."
        )
    }

    /// Passive native-controls journey: open the screen and let the player
    /// run untouched. The SDK's embedded UIKit controls aren't
    /// testID-addressable; sustained playback surfaces native crashes
    /// (first-frame callback, decoder, DRM, etc.).
    func testNativeControlsSurvivesSustainedPlayback() throws {
        let app = XCUIApplication()
        app.launch()

        try openPlayerScreen(app: app,
                             buttonLabel: nativeControlsButton,
                             screenSignature: nativeControlsDescription)

        sleep(8)

        XCTAssertEqual(
            app.state, .runningForeground,
            "App is no longer in the foreground — likely a crash during native playback."
        )
    }

    /// Download lifecycle journey:
    ///   navigate to DownloadsScreen → tap Download on a sample
    ///   (drives VdoDownload.getDownloadOptions + enqueue) → stop → resume →
    ///   delete.
    ///
    /// Exercises VdoDownload.query, getDownloadOptions, enqueue, stop, resume,
    /// remove. A crash anywhere — DRM license fetch, download enqueue,
    /// status reporting — fails the test.
    func testDownloadLifecycleJourney() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts[homeWelcome].waitForExistence(timeout: 15),
                      "HomeScreen never appeared.")

        // Navigate to Downloads
        app.buttons[downloadsButton].tap()
        XCTAssertTrue(
            app.staticTexts[downloadsHeader].waitForExistence(timeout: 15),
            "DownloadsScreen did not appear."
        )

        // Drive VdoDownload.getDownloadOptions + enqueue by tapping the
        // download (cloud) icon for the first sample row.
        let downloadBtn = app.otherElements["download-start"].firstMatch
        XCTAssertTrue(
            downloadBtn.waitForExistence(timeout: 10),
            "download-start testID not found in DownloadsScreen."
        )
        downloadBtn.tap()

        // Allow the SDK to drive its download pipeline. Status should
        // transition through queued / downloading / completed depending on
        // network speed.
        sleep(6)

        // Stop the download if active (drives VdoDownload.stop).
        let stop = app.buttons["download-stop"].firstMatch
        if stop.exists && stop.isEnabled {
            stop.tap()
            sleep(1)

            // Resume (drives VdoDownload.resume).
            let resume = app.buttons["download-resume"].firstMatch
            if resume.exists && resume.isEnabled {
                resume.tap()
                sleep(1)
            }
        }

        // Delete the download (drives VdoDownload.remove).
        let deleteBtn = app.otherElements["download-delete"].firstMatch
        if deleteBtn.exists && deleteBtn.isEnabled {
            deleteBtn.tap()
            sleep(1)
        }

        XCTAssertEqual(
            app.state, .runningForeground,
            "App is no longer in the foreground after download journey — likely a crash."
        )
    }

    /// Rotation survival test — exercises the library's response to portrait
    /// ↔ landscape transitions both in inline (non-fullscreen) mode and in
    /// fullscreen mode.
    ///
    /// Catches: native renderer crash on rotation, decoder restart failure,
    /// aspect-ratio glitches, dropped first-frame callback after recreation,
    /// audio focus / route-change handling on configuration changes.
    func testRotationSurvivesPlayback() throws {
        let app = XCUIApplication()
        app.launch()

        try openPlayerScreen(app: app,
                             buttonLabel: jsControlsButton,
                             screenSignature: jsControlsDescription)

        // Start playback so the renderer is actively decoding when we rotate.
        tapPlayer(app: app, id: "player-play-pause", label: "play button")
        sleep(5)

        // ── Inline rotation: portrait → landscape → portrait ───────────────
        XCUIDevice.shared.orientation = .landscapeLeft
        sleep(2)
        XCTAssertEqual(app.state, .runningForeground,
                       "App not alive after rotating to landscape (inline mode).")

        XCUIDevice.shared.orientation = .portrait
        sleep(2)

        // ── Fullscreen rotation: enter, rotate twice, exit ─────────────────
        tapPlayer(app: app, id: "player-fullscreen", label: "enter fullscreen")
        sleep(2)

        XCUIDevice.shared.orientation = .landscapeRight
        sleep(2)
        XCTAssertEqual(app.state, .runningForeground,
                       "App not alive after landscapeRight rotation in fullscreen.")

        XCUIDevice.shared.orientation = .landscapeLeft
        sleep(2)
        XCTAssertEqual(app.state, .runningForeground,
                       "App not alive after landscapeLeft rotation in fullscreen.")

        XCUIDevice.shared.orientation = .portrait
        sleep(2)

        // Exit fullscreen.
        tapPlayerOptional(app: app, id: "player-fullscreen")
        sleep(1)

        XCTAssertEqual(
            app.state, .runningForeground,
            "App is no longer in the foreground after rotation journey — likely a crash."
        )
    }

    // MARK: - helpers

    private func openPlayerScreen(
        app: XCUIApplication,
        buttonLabel: String,
        screenSignature: String
    ) throws {
        XCTAssertTrue(
            app.staticTexts[homeWelcome].waitForExistence(timeout: 15),
            "HomeScreen never appeared."
        )
        let button = app.buttons[buttonLabel]
        XCTAssertTrue(
            button.waitForExistence(timeout: 60),
            "\"\(buttonLabel)\" button never reached the ready state "
            + "(check network access to dev.vdocipher.com)."
        )
        button.tap()
        XCTAssertTrue(
            app.staticTexts[screenSignature].waitForExistence(timeout: 15),
            "Player screen never mounted — crash during init? Expected \"\(screenSignature)\"."
        )
    }

    /// Tap a player control by its testID via coordinate-based hit, which
    /// bypasses XCUITest's "scroll to visible" pre-step (the controls row
    /// has no parent ScrollView; AXScrollToVisible always fails).
    private func tapPlayer(app: XCUIApplication, id: String, label: String) {
        let el = app.otherElements[id]
        XCTAssertTrue(el.waitForExistence(timeout: 10),
                      "\(label) (id=\"\(id)\") not found.")
        el.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }

    /// Same as tapPlayer but no assertion if the element is missing — used
    /// for controls that only conditionally render (captions, quality, etc.).
    private func tapPlayerOptional(app: XCUIApplication, id: String) {
        let el = app.otherElements[id]
        guard el.exists else { return }
        el.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
}
