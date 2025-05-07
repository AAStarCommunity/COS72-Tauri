import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

/**
 * 通用导航组件，用于所有页面的顶部导航栏
 */
export default function Navigation() {
  const router = useRouter();
  const currentPath = router.pathname;
  
  // 导航项目配置
  const navItems = [
    { path: '/', label: '首页' },
    { path: '/eth-wallet', label: '以太坊钱包' },
    { path: '/register-passkey', label: 'Passkey管理' },
    { path: '/test-passkey', label: '测试签名' },
    { path: '/plugins', label: '插件' },
    { path: '/debug', label: '调试' },
  ];
  
  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <span className="font-bold text-xl">COS72 - 社区操作系统</span>
        <div className="space-x-4">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${
                currentPath === item.path 
                  ? 'text-blue-700 font-semibold' 
                  : 'text-blue-500 hover:text-blue-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
} 