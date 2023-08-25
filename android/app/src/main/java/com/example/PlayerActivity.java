package com.example;

import com.facebook.react.ReactActivity;

import android.app.PictureInPictureParams;
import android.os.Bundle;
import android.os.Build;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactActivityDelegate;

import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;

import android.content.Intent;
import android.content.Context;

import android.util.Log;


public class PlayerActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "player";
    }

    public static Intent getStartIntent(Context context) {
        Intent intent = new Intent(context, PlayerActivity.class);
        return intent;
    }

    /**
   * Returns the instance of the {@link ReactActivityDelegate}. Here we use a util class {@link
   * DefaultReactActivityDelegate} which allows you to easily enable Fabric and Concurrent React
   * (aka React 18) with two boolean flags.
   */
  @Override
  protected ReactActivityDelegate createReactActivityDelegate() {
    return new DefaultReactActivityDelegate(
        this,
        getMainComponentName(),
        // If you opted-in for the New Architecture, we enable the Fabric Renderer.
        DefaultNewArchitectureEntryPoint.getFabricEnabled());
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
        enterPictureInPictureMode(new PictureInPictureParams.Builder().build());
    }
}
