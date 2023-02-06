package com.example;

import com.facebook.react.ReactActivity;

import android.app.PictureInPictureParams;
import android.os.Bundle;
import android.os.Build;

import androidx.annotation.RequiresApi;
import androidx.fragment.app.Fragment;

import android.content.Intent;
import android.content.Context;

import android.util.Log;


public class PipActivity extends ReactActivity {

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "pip";
    }

    public static Intent getStartIntent(Context context) {
        Intent intent = new Intent(context, PipActivity.class);
        return intent;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(null);
    }
}
