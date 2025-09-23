import React, { useState } from 'react';
import { Container, Box, Typography, TextField, Button, CssBaseline, Paper, Tabs, Tab, Divider, Snackbar, Alert } from '@mui/material';
import { Lock, Key, Person, Mail, ChevronRight, Info, Warning } from '@mui/icons-material';
import { registerUser, loginUser, saveUserInfo } from './authService';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0); // 0: 登录, 1: 注册
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [errorType, setErrorType] = useState(''); // 用于标识错误类型：'username', 'password', 'confirmPassword', 'email'
    const [success, setSuccess] = useState('');

  // 验证邮箱格式
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // 处理标签切换
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError('');
    setErrorType('');
    setSuccess('');
    setUsername('');
    setEmail('');
  };

  // 验证密码 - 无强度限制
  const validatePassword = (pwd) => {
    // 仅检查密码不为空
    return !!pwd;
  };

  // 处理登录
  const handleLogin = async () => {
    if (!username) {
      setError('请输入用户名');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const result = await loginUser(password, username);
      
      if (result && result.errno === '0') {
        // 登录成功
        saveUserInfo({ address: result.data, username: username });
        
        // 根据用户名决定重定向页面
        if (username.toLowerCase() === 'admin') {
          setSuccess('登录成功！正在跳转到用户管理页面...');
          // 等待一小段时间让用户看到成功提示，然后跳转到用户管理页面
          setTimeout(() => {
            navigate('/user-management');
          }, 1500);
        } else {
          setSuccess('登录成功！正在跳转到个人中心...');
          // 等待一小段时间让用户看到成功提示，然后跳转到个人中心页面
          setTimeout(() => {
            navigate('/profile');
          }, 1500);
        }
      } else {
        setError('登录失败：' + (result.errMsg || '未知错误'));
      }
    } catch (err) {
      setError('登录失败：网络错误或服务器不可用');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理注册
  const handleRegister = async () => {
    if (!username) {
      setError('请输入用户名');
      setErrorType('username');
      return;
    }
    if (!email) {
      setError('请输入邮箱');
      setErrorType('email');
      return;
    }
    if (!validateEmail(email)) {
      setError('请输入有效的邮箱地址');
      setErrorType('email');
      return;
    }
    if (!password) {
      setError('请设置密码');
      setErrorType('password');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setErrorType('confirmPassword');
      return;
    }

    // 已移除密码强度验证，只要求密码不为空

    setIsLoading(true);
    setError('');
    
    try {
      const result = await registerUser(password, username, email);
      
      if (result && result.errno === '0') {
        // 注册成功
        setSuccess('注册成功！您的地址是：' + result.data);
        setPassword('');
        setConfirmPassword('');
        // 自动切换到登录标签
        setActiveTab(0);
      } else {
        setError('注册失败：' + (result.errMsg || '未知错误'));
      }
    } catch (err) {
      setError('注册失败：网络错误或服务器不可用');
      console.error('Register error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div sx={{ mb: 4, textAlign: 'center' }}>
          <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            图片版权交易系统
          </Typography>
          <Typography variant="body2" color="text.secondary">
            连接您的数字资产世界
          </Typography>
        </div>
        
        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ mb: 4, '& .MuiTabs-indicator': { backgroundColor: '#1976d2' } }}
          >
            <Tab 
              icon={<Lock size={18} />}
              iconPosition="start"
              label="登录"
              sx={{ fontWeight: 'medium' }}
            />
            <Tab 
              icon={<Person size={18} />}
              iconPosition="start"
              label="注册"
              sx={{ fontWeight: 'medium' }}
            />
          </Tabs>

          <Box component="form" noValidate sx={{ mt: 1 }}>
            {activeTab === 0 ? (
              // 登录表单
              <div>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  请输入您的用户名和密码进行身份验证
                </Typography>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="username"
                  label="用户名"
                  type="text"
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={!!error && activeTab === 0}
                  helperText={error && activeTab === 0 ? error : ''}
                  InputProps={{
                    startAdornment: <Person size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="密码"
                  type="password"
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!error && activeTab === 0}
                  helperText={error && activeTab === 0 ? error : ''}
                  InputProps={{
                    startAdornment: <Key size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontWeight: 'bold',
                    backgroundColor: '#1976d2',
                    '&:hover': {
                      backgroundColor: '#1565c0',
                    },
                  }}
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? '登录中...' : '登录'}
                </Button>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  没有账户？点击注册创建新账户
                </Typography>
              </div>
            ) : (
              // 注册表单
              <div>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                  创建新账户，系统将为您生成以太坊地址
                </Typography>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="username"
                  label="用户名"
                  type="text"
                  id="register-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={!!error && activeTab === 1 && errorType === 'username'}
                  helperText={error && activeTab === 1 && errorType === 'username' ? error : ''}
                  InputProps={{
                    startAdornment: <Person size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="email"
                  label="邮箱"
                  type="email"
                  id="register-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error && activeTab === 1 && errorType === 'email'}
                  helperText={error && activeTab === 1 && errorType === 'email' ? error : ''}
                  InputProps={{
                    startAdornment: <Mail size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="设置密码"
                  type="password"
                  id="register-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!error && activeTab === 1 && (errorType === 'password' || errorType === 'confirmPassword')}
                  helperText={error && activeTab === 1 && errorType === 'password' ? error : ''}
                  InputProps={{
                    startAdornment: <Key size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="确认密码"
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!error && activeTab === 1 && errorType === 'confirmPassword'}
                  helperText={error && activeTab === 1 && errorType === 'confirmPassword' ? error : ''}
                  InputProps={{
                    startAdornment: <Key size={18} sx={{ mr: 2, color: 'text.secondary' }} />,
                  }}
                />
                {/* 密码强度提示已移除 */}
                <Button
                  type="button"
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontWeight: 'bold',
                    backgroundColor: '#4caf50',
                    '&:hover': {
                      backgroundColor: '#388e3c',
                    },
                  }}
                  onClick={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? '注册中...' : '注册'}
                </Button>
              </div>
            )}
          </Box>
        </Paper>
      </Box>

      {/* 成功消息 */}
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* 错误消息 */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default LoginPage;