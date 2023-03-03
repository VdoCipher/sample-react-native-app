package com.example;

import com.facebook.react.ReactActivity;

import android.app.PictureInPictureParams;
import android.os.Bundle;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;


public class MainActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "example";
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
    }

    @RequiresApi(api = Build.VERSION_CODES.O)
    @Override
    protected void onUserLeaveHint() {
        super.onUserLeaveHint();
//        switch to PiP mode if the user presses the home or recent button,
//        Adding fragment check to ensure only the screen with player fragment can go into pip, remove this check
//        if other screens can/should also go into pip mode
            Fragment vdoPlayerFragment = getSupportFragmentManager().findFragmentByTag("VdoPlayerUIFragmentRN");
            if (vdoPlayerFragment != null && vdoPlayerFragment.isVisible()) {
                enterPictureInPictureMode(new PictureInPictureParams.Builder().build());
            }
    }
}
