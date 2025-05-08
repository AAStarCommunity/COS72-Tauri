# Raspberry Pi 5 TEE Setup Guide for COS72

本指南详细介绍了如何在Raspberry Pi 5上设置可靠的可信执行环境(TEE)，用于COS72 Web3钱包应用。

## 硬件要求

- Raspberry Pi 5（推荐8GB RAM版本）
- 64GB+ microSD卡（Class 10或更快）
- 官方USB-C电源（至少27W）
- 可选：带散热的外壳
- 可选：以太网线缆（推荐，比WiFi更可靠）

## 软件设置

### 1. 基础系统安装

```bash
# 下载Ubuntu Server 23.10 LTS for Raspberry Pi
wget https://cdimage.ubuntu.com/releases/23.10/release/ubuntu-23.10-preinstalled-server-arm64+raspi.img.xz

# 刷写到SD卡（替换sdX为您的SD卡设备）
xzcat ubuntu-23.10-preinstalled-server-arm64+raspi.img.xz | sudo dd of=/dev/sdX bs=4M status=progress

# 或者使用Raspberry Pi Imager工具
# https://www.raspberrypi.org/software/
```

启动Raspberry Pi并完成初始设置：
1. 设置用户名和密码
2. 配置网络
3. 更新系统：`sudo apt update && sudo apt full-upgrade -y`

### 2. 安装OP-TEE

OP-TEE提供了基于ARM TrustZone的TEE实现。

```bash
# 安装依赖
sudo apt update
sudo apt install -y git python3-pip wget curl build-essential \
    python3-dev python3-pyelftools libssl-dev python-is-python3 \
    device-tree-compiler bison flex uuid-dev libglib2.0-dev

# 安装repo工具
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
export PATH=~/bin:$PATH

# 克隆OP-TEE仓库
mkdir -p ~/optee
cd ~/optee
repo init -u https://github.com/OP-TEE/manifest.git -m rpi5.xml -b master
repo sync -j4

# 如果找不到rpi5.xml，使用rpi4.xml并做必要修改
```

> 注意：如果OP-TEE官方仓库还没有针对Raspberry Pi 5的manifest文件，可以使用rpi4.xml作为基础进行修改。

#### 修改配置以支持Raspberry Pi 5

```bash
# 编辑设备树文件
cd ~/optee/build
vim rpi5_dt_files/optee.dtsi

# 添加必要的内存区域配置，参考如下
# reserved-memory {
#    optee@0x10000000 {
#        reg = <0x0 0x10000000 0x0 0x2000000>;
#        no-map;
#    };
# };
```

### 3. 构建OP-TEE

```bash
cd ~/optee/build
make toolchains -j4
make -j4

# 构建完成后，编译的镜像位于out/目录
```

### 4. 安装OP-TEE到Raspberry Pi

```bash
# 备份原始启动分区
sudo cp -r /boot/firmware /boot/firmware.bak

# 安装OP-TEE核心组件
sudo cp out/arm-plat-rpi/core/tee-header_v2.bin /boot/firmware/
sudo cp out/arm-plat-rpi/core/tee-pager_v2.bin /boot/firmware/
sudo cp out/arm-plat-rpi/core/tee-pageable_v2.bin /boot/firmware/

# 更新配置文件
sudo nano /boot/firmware/config.txt

# 添加以下内容到config.txt
# dtoverlay=optee
# enable_uart=1
# kernel=Image
# arm_64bit=1
# arm_max_phys=0x20000000
# armstub=bl31.bin
# device_tree=bcm2712-rpi-5-b.dtb
```

### 5. 设置OP-TEE启动参数

```bash
# 添加内核启动参数
sudo nano /boot/firmware/cmdline.txt

# 在末尾添加 "optee=on"，例如
# console=serial0,115200 console=tty1 root=PARTUUID=XXXXXX rootfstype=ext4 elevator=deadline rootwait optee=on
```

### 6. 安装OP-TEE客户端

```bash
cd ~/optee/optee_client
make -j4
sudo make install

# 检查tee-supplicant服务状态
sudo systemctl status tee-supplicant.service

# 如果服务未启动，创建服务文件
sudo nano /etc/systemd/system/tee-supplicant.service

# 服务文件内容
[Unit]
Description=OP-TEE Supplicant
After=network.target

[Service]
ExecStart=/usr/sbin/tee-supplicant
Type=simple
Restart=always

[Install]
WantedBy=multi-user.target

# 启用并启动服务
sudo systemctl enable tee-supplicant.service
sudo systemctl start tee-supplicant.service
```

