// app.json を読み込み、GitHub Pages などサブパス配信のときだけ baseUrl を足す。
// 例) EXPO_BASE_URL=/repo-name npx expo export -p web
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.EXPO_BASE_URL
      ? { baseUrl: process.env.EXPO_BASE_URL }
      : {}),
  },
});
