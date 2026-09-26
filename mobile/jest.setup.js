jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Não usamos o mock .tsx da própria lib: o preset do jest-expo não transforma
// arquivos dentro de node_modules/react-native-safe-area-context, então um
// require direto do arquivo .tsx quebraria por causa do JSX não transpilado.
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  const frame = { x: 0, y: 0, width: 320, height: 640 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children, style, ...rest }) => React.createElement(View, { style, ...rest }, children),
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => frame,
    initialWindowMetrics: { insets, frame },
  };
});
