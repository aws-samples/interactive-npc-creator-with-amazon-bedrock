/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
    transpilePackages: [
        '@cloudscape-design/components',
        '@cloudscape-design/component-toolkit',
        '@aws-amplify/ui-react-storage'
      ]

};

export default nextConfig;
