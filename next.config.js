/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'out',
  // 禁用图片优化，因为静态导出不支持
  images: {
    unoptimized: true,
  },
  // 确保在生产环境不使用HTML扩展名
  trailingSlash: true,
  // 排除测试文件
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].filter(ext => !ext.includes('test')),
  // 防止测试文件被构建
  webpack: (config, { dev, isServer }) => {
    // 只在生产环境中排除测试文件
    if (!dev) {
      config.module.rules.push({
        test: /\.test\.(tsx|ts|jsx|js)$/,
        loader: 'ignore-loader',
      });
    }
    return config;
  },
}

module.exports = nextConfig 