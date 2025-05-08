@echo off
REM Tauri API通信测试脚本 (Windows版)
REM 版本: 1.0

setlocal enabledelayedexpansion

REM 设置颜色 (Windows控制台代码)
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 程序名称
set "PROGRAM_NAME=COS72 Tauri测试工具"

REM 打印帮助信息
:print_help
    echo %BLUE%!PROGRAM_NAME!%NC% - 测试Tauri API通信
    echo.
    echo 使用方法: %0 [选项]
    echo.
    echo 选项:
    echo   -h, --help          显示此帮助信息
    echo   -a, --api           测试API通信
    echo   -w, --webauthn      测试WebAuthn/Passkey功能
    echo   -t, --tee           测试TEE操作
    echo   -b, --build         构建并测试
    echo   -d, --dev           在开发模式下测试
    echo   -s, --simple        使用简单HTML页面测试
    echo   --all               运行所有测试
    echo.
    echo 示例:
    echo   %0 --api            仅测试API通信
    echo   %0 --all            运行所有测试
    echo   %0 --simple         使用简单HTML页面测试
    echo.
    exit /b 0

REM 检查是否安装了必要的工具
:check_prerequisites
    echo %BLUE%检查必要工具...%NC%
    
    REM 检查Node.js
    where node >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo %RED%缺少 Node.js%NC%
        set missing=1
    ) else (
        for /f "tokens=*" %%i in ('node -v') do set node_version=%%i
        echo %GREEN%Node.js已安装:%NC% !node_version!
    )
    
    REM 检查pnpm
    where pnpm >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo %RED%缺少 pnpm%NC%
        set missing=1
    ) else (
        for /f "tokens=*" %%i in ('pnpm -v') do set pnpm_version=%%i
        echo %GREEN%pnpm已安装:%NC% !pnpm_version!
    )
    
    REM 检查Rust工具链
    where cargo >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo %RED%缺少 Rust工具链%NC%
        set missing=1
    ) else (
        for /f "tokens=*" %%i in ('rustc --version') do set rust_version=%%i
        echo %GREEN%Rust已安装:%NC% !rust_version!
    )
    
    REM 检查Tauri CLI
    where tauri >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo %YELLOW%警告: 未找到Tauri CLI%NC%
        echo 可以通过 %BLUE%cargo install tauri-cli%NC% 安装
    ) else (
        for /f "tokens=*" %%i in ('tauri --version') do set tauri_version=%%i
        echo %GREEN%Tauri CLI已安装:%NC% !tauri_version!
    )
    
    if "%missing%"=="1" (
        echo %RED%缺少必要工具，请先安装后再继续%NC%
        exit /b 1
    )
    
    echo %GREEN%所有必要工具已安装%NC%
    echo.
    exit /b 0

REM 测试API通信
:test_api_communication
    echo %BLUE%测试API通信...%NC%
    
    REM 运行测试命令
    if "%BUILD_MODE%"=="dev" (
        echo %YELLOW%以开发模式启动应用...%NC%
        REM 使用tauri dev启动应用
        cd "%~dp0"
        start /b pnpm tauri dev
        
        REM 等待应用启动
        echo %YELLOW%等待应用启动...%NC%
        timeout /t 10 /nobreak > nul
        
        REM TODO: 这里添加API测试逻辑
        
        REM 结束测试 - Windows批处理不方便结束进程，需要用户手动关闭
        echo %YELLOW%测试结束后请手动关闭应用窗口%NC%
    ) else if "%SIMPLE_TEST%"=="true" (
        echo %YELLOW%使用简单HTML页面测试...%NC%
        REM 启动简单测试页面
        cd "%~dp0\test-app"
        
        if not exist "index.html" (
            echo %RED%错误: 测试页面不存在%NC%
            exit /b 1
        )
        
        echo %YELLOW%启动Tauri应用...%NC%
        cd ..
        start /b pnpm tauri dev --no-watch test-app
        
        REM 等待应用启动
        echo %YELLOW%等待应用启动...%NC%
        timeout /t 10 /nobreak > nul
        
        REM 等待用户交互
        echo %YELLOW%测试应用已启动，请在应用中手动测试API功能%NC%
        echo %YELLOW%测试完成后按任意键结束...%NC%
        pause > nul
        
        REM 结束测试 - Windows批处理不方便结束进程，需要用户手动关闭
        echo %YELLOW%请手动关闭应用窗口%NC%
    ) else (
        echo %YELLOW%使用生产模式测试...%NC%
        REM 构建应用
        cd "%~dp0"
        call pnpm build && call pnpm tauri build --debug
        
        REM 提示用户手动打开应用测试
        echo %YELLOW%应用已构建，请手动打开应用测试API功能%NC%
        echo %YELLOW%应用路径: .\src-tauri\target\debug\%NC%
    )
    
    echo %GREEN%API通信测试完成%NC%
    echo.
    exit /b 0

