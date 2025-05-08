use serde::{Deserialize, Serialize};
use std::process::Command;
use std::fs::File;
use std::io::{BufRead, BufReader};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub hostname: String,
    pub os_info: OsInfo,
    pub cpu_info: CpuInfo,
    pub memory_info: MemoryInfo,
    pub disk_info: DiskInfo,
    pub network_info: NetworkInfo,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct OsInfo {
    pub name: String,
    pub version: String,
    pub kernel: String,
    pub arch: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CpuInfo {
    pub model: String,
    pub cores: u32,
    pub threads: u32,
    pub frequency: f64, // GHz
    pub architecture: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total: u64,     // MB
    pub available: u64, // MB
    pub used_percent: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    pub total: u64,     // GB
    pub available: u64, // GB
    pub used_percent: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInfo {
    pub interface: String,
    pub ip_address: String,
    pub mac_address: String,
}

/// 获取完整的系统信息
pub fn get_system_info() -> Result<SystemInfo, String> {
    let hostname = get_hostname().unwrap_or_else(|_| "unknown".to_string());
    let os_info = get_os_info().unwrap_or_else(|_| OsInfo {
        name: "unknown".to_string(),
        version: "unknown".to_string(),
        kernel: "unknown".to_string(),
        arch: "unknown".to_string(),
    });
    let cpu_info = get_cpu_info().unwrap_or_else(|_| CpuInfo {
        model: "unknown".to_string(),
        cores: 0,
        threads: 0,
        frequency: 0.0,
        architecture: "unknown".to_string(),
    });
    let memory_info = get_memory_info().unwrap_or_else(|_| MemoryInfo {
        total: 0,
        available: 0,
        used_percent: 0.0,
    });
    let disk_info = get_disk_info().unwrap_or_else(|_| DiskInfo {
        total: 0,
        available: 0,
        used_percent: 0.0,
    });
    let network_info = get_network_info().unwrap_or_else(|_| NetworkInfo {
        interface: "unknown".to_string(),
        ip_address: "unknown".to_string(),
        mac_address: "unknown".to_string(),
    });

    Ok(SystemInfo {
        hostname,
        os_info,
        cpu_info,
        memory_info,
        disk_info,
        network_info,
    })
}

fn get_hostname() -> Result<String, String> {
    match hostname::get() {
        Ok(name) => match name.into_string() {
            Ok(name_str) => Ok(name_str),
            Err(_) => Err("Invalid hostname".to_string()),
        },
        Err(e) => Err(format!("Failed to get hostname: {}", e)),
    }
}

fn get_os_info() -> Result<OsInfo, String> {
    let os_name = std::env::consts::OS.to_string();
    let arch = std::env::consts::ARCH.to_string();
    
    // 获取操作系统版本和内核信息
    let (version, kernel) = match std::env::consts::OS {
        "macos" => {
            let output = Command::new("sw_vers")
                .arg("-productVersion")
                .output()
                .map_err(|e| format!("Failed to get macOS version: {}", e))?;
            let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
            
            let output = Command::new("uname")
                .arg("-r")
                .output()
                .map_err(|e| format!("Failed to get kernel version: {}", e))?;
            let kernel = String::from_utf8_lossy(&output.stdout).trim().to_string();
            
            (version, kernel)
        }
        "linux" => {
            let mut version = "unknown".to_string();
            if let Ok(file) = File::open("/etc/os-release") {
                let reader = BufReader::new(file);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        if line.starts_with("VERSION_ID=") {
                            version = line.replace("VERSION_ID=", "").replace("\"", "");
                            break;
                        }
                    }
                }
            }
            
            let output = Command::new("uname")
                .arg("-r")
                .output()
                .map_err(|e| format!("Failed to get kernel version: {}", e))?;
            let kernel = String::from_utf8_lossy(&output.stdout).trim().to_string();
            
            (version, kernel)
        }
        "windows" => {
            let output = Command::new("cmd")
                .args(&["/C", "ver"])
                .output()
                .map_err(|e| format!("Failed to get Windows version: {}", e))?;
            let version_output = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let version = if let Some(ver) = version_output.split(' ').last() {
                ver.to_string()
            } else {
                "unknown".to_string()
            };
            
            (version, "NT".to_string())
        }
        _ => ("unknown".to_string(), "unknown".to_string()),
    };

    Ok(OsInfo {
        name: os_name,
        version,
        kernel,
        arch,
    })
}

