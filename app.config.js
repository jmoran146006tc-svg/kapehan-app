const { expo } = require('./app.json');
const iosMapsKey = process.env.EXPO_IOS_GOOGLE_MAPS_API_KEY;

// Native map keys are embedded at build time. Use an iOS-restricted key for iOS
// builds and the Android key associated with the release signing certificate.
module.exports = {
  ...expo,
  ios: {
    ...expo.ios,
    ...(iosMapsKey ? { config: { ...expo.ios.config, googleMapsApiKey: iosMapsKey } } : {}),
  },
  plugins: [
    ...expo.plugins,
    ['react-native-maps', {
      androidGoogleMapsApiKey: process.env.EXPO_ANDROID_GOOGLE_MAPS_API_KEY || expo.android.config.googleMaps.apiKey,
      ...(iosMapsKey
        ? { iosGoogleMapsApiKey: iosMapsKey }
        : {}),
    }],
  ],
};