REM 测试WebAuthn/Passkey功能
:test_webauthn
    echo %BLUE%测试WebAuthn/Passkey功能...%NC%
    
    if "%SIMPLE_TEST%"=="true" (
        echo %YELLOW%在简单测试页面中无法完整测试WebAuthn功能%NC%
        echo %YELLOW%请使用正式应用测试此功能%NC%
        exit /b 0
    )
    
    REM TODO: 实现WebAuthn测试逻辑
    
    echo %GREEN%WebAuthn测试完成%NC%
    echo.
    exit /b 0

REM 测试TEE操作
:test_tee
    echo %BLUE%测试TEE操作...%NC%
    
    if "%SIMPLE_TEST%"=="true" (
        echo %YELLOW%在简单测试页面中无法完整测试TEE功能%NC%
        echo %YELLOW%请使用正式应用测试此功能%NC%
        exit /b 0
    )
    
    REM TODO: 实现TEE测试逻辑
    
    echo %GREEN%TEE测试完成%NC%
    echo.
    exit /b 0

REM 主函数
:main
    echo %BLUE%============================================%NC%
    echo %BLUE%       %PROGRAM_NAME%       %NC%
    echo %BLUE%============================================%NC%
    echo.
    
    REM 默认值
    set "TEST_API=false"
    set "TEST_WEBAUTHN=false"
    set "TEST_TEE=false"
    set "BUILD_MODE=build"
    set "SIMPLE_TEST=false"
    
    REM 解析命令行参数
    :parse_args
    if "%~1"=="" goto run_tests
    
    if "%~1"=="-h" (
        call :print_help
        exit /b 0
    ) else if "%~1"=="--help" (
        call :print_help
        exit /b 0
    ) else if "%~1"=="-a" (
        set "TEST_API=true"
        shift
        goto parse_args
    ) else if "%~1"=="--api" (
        set "TEST_API=true"
        shift
        goto parse_args
    ) else if "%~1"=="-w" (
        set "TEST_WEBAUTHN=true"
        shift
        goto parse_args
    ) else if "%~1"=="--webauthn" (
        set "TEST_WEBAUTHN=true"
        shift
        goto parse_args
    ) else if "%~1"=="-t" (
        set "TEST_TEE=true"
        shift
        goto parse_args
    ) else if "%~1"=="--tee" (
        set "TEST_TEE=true"
        shift
        goto parse_args
    ) else if "%~1"=="-b" (
        set "BUILD_MODE=build"
        shift
        goto parse_args
    ) else if "%~1"=="--build" (
        set "BUILD_MODE=build"
        shift
        goto parse_args
    ) else if "%~1"=="-d" (
        set "BUILD_MODE=dev"
        shift
        goto parse_args
    ) else if "%~1"=="--dev" (
        set "BUILD_MODE=dev"
        shift
        goto parse_args
    ) else if "%~1"=="-s" (
        set "SIMPLE_TEST=true"
        shift
        goto parse_args
    ) else if "%~1"=="--simple" (
        set "SIMPLE_TEST=true"
        shift
        goto parse_args
    ) else if "%~1"=="--all" (
        set "TEST_API=true"
        set "TEST_WEBAUTHN=true"
        set "TEST_TEE=true"
        shift
        goto parse_args
    ) else (
        echo %RED%未知选项: %1%NC%
        call :print_help
        exit /b 1
    )
    
    :run_tests
    REM 如果没有指定任何测试，默认测试API
    if "%TEST_API%"=="false" (
        if "%TEST_WEBAUTHN%"=="false" (
            if "%TEST_TEE%"=="false" (
                set "TEST_API=true"
            )
        )
    )
    
    REM 检查依赖
    call :check_prerequisites
    
    REM 运行测试
    if "%TEST_API%"=="true" (
        call :test_api_communication
    )
    
    if "%TEST_WEBAUTHN%"=="true" (
        call :test_webauthn
    )
    
    if "%TEST_TEE%"=="true" (
        call :test_tee
    )
    
    echo %GREEN%测试完成%NC%
    exit /b 0

REM 执行主函数
call :main %* 