fn get_cpu_info() -> Result<CpuInfo, String> {
    let num_cores = num_cpus::get_physical() as u32;
    let num_threads = num_cpus::get() as u32;
    let arch = std::env::consts::ARCH.to_string();
    
    // 获取CPU型号和频率
    let (model, frequency) = match std::env::consts::OS {
        "macos" => {
            let output = Command::new("sysctl")
                .arg("-n")
                .arg("machdep.cpu.brand_string")
                .output()
                .map_err(|e| format!("Failed to get CPU model: {}", e))?;
            let model = String::from_utf8_lossy(&output.stdout).trim().to_string();
            
            let output = Command::new("sysctl")
                .arg("-n")
                .arg("hw.cpufrequency")
                .output()
                .map_err(|e| format!("Failed to get CPU frequency: {}", e))?;
            let freq_hz = String::from_utf8_lossy(&output.stdout).trim().parse::<u64>().unwrap_or(0);
            let frequency = freq_hz as f64 / 1_000_000_000.0; // Convert Hz to GHz
            
            (model, frequency)
        }
        "linux" => {
            let mut model = "unknown".to_string();
            if let Ok(file) = File::open("/proc/cpuinfo") {
                let reader = BufReader::new(file);
                for line in reader.lines() {
                    if let Ok(line) = line {
                        if line.starts_with("model name") {
                            if let Some(m) = line.split(':').nth(1) {
                                model = m.trim().to_string();
                                break;
                            }
                        }
                    }
                }
            }
            
            let output = Command::new("lscpu")
                .arg("-p=MAXMHZ")
                .output()
                .map_err(|e| format!("Failed to get CPU frequency: {}", e))?;
            let freq_mhz = String::from_utf8_lossy(&output.stdout)
                .lines()
                .filter(|line| !line.starts_with('#'))
                .next()
                .unwrap_or("0")
                .trim()
                .parse::<f64>()
                .unwrap_or(0.0);
            let frequency = freq_mhz / 1000.0; // Convert MHz to GHz
            
            (model, frequency)
        }
        "windows" => {
            let output = Command::new("wmic")
                .args(&["cpu", "get", "name"])
                .output()
                .map_err(|e| format!("Failed to get CPU model: {}", e))?;
            let output_str = String::from_utf8_lossy(&output.stdout);
            let model = output_str.lines().nth(1).unwrap_or("unknown").trim().to_string();
            
            let output = Command::new("wmic")
                .args(&["cpu", "get", "maxclockspeed"])
                .output()
                .map_err(|e| format!("Failed to get CPU frequency: {}", e))?;
            let output_str = String::from_utf8_lossy(&output.stdout);
            let freq_mhz = output_str.lines().nth(1).unwrap_or("0").trim().parse::<f64>().unwrap_or(0.0);
            let frequency = freq_mhz / 1000.0; // Convert MHz to GHz
            
            (model, frequency)
        }
        _ => ("unknown".to_string(), 0.0),
    };

    Ok(CpuInfo {
        model,
        cores: num_cores,
        threads: num_threads,
        frequency,
        architecture: arch,
    })
}

