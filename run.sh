#!/bin/bash
# COS72-Tauri 测试运行脚本
# 此脚本帮助构建和运行应用并捕获详细日志

# 设置日志目录
mkdir -p logs

# 当前时间戳
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="logs/app-$TIMESTAMP.log"

echo "===== COS72-Tauri 启动脚本 ====="
echo "日志文件: $LOG_FILE"
echo "开始时间: $(date)"
echo ""

# 安装依赖
echo "正在检查前端依赖..."
pnpm install

# 强调正在使用的分支
echo "使用Tauri插件 v2 分支"

# 运行开发版本并捕获日志
echo "启动应用程序..."
pnpm run tauri dev 2>&1 | tee "$LOG_FILE"

# 如果需要特定运行参数，可以取消下面的注释并修改参数
# pnpm run tauri dev -- --no-watch --verbose 2>&1 | tee "$LOG_FILE"

echo ""
echo "应用已退出，日志已保存至: $LOG_FILE"
echo "结束时间: $(date)"