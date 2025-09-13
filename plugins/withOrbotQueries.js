// plugins/withOrbotQueries.js
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withOrbotQueries(config) {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    if (!manifest.manifest) {
      return config;
    }

    // ensure queries entry exists
    manifest.manifest.queries = manifest.manifest.queries || [];

    const packageName = 'org.torproject.android';
    // avoid duplicates
    const already = manifest.manifest.queries.some(
      (q) => q['package'] && q['package'].$['android:name'] === packageName
    );

    if (!already) {
      manifest.manifest.queries.push({
        package: {
          $: {
            'android:name': packageName,
          },
        },
      });
    }

    config.modResults = manifest;
    return config;
  });
};
