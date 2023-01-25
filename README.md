
# vdocipher-rn-bridge


## Note:

1. IOS is not supported. Only Android support available. IOS support will be
   added in future.
2. Currently, it is not possible to get any events or callbacks from Android
   player activity. The video will open in a new _native_ activity outside of
   the react native setup. Back button will take the user from the player
   activity to home activity.

React native library for integrating vdocipher android sdk into your react native app.

## Getting started

`$ npm install vdocipher-rn-bridge --save`

For installation you can choose either automatic or manual installation:

**Note**: If your app uses react-native version >= 0.60.0, you can skip the linking
instructions. No explicit linking is required as new rn versions use
[autolinking](https://facebook.github.io/react-native/blog/2019/07/03/version-60) for native modules.

### Automatic installation

`$ react-native link vdocipher-rn-bridge`

### Manual installation


#### iOS

iOS is currently not supported.

#### Android

1. Open up `android/app/src/main/java/[...]/MainActivity.java`
  - Add `import com.vdocipher.rnbridge.VdocipherRnBridgePackage;` to the imports at the top of the file
  - Add `new VdocipherRnBridgePackage()` to the list returned by the `getPackages()` method
2. Append the following lines to `android/settings.gradle`:
  	```
  	include ':vdocipher-rn-bridge'
  	project(':vdocipher-rn-bridge').projectDir = new File(rootProject.projectDir, 	'../node_modules/vdocipher-rn-bridge/android')
  	```
3. Insert the following lines inside the dependencies block in `android/app/build.gradle`:
  	```
      compile project(':vdocipher-rn-bridge')
  	```

### Installation troubleshooting
If you encounter a build error for android project like _'Cannot find com.vdocipher.aegis:vdocipher-android:X.X.X',_
you may need to add the following maven repository to your **android/build.gradle** under **allprojects -> repositories**:

```
maven {
    url "https://github.com/VdoCipher/maven-repo/raw/master/repo"
}
```


### Try the demo app

To run the example react-native app included in this repo, clone this repo to your
development machine, and run the example app:

`$ mkdir vdocipher-react-native && cd vdocipher-react-native`

`$ git clone https://github.com/VdoCipher/sample-react-native-app.git .`

`$ npm install`

`$ npx react-native run-android`

## Usage

For detailed usage of the library, refer the link [here.](https://www.vdocipher.com/docs/mobile/react-native/getting-started)