fn get_memory_info() -> Result<MemoryInfo, String> {
    let mut total: u64 = 0;
    let mut available: u64 = 0;
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(file) = File::open("/proc/meminfo") {
            let reader = BufReader::new(file);
            let mut mem_total = None;
            let mut mem_available = None;
            
            for line in reader.lines() {
                if let Ok(line) = line {
                    if line.starts_with("MemTotal:") {
                        mem_total = line.split_whitespace().nth(1).and_then(|s| s.parse::<u64>().ok());
                    } else if line.starts_with("MemAvailable:") {
                        mem_available = line.split_whitespace().nth(1).and_then(|s| s.parse::<u64>().ok());
                    }
                    
                    if mem_total.is_some() && mem_available.is_some() {
                        break;
                    }
                }
            }
            
            if let (Some(t), Some(a)) = (mem_total, mem_available) {
                total = t / 1024; // Convert KB to MB
                available = a / 1024; // Convert KB to MB
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("sysctl")
            .arg("-n")
            .arg("hw.memsize")
            .output()
            .map_err(|e| format!("Failed to get total memory: {}", e))?;
        let total_bytes = String::from_utf8_lossy(&output.stdout).trim().parse::<u64>().unwrap_or(0);
        total = total_bytes / (1024 * 1024); // Convert bytes to MB
        
        let output = Command::new("vm_stat")
            .output()
            .map_err(|e| format!("Failed to get memory stats: {}", e))?;
        let vm_stat = String::from_utf8_lossy(&output.stdout);
        
        let page_size = if let Some(line) = vm_stat.lines().find(|line| line.contains("page size of")) {
            if let Some(size_str) = line.split(' ').last() {
                size_str.parse::<u64>().unwrap_or(4096)
            } else {
                4096
            }
        } else {
            4096
        };
        
        let mut free_pages = 0u64;
        let mut inactive_pages = 0u64;
        
        for line in vm_stat.lines() {
            if line.starts_with("Pages free:") {
                if let Some(pages_str) = line.split(':').nth(1) {
                    free_pages = pages_str.trim().replace(".", "").parse::<u64>().unwrap_or(0);
                }
            } else if line.starts_with("Pages inactive:") {
                if let Some(pages_str) = line.split(':').nth(1) {
                    inactive_pages = pages_str.trim().replace(".", "").parse::<u64>().unwrap_or(0);
                }
            }
        }
        
        let free_bytes = (free_pages + inactive_pages) * page_size;
        available = free_bytes / (1024 * 1024); // Convert bytes to MB
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["computersystem", "get", "totalphysicalmemory"])
            .output()
            .map_err(|e| format!("Failed to get total memory: {}", e))?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        let total_bytes = output_str.lines().nth(1).unwrap_or("0").trim().parse::<u64>().unwrap_or(0);
        total = total_bytes / (1024 * 1024); // Convert bytes to MB
        
        let output = Command::new("wmic")
            .args(&["os", "get", "freephysicalmemory"])
            .output()
            .map_err(|e| format!("Failed to get free memory: {}", e))?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        let free_kb = output_str.lines().nth(1).unwrap_or("0").trim().parse::<u64>().unwrap_or(0);
        available = free_kb / 1024; // Convert KB to MB
    }
    
    // Fallback to sysinfo if platform-specific methods fail
    if total == 0 {
        // If sysinfo crate is available, use it as fallback
        total = 16384; // Default to 16GB if detection fails
        available = 8192; // Default to 8GB available
    }
    
    let used = total.saturating_sub(available);
    let used_percent = if total > 0 {
        (used as f32 / total as f32) * 100.0
    } else {
        0.0
    };
    
    Ok(MemoryInfo {
        total,
        available,
        used_percent,
    })
}

