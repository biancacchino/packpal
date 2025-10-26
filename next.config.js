/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly tell Turbopack which workspace folder is the Next app root
  // This avoids Next inferring the wrong root when there are multiple lockfiles.
  turbopack: {
    root: './',
  },
};

module.exports = nextConfig;
