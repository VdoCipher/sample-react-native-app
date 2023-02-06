package com.example;

import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactMethod;
import android.util.Log;
import com.facebook.react.uimanager.annotations.ReactProp;
import android.content.Intent;
import android.app.Activity;

public class PipActivityModule extends ReactContextBaseJavaModule {
    private static final String TAG = "PipActivityModule";

    @Override
    public String getName() {
        return "PipActivityM";
    }

    public PipActivityModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @ReactMethod
    public void openPipActivity() {
        Activity currentActivity = getCurrentActivity();
        Intent intent = PipActivity.getStartIntent(currentActivity);
        currentActivity.startActivity(intent);
    }
}