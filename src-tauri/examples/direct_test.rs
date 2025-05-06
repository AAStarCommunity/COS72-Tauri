// 直接使用项目的mod导入
mod hardware {
    include!("../src/hardware/mod.rs");
}

use hardware::detect;

fn main() {
    println!("直接调用硬件检测函数测试");
    
    match detect::get_hardware_info() {
        Ok(info) => {
            println!("检测成功:");
            println!("CPU: {}", info.cpu.model_name);
            println!("架构: {}", info.cpu.architecture);
            println!("核心数: {}", info.cpu.cores);
            println!("是ARM架构: {}", info.cpu.is_arm);
            println!("内存: {} MB", info.memory);
            println!("TEE类型: {}", info.tee.tee_type);
        },
        Err(e) => {
            println!("检测失败: {}", e);
        }
    }
} 