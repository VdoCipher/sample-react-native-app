module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-.*|radio-buttons-react-native|deprecated-react-native-prop-types|vdocipher-rn-bridge)/)',
  ],
  moduleNameMapper: {
    '\\.(png|jpg|jpeg|gif|svg|webp|ttf|otf)$': '<rootDir>/__mocks__/fileMock.js',
  },
};
