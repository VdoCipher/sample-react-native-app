/**
 * Jest setup file: overrides react-native component mocks that aren't
 * resolved correctly by the react-native preset in RN 0.79 / React 19.
 */

jest.mock('react-native/Libraries/Text/Text', () => ({
  __esModule: true,
  default: 'Text',
}));

jest.mock('react-native/Libraries/Image/Image', () => ({
  __esModule: true,
  default: 'Image',
}));

jest.mock('react-native/Libraries/Components/View/View', () => ({
  __esModule: true,
  default: 'View',
}));

jest.mock(
  'react-native/Libraries/Components/Touchable/TouchableOpacity',
  () => ({
    __esModule: true,
    default: 'TouchableOpacity',
  }),
);
