import React, { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import LoginPage from './auth/LoginPage';
import ProfilePage from './components/ProfilePage';
import UserManagementPage from './components/UserManagementPage';
import UserManagementLayout from './components/UserManagementLayout';
import './components/ProfilePage.css';
import { getUserInfo, checkSession, logoutUser, getEthBalance, getTokenBalance } from './auth/authService';

// 路由守卫组件 - 仅允许已登录用户访问
const PrivateRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const localUserInfo = getUserInfo();
        if (localUserInfo && localUserInfo.address) {
          setIsLoggedIn(true);
        } else {
          const sessionResult = await checkSession();
          setIsLoggedIn(sessionResult && sessionResult.errno === '0' && sessionResult.data);
        }
      } catch (error) {
        console.warn('Session check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在检查登录状态...</p>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

// 路由守卫组件 - 仅允许未登录用户访问
const LoginRoute = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const localUserInfo = getUserInfo();
        if (localUserInfo && localUserInfo.address) {
          setIsLoggedIn(true);
        } else {
          const sessionResult = await checkSession();
          setIsLoggedIn(sessionResult && sessionResult.errno === '0' && sessionResult.data);
        }
      } catch (error) {
        console.warn('Session check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在检查登录状态...</p>
      </div>
    );
  }

  return isLoggedIn ? <Navigate to="/profile" replace /> : children;
};

// 根路由组件 - 根据登录状态重定向
const RootRoute = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const localUserInfo = getUserInfo();
        if (localUserInfo && localUserInfo.address) {
          setIsLoggedIn(true);
        } else {
          const sessionResult = await checkSession();
          setIsLoggedIn(sessionResult && sessionResult.errno === '0' && sessionResult.data);
        }
      } catch (error) {
        console.warn('Session check failed:', error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>正在检查登录状态...</p>
      </div>
    );
  }

  return <Navigate to={isLoggedIn ? '/profile' : '/login'} replace />;
};

// 应用布局组件
const AppLayout = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [tokenBalance, setTokenBalance] = useState('0');
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserInfo = () => {
      const localUserInfo = getUserInfo();
      if (localUserInfo) {
        setUserInfo(localUserInfo);
      }
    };

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

    loadUserInfo();
    loadBalances();
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
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
        <ProfilePage />
      </main>

      <footer className="app-footer">
        <p>© 2025 图片版权交易系统 | 保护您的数字知识产权</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Routes>
      {/* 根路由 - 根据登录状态重定向 */}
      <Route path="/" element={<RootRoute />} />
      
      {/* 登录页面路由 */}
      <Route 
        path="/login" 
        element={
          <LoginRoute>
            <LoginPage />
          </LoginRoute>
        }
      />
      
      {/* 个人中心路由 */}
      <Route 
        path="/profile" 
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      />
      
      {/* 用户管理页面路由 */}
      <Route 
        path="/user-management" 
        element={
          <PrivateRoute>
            <UserManagementLayout />
          </PrivateRoute>
        }
      />
      
      {/* 404 路由 - 重定向到根路径 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;