## 集成COS72 Web3钱包服务

### 1. 构建钱包安全应用

```bash
# 克隆COS72钱包TA代码
git clone https://github.com/cos72/eth-wallet-ta.git
cd eth-wallet-ta

# 准备OP-TEE开发环境
export TA_DEV_KIT_DIR=~/optee/optee_os/out/arm/export-ta_arm64
export CROSS_COMPILE=aarch64-linux-gnu-

# 构建TA
make
```

### 2. 安装钱包安全应用

```bash
# 创建TA目录
sudo mkdir -p /lib/optee_armtz/
sudo cp out/XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX.ta /lib/optee_armtz/
```

### 3. 设置钱包API服务

```bash
# 克隆钱包API服务代码
git clone https://github.com/cos72/eth-wallet-service.git
cd eth-wallet-service

# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装依赖并构建
npm install
npm run build

# 配置服务
cp .env.example .env
nano .env

# 启动服务
npm start

# 设置为系统服务
sudo nano /etc/systemd/system/wallet-service.service

[Unit]
Description=COS72 Wallet Service
After=network.target tee-supplicant.service

[Service]
WorkingDirectory=/home/ubuntu/eth-wallet-service
ExecStart=/usr/bin/node dist/server.js
Restart=always
User=ubuntu
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# 启用并启动服务
sudo systemctl enable wallet-service.service
sudo systemctl start wallet-service.service
```

## 测试与验证

### 1. 验证OP-TEE安装

```bash
# 检查TEE设备
ls -la /dev/tee*

# 应该看到类似输出
# /dev/tee0
# /dev/teepriv0

# 检查tee-supplicant服务
sudo systemctl status tee-supplicant.service

# 使用optee_example_hello_world进行基本测试
cd ~/optee/optee_examples/hello_world
make
./host/optee_example_hello_world
```

### 2. 测试钱包服务

```bash
# 检查钱包服务状态
sudo systemctl status wallet-service.service

# 测试API端点
curl http://localhost:3030/api/tee/status
```

## 安全增强

1. **防火墙配置**：限制只允许COS72客户端访问
   ```bash
   sudo apt install -y ufw
   sudo ufw default deny incoming
   sudo ufw allow ssh
   sudo ufw allow from 192.168.1.0/24 to any port 3030
   sudo ufw enable
   ```

2. **启用HTTPS**：
   ```bash
   cd ~/eth-wallet-service
   mkdir -p certs
   openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
   ```

3. **物理安全**：将Raspberry Pi放置在安全位置，防止未授权的物理访问

## 告警与监控

为了确保服务稳定性，可以设置基本监控：

```bash
# 安装监控工具
sudo apt install -y prometheus-node-exporter

# 创建简单的健康检查脚本
cat > ~/check_wallet_service.sh << 'EOF'
#!/bin/bash
curl -s http://localhost:3030/api/tee/status > /dev/null
if [ $? -ne 0 ]; then
  echo "Wallet service is down, restarting..."
  sudo systemctl restart wallet-service.service
  # 发送通知，例如通过email或webhook
fi
EOF

chmod +x ~/check_wallet_service.sh

# 添加到crontab
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/check_wallet_service.sh") | crontab -
```

## 故障排除

### OP-TEE启动问题

如果启动后无法访问TEE设备：
```bash
# 检查内核日志
dmesg | grep -i tee

# 确认内核支持OP-TEE
cat /proc/cpuinfo | grep Features
```

### 服务连接问题

如果COS72客户端无法连接到服务：
```bash
# 检查服务状态
sudo systemctl status wallet-service.service

# 检查网络连接
sudo netstat -tuln | grep 3030

# 检查防火墙规则
sudo ufw status
```

## 参考资源

- [OP-TEE官方文档](https://optee.readthedocs.io/)
- [ARM TrustZone指南](https://developer.arm.com/documentation/100935/0100/)
- [Raspberry Pi 5官方文档](https://www.raspberrypi.com/documentation/)
- [GlobalPlatform TEE规范](https://globalplatform.org/specs-library/?filter-committee=tee) 