import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Plugins from '../src/pages/plugins';

describe('Plugins Page', () => {
  it('renders plugin management title', () => {
    render(<Plugins />);
    expect(screen.getByText(/TEE插件管理/i)).toBeInTheDocument();
  });

  it('shows loading state initially', () => {
    render(<Plugins />);
    expect(screen.getByText(/加载中/i)).toBeInTheDocument();
  });

  it('displays plugin list after loading', async () => {
    render(<Plugins />);
    
    // 等待异步操作完成
    await waitFor(() => {
      expect(screen.getByText(/就绪/i)).toBeInTheDocument();
    });
    
    // 检查插件列表
    expect(screen.getByText(/TEE 基础钱包/i)).toBeInTheDocument();
    expect(screen.getByText(/TEE Enclave 示例/i)).toBeInTheDocument();
  });

  it('has download buttons', async () => {
    render(<Plugins />);
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText(/就绪/i)).toBeInTheDocument();
    });
    
    // 检查下载按钮
    const downloadButtons = screen.getAllByText(/下载/i);
    expect(downloadButtons.length).toBeGreaterThan(0);
  });
}); 