package com.example;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import com.facebook.react.uimanager.annotations.ReactProp;
import android.content.Intent;
import android.app.Activity;

public class PlayerActivityModule extends ReactContextBaseJavaModule {
    private static final String TAG = "PlayerActivityModule";

    @Override
    public String getName() {
        return "PlayerActivityM";
    }

    public PlayerActivityModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void openPlayerActivity() {
        Activity currentActivity = getCurrentActivity();
        Intent intent = PlayerActivity.getStartIntent(currentActivity);
        currentActivity.startActivity(intent);
    }
}