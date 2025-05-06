import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from '../src/pages/index';

// 这些模拟已在jest.setup.js中配置，此处只是为了演示
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn().mockImplementation(() => Promise.resolve({
    cpu: { model_name: 'Test CPU', architecture: 'x86_64', cores: 4, is_arm: false },
    memory: 16384,
    tee: { tee_type: 'none', sgx_supported: false, trustzone_supported: false }
  }))
}));

describe('Home Page', () => {
  it('renders welcome text', () => {
    render(<Home />);
    expect(screen.getByText(/欢迎使用 COS72 应用/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Home />);
    expect(screen.getByText(/初始化中/i)).toBeInTheDocument();
  });

  it('displays hardware info after loading', async () => {
    render(<Home />);
    
    // 等待异步操作完成
    await waitFor(() => {
      expect(screen.getByText(/硬件检测完成/i)).toBeInTheDocument();
    });
    
    // 检查硬件信息显示
    expect(screen.getByText(/Test CPU/i)).toBeInTheDocument();
    expect(screen.getByText(/x86_64/i)).toBeInTheDocument();
    expect(screen.getByText(/否/i)).toBeInTheDocument(); // TEE不支持
  });

  it('has a test signature button', () => {
    render(<Home />);
    expect(screen.getByText(/测试签名/i)).toBeInTheDocument();
  });
}); 