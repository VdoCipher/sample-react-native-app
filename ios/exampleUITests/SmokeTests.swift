// MARK: - Pre-release smoke tests (XCUITest)
//
// One-time setup in Xcode (this file lives outside the .xcodeproj — you need
// to wire it up to a UI Test target before it will compile/run):
//
//   1. Open `ios/example.xcworkspace` in Xcode.
//   2. File → New → Target… → choose "UI Testing Bundle".
//        - Product Name: `exampleUITests`
//        - Target to be Tested: `example`
//        - Language: Swift
//   3. Xcode generates a default `exampleUITests/exampleUITests.swift` next to
//      this file. Delete that generated file (or move its target membership
//      onto THIS file) so this `SmokeTests.swift` is the one that compiles.
//   4. Confirm `exampleUITests/Info.plist` exists. Xcode adds one automatically.
//
// Running:
//
//   # All UI tests (against the configured scheme — switch to Release in the
//   # scheme editor for release-build verification):
//   xcodebuild test \
//     -workspace example.xcworkspace \
//     -scheme example \
//     -destination 'platform=iOS Simulator,name=iPhone 15' \
//     -only-testing:exampleUITests/SmokeTests
//
//   # Or in Xcode: Cmd-U with the exampleUITests scheme selected.
//
// XCUITest auto-discovers UI elements via accessibility. RN renders text into
// native UILabels that expose their text as the accessibility label, so
// `app.staticTexts["…"]` and `app.buttons["…"]` match RN-rendered content
// without any extra testID wiring (though adding accessibilityLabel /
// accessibilityIdentifier to key views would make these matchers more stable).

import XCTest

final class SmokeTests: XCTestCase {

    private let homeWelcome = "Welcome to VdoCipher react-native integration!"
    private let nativeControlsButton = "Start video with embedded native controls"
    private let nativeControlsDescription =
        "The ui controls for the player are embedded inside the native view"
    private let jsControlsButton = "Start video with JS controls"
    private let jsControlsDescription =
        "The ui controls for the player are react-native components"

    override func setUpWithError() throws {
        // Stop the entire test run on the first failure — a launch crash makes
        // every subsequent assertion meaningless.
        continueAfterFailure = false

        // Force portrait BEFORE app launch — Home/navigation must never be
        // in landscape. Orientation testing belongs to the player screen only.
        XCUIDevice.shared.orientation = .portrait
    }

    /// Verifies the JS bundle loaded and HomeScreen rendered. A failure here
    /// usually means a crash in startup — JS bundle parse error, native module
    /// registration failure, missing entitlement, etc.
    func testAppLaunchesAndRendersHome() throws {
        let app = XCUIApplication()
        app.launch()

        let welcome = app.staticTexts[homeWelcome]
        XCTAssertTrue(
            welcome.waitForExistence(timeout: 15),
            "HomeScreen welcome text never appeared — likely a launch crash."
        )
    }

    /// Flow A: Home → NativeControlsScreen → back.
    ///
    /// Exercises the player with `showNativeControls=true` (the iOS SDK's
    /// embedded UIKit controls). Crashes specific to the embedded native
    /// control overlay surface here.
    func testCanNavigateToNativeControlsAndBack() throws {
        try assertCanReachAndReturn(
            buttonLabel: nativeControlsButton,
            screenSignature: nativeControlsDescription
        )
    }

    /// Flow B: Home → JSControlsScreen → back.
    ///
    /// Exercises the player with `showNativeControls=false`, where the
    /// controls are RN components. On Android this is where the
    /// R8/Parcelable NPE manifests; on iOS the equivalent failure modes are
    /// Swift runtime crashes during player init, signing/entitlement issues,
    /// or Hermes bytecode parse errors.
    func testCanNavigateToJsControlsAndBack() throws {
        try assertCanReachAndReturn(
            buttonLabel: jsControlsButton,
            screenSignature: jsControlsDescription
        )
    }

    // MARK: - helpers

    private func assertCanReachAndReturn(
        buttonLabel: String,
        screenSignature: String
    ) throws {
        let app = XCUIApplication()
        app.launch()

        // Wait for HomeScreen.
        let welcome = app.staticTexts[homeWelcome]
        XCTAssertTrue(welcome.waitForExistence(timeout: 15),
                      "HomeScreen never appeared.")

        // Button title flips to "Loading…" until VdoCipher initializes; wait
        // for the ready label.
        let button = app.buttons[buttonLabel]
        XCTAssertTrue(
            button.waitForExistence(timeout: 60),
            "\"\(buttonLabel)\" button never reached the ready state "
            + "(check network access to dev.vdocipher.com)."
        )

        button.tap()

        // Player screen mounts after navigation. Its description text only
        // renders once the player view is in the tree — so this is a good
        // proxy for "did initialization survive the first frame?".
        let description = app.staticTexts[screenSignature]
        XCTAssertTrue(
            description.waitForExistence(timeout: 15),
            "Player screen never mounted — crash during init? Expected \"\(screenSignature)\"."
        )

        // We don't try to navigate back to Home — the native player view
        // intercepts touches at the left edge so the iOS swipe-back gesture
        // is unreliable. A crash during navigation would put the app at
        // .notRunning; surviving to .runningForeground means the library
        // didn't blow up on init.
        XCTAssertEqual(
            app.state, .runningForeground,
            "App is no longer in the foreground after navigation — likely a crash."
        )
    }
}
