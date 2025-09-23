import React, { useState, useEffect } from 'react';
import { getUserInfo, logoutUser, getEthBalance, getTokenBalance } from '../auth/authService';
import UserManagementPage from './UserManagementPage';

function UserManagementLayout() {
  const [userInfo, setUserInfo] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  
  // 获取余额信息的函数
  const loadBalances = async () => {
    try {
      // 获取以太坊余额
      const ethBalanceResponse = await getEthBalance();
      if (ethBalanceResponse && ethBalanceResponse.data) {
        setEthBalance(ethBalanceResponse.data);
      }
      
      // 获取代币余额
      const tokenBalanceResponse = await getTokenBalance();
      if (tokenBalanceResponse && tokenBalanceResponse.data) {
        setTokenBalance(tokenBalanceResponse.data);
      }
    } catch (error) {
      console.error('获取余额失败:', error);
    }
  };
  
  // 加载用户信息的函数
  const loadUserInfo = () => {
    const localUserInfo = getUserInfo();
    if (localUserInfo) {
      setUserInfo(localUserInfo);
    }
  };
  
  // 组件挂载时的初始化
  useEffect(() => {
    loadUserInfo();
    loadBalances();
  }, []);
  
  // 定期检查用户信息是否更新（每500毫秒检查一次）
  useEffect(() => {
    const interval = setInterval(() => {
      const updatedUserInfo = getUserInfo();
      if (updatedUserInfo && JSON.stringify(updatedUserInfo) !== JSON.stringify(userInfo)) {
        setUserInfo(updatedUserInfo);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [userInfo]);

  const handleLogout = () => {
    logoutUser();
    window.location.href = '/login';
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>图片版权交易系统</h1>
        <div className="user-info">
          <div className="user-details">
            <span className="username">
              {userInfo?.username ? 
                userInfo.username 
                : '已登录'}
            </span>
            <span className="balance-item">ETH: {ethBalance}</span>
            <span className="balance-item">Token: {tokenBalance}</span>
          </div>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            登出
          </button>
        </div>
      </header>
      
      <main className="app-main">
        <UserManagementPage />
      </main>
      
      <footer className="app-footer">
        <p>© 2025 图片版权交易系统 | 保护您的数字知识产权</p>
      </footer>
    </div>
  );
}

export default UserManagementLayout;