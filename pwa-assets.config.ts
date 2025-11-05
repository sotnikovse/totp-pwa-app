import {
  createAppleSplashScreens,
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    ...minimal2023Preset,
    appleSplashScreens: createAppleSplashScreens(
      {
        padding: 0.3,
        resizeOptions: { background: '#fafafa', fit: 'contain' },
        darkResizeOptions: { background: '#18181b', fit: 'contain' },
        linkMediaOptions: {
          log: true,
          addMediaScreen: true,
          basePath: '/',
          xhtml: true,
        },
        png: {
          compressionLevel: 9,
          quality: 60,
        },
        name: (landscape, size, dark) => {
          return `apple-splash-${landscape ? 'landscape' : 'portrait'}-${
            typeof dark === 'boolean' ? (dark ? 'dark-' : 'light-') : ''
          }${size.width}x${size.height}.png`
        },
      },
      ['iPad Air 9.7"', 'iPhone X'],
    ),
  },
  images: ['public/favicon.svg'],
})