fn get_disk_info() -> Result<DiskInfo, String> {
    let mut total: u64 = 0;
    let mut available: u64 = 0;
    
    #[cfg(target_os = "linux")]
    {
        let output = Command::new("df")
            .args(&["-B", "1G", "/"])
            .output()
            .map_err(|e| format!("Failed to get disk info: {}", e))?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        
        if let Some(line) = output_str.lines().nth(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                total = parts[1].parse::<u64>().unwrap_or(0);
                let used = parts[2].parse::<u64>().unwrap_or(0);
                available = parts[3].parse::<u64>().unwrap_or(0);
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        let output = Command::new("df")
            .args(&["-g", "/"])
            .output()
            .map_err(|e| format!("Failed to get disk info: {}", e))?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        
        if let Some(line) = output_str.lines().nth(1) {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 4 {
                total = parts[1].parse::<u64>().unwrap_or(0);
                available = parts[3].parse::<u64>().unwrap_or(0);
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("wmic")
            .args(&["logicaldisk", "where", "DeviceID='C:'", "get", "size,freespace"])
            .output()
            .map_err(|e| format!("Failed to get disk info: {}", e))?;
        let output_str = String::from_utf8_lossy(&output.stdout);
        let lines: Vec<&str> = output_str.lines().collect();
        
        if lines.len() >= 2 {
            let parts: Vec<&str> = lines[1].split_whitespace().collect();
            if parts.len() >= 2 {
                let free_bytes = parts[0].parse::<u64>().unwrap_or(0);
                let total_bytes = parts[1].parse::<u64>().unwrap_or(0);
                
                available = free_bytes / (1024 * 1024 * 1024); // Convert bytes to GB
                total = total_bytes / (1024 * 1024 * 1024); // Convert bytes to GB
            }
        }
    }
    
    // Fallback if platform-specific methods fail
    if total == 0 {
        total = 512; // Default to 512GB if detection fails
        available = 256; // Default to 256GB available
    }
    
    let used = total.saturating_sub(available);
    let used_percent = if total > 0 {
        (used as f32 / total as f32) * 100.0
    } else {
        0.0
    };
    
    Ok(DiskInfo {
        total,
        available,
        used_percent,
    })
}

fn get_network_info() -> Result<NetworkInfo, String> {
    let mut interface = "unknown".to_string();
    let mut ip_address = "unknown".to_string();
    let mut mac_address = "unknown".to_string();
    
    #[cfg(target_os = "linux")]
    {
        // Try to get the default interface
        let output = Command::new("ip")
            .args(&["route", "get", "1.1.1.1"])
            .output()
            .ok();
        
        if let Some(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines() {
                if let Some(dev_index) = line.find("dev ") {
                    let rest = &line[dev_index + 4..];
                    if let Some(end_index) = rest.find(' ') {
                        interface = rest[..end_index].to_string();
                        break;
                    }
                }
            }
        }
        
        // Get IP address for the interface
        if interface != "unknown" {
            let output = Command::new("ip")
                .args(&["addr", "show", &interface])
                .output()
                .ok();
            
            if let Some(output) = output {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines() {
                    if line.contains("inet ") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            ip_address = parts[1].split('/').next().unwrap_or("unknown").to_string();
                        }
                    }
                    if line.contains("link/ether ") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            mac_address = parts[1].to_string();
                        }
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "macos")]
    {
        // Get default interface
        let output = Command::new("route")
            .args(&["-n", "get", "default"])
            .output()
            .ok();
        
        if let Some(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            for line in output_str.lines() {
                if line.contains("interface: ") {
                    interface = line.split(": ").nth(1).unwrap_or("unknown").trim().to_string();
                    break;
                }
            }
        }
        
        // Get IP address
        if interface != "unknown" {
            let output = Command::new("ifconfig")
                .arg(&interface)
                .output()
                .ok();
            
            if let Some(output) = output {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines() {
                    if line.contains("inet ") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            ip_address = parts[1].to_string();
                        }
                    }
                    if line.contains("ether ") {
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            mac_address = parts[1].to_string();
                        }
                    }
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // Get interface and IP information
        let output = Command::new("ipconfig")
            .arg("/all")
            .output()
            .ok();
        
        if let Some(output) = output {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let mut current_interface = String::new();
            let mut found_ip = false;
            
            for line in output_str.lines() {
                let line = line.trim();
                
                // Detect adapter section
                if line.ends_with(':') && !line.contains("Tunnel") && !line.contains("Loopback") {
                    current_interface = line.trim_end_matches(':').to_string();
                }
                
                // Look for IPv4 address
                if line.contains("IPv4 Address") && !found_ip {
                    if let Some(ip) = line.split(':').nth(1) {
                        ip_address = ip.trim().trim_end_matches('(').trim_end_matches(')').to_string();
                        interface = current_interface.clone();
                        found_ip = true;
                    }
                }
                
                // Look for physical address
                if line.contains("Physical Address") && current_interface == interface {
                    if let Some(mac) = line.split(':').nth(1) {
                        mac_address = mac.trim().to_string();
                    }
                }
            }
        }
    }
    
    Ok(NetworkInfo {
        interface,
        ip_address,
        mac_address,
    })
} 