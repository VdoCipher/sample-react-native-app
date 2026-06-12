module.exports = {
  presets: ['module:@react-native/babel-preset'],
  // Reanimated 4 sources its worklets plugin from react-native-worklets.
  // Must be listed last.
  plugins: ['react-native-worklets/plugin'],
};
