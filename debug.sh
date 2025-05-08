#!/bin/bash

# 安装依赖
pnpm install

# 设置环境变量启用详细日志
export RUST_LOG=tauri=trace,cos72_tauri=trace,info

# 启动应用并将日志输出到文件
echo "正在启动应用，日志将保存到 logs/app.log"
pnpm tauri:dev | tee logs/app.log 