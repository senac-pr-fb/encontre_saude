const React = require('react');
const { Text } = require('react-native');

function IconMock({ name, ...rest }) {
  return React.createElement(Text, rest, name ?? 'icon');
}

module.exports = IconMock;
module.exports.default = IconMock;
