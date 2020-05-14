// Webpack allows module-esqe imports of images. However, in order for TypeScript to support this,
// TypeScript must know that image files may be imported as modules.
// See https://stackoverflow.com/a/52760666/1222411
declare module '*.jpg';
declare module '*.png';