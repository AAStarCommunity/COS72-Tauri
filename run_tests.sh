#!/bin/bash
# Tauri API通信测试脚本
# 版本: 1.0

# 设置颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 重置颜色

# 程序名称
PROGRAM_NAME="COS72 Tauri测试工具"

# 打印帮助信息
print_help() {
    echo -e "${BLUE}$PROGRAM_NAME${NC} - 测试Tauri API通信"
    echo ""
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -a, --api           测试API通信"
    echo "  -w, --webauthn      测试WebAuthn/Passkey功能"
    echo "  -t, --tee           测试TEE操作"
    echo "  -b, --build         构建并测试"
    echo "  -d, --dev           在开发模式下测试"
    echo "  -s, --simple        使用简单HTML页面测试"
    echo "  --all               运行所有测试"
    echo ""
    echo "示例:"
    echo "  $0 --api            仅测试API通信"
    echo "  $0 --all            运行所有测试"
    echo "  $0 --simple         使用简单HTML页面测试"
    echo ""
}

# 检查是否安装了必要的工具
check_prerequisites() {
    local missing=0
    
    echo -e "${BLUE}检查必要工具...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}缺少 Node.js${NC}"
        missing=1
    else
        node_version=$(node -v)
        echo -e "${GREEN}Node.js已安装:${NC} $node_version"
    fi
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}缺少 pnpm${NC}"
        missing=1
    else
        pnpm_version=$(pnpm -v)
        echo -e "${GREEN}pnpm已安装:${NC} $pnpm_version"
    fi
    
    if ! command -v cargo &> /dev/null; then
        echo -e "${RED}缺少 Rust工具链${NC}"
        missing=1
    else
        rust_version=$(rustc --version)
        echo -e "${GREEN}Rust已安装:${NC} $rust_version"
    fi
    
    if ! command -v tauri &> /dev/null; then
        echo -e "${YELLOW}警告: 未找到Tauri CLI${NC}"
        echo -e "可以通过 ${BLUE}cargo install tauri-cli${NC} 安装"
    else
        tauri_version=$(tauri --version)
        echo -e "${GREEN}Tauri CLI已安装:${NC} $tauri_version"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "${RED}缺少必要工具，请先安装后再继续${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}所有必要工具已安装${NC}"
    echo ""
}

# 测试API通信
test_api_communication() {
    echo -e "${BLUE}测试API通信...${NC}"
    
    # 运行测试命令
    if [ "$BUILD_MODE" = "dev" ]; then
        echo -e "${YELLOW}以开发模式启动应用...${NC}"
        # 使用tauri dev启动应用
        cd "$(dirname "$0")"
        pnpm tauri dev &
        TAURI_PID=$!
        
        # 等待应用启动
        echo -e "${YELLOW}等待应用启动...${NC}"
        sleep 10
        
        # TODO: 这里添加API测试逻辑
        
        # 结束测试
        kill $TAURI_PID
    elif [ "$SIMPLE_TEST" = "true" ]; then
        echo -e "${YELLOW}使用简单HTML页面测试...${NC}"
        # 启动简单测试页面
        cd "$(dirname "$0")/test-app"
        
        if [ ! -f "index.html" ]; then
            echo -e "${RED}错误: 测试页面不存在${NC}"
            exit 1
        fi
        
        echo -e "${YELLOW}启动Tauri应用...${NC}"
        cd ..
        pnpm tauri dev --no-watch test-app &
        TAURI_PID=$!
        
        # 等待应用启动
        echo -e "${YELLOW}等待应用启动...${NC}"
        sleep 10
        
        # 等待用户交互
        echo -e "${YELLOW}测试应用已启动，请在应用中手动测试API功能${NC}"
        echo -e "${YELLOW}测试完成后按Enter键结束...${NC}"
        read
        
        # 结束测试
        kill $TAURI_PID
    else
        echo -e "${YELLOW}使用生产模式测试...${NC}"
        # 构建应用
        cd "$(dirname "$0")"
        pnpm build && pnpm tauri build --debug
        
        # 提示用户手动打开应用测试
        echo -e "${YELLOW}应用已构建，请手动打开应用测试API功能${NC}"
        echo -e "${YELLOW}应用路径: ./src-tauri/target/debug/${NC}"
    fi
    
    echo -e "${GREEN}API通信测试完成${NC}"
    echo ""
}

# 测试WebAuthn/Passkey功能
test_webauthn() {
    echo -e "${BLUE}测试WebAuthn/Passkey功能...${NC}"
    
    if [ "$SIMPLE_TEST" = "true" ]; then
        echo -e "${YELLOW}在简单测试页面中无法完整测试WebAuthn功能${NC}"
        echo -e "${YELLOW}请使用正式应用测试此功能${NC}"
        return
    fi
    
    # TODO: 实现WebAuthn测试逻辑
    
    echo -e "${GREEN}WebAuthn测试完成${NC}"
    echo ""
}

# 测试TEE操作
test_tee() {
    echo -e "${BLUE}测试TEE操作...${NC}"
    
    if [ "$SIMPLE_TEST" = "true" ]; then
        echo -e "${YELLOW}在简单测试页面中无法完整测试TEE功能${NC}"
        echo -e "${YELLOW}请使用正式应用测试此功能${NC}"
        return
    fi
    
    # TODO: 实现TEE测试逻辑
    
    echo -e "${GREEN}TEE测试完成${NC}"
    echo ""
}

# 主函数
main() {
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}       $PROGRAM_NAME       ${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
    
    # 默认值
    TEST_API=false
    TEST_WEBAUTHN=false
    TEST_TEE=false
    BUILD_MODE="build"
    SIMPLE_TEST=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                print_help
                exit 0
                ;;
            -a|--api)
                TEST_API=true
                shift
                ;;
            -w|--webauthn)
                TEST_WEBAUTHN=true
                shift
                ;;
            -t|--tee)
                TEST_TEE=true
                shift
                ;;
            -b|--build)
                BUILD_MODE="build"
                shift
                ;;
            -d|--dev)
                BUILD_MODE="dev"
                shift
                ;;
            -s|--simple)
                SIMPLE_TEST=true
                shift
                ;;
            --all)
                TEST_API=true
                TEST_WEBAUTHN=true
                TEST_TEE=true
                shift
                ;;
            *)
                echo -e "${RED}未知选项: $1${NC}"
                print_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定任何测试，默认测试API
    if [[ "$TEST_API" = "false" && "$TEST_WEBAUTHN" = "false" && "$TEST_TEE" = "false" ]]; then
        TEST_API=true
    fi
    
    # 检查依赖
    check_prerequisites
    
    # 运行测试
    if [ "$TEST_API" = "true" ]; then
        test_api_communication
    fi
    
    if [ "$TEST_WEBAUTHN" = "true" ]; then
        test_webauthn
    fi
    
    if [ "$TEST_TEE" = "true" ]; then
        test_tee
    fi
    
    echo -e "${GREEN}测试完成${NC}"
}

# 执行主函数
main "$@" 