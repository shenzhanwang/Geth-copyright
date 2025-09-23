import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Alert, CircularProgress, Pagination, Modal, TextField, FormControl, InputLabel, Input } from '@mui/material';
import { Delete, Send } from '@mui/icons-material';
import { fetchAPI } from '../auth/authService';

function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [mintError, setMintError] = useState('');
  const [isMinting, setIsMinting] = useState(false);

  // 获取用户列表
  const fetchUsers = async (page = 1) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchAPI(`/users?pageNum=${page}&pageSize=${pageSize}`, 'GET');
      
      if (response && response.errno === '0' && response.data) {
        if (response.data && Array.isArray(response.data.Rows)) {
          const userData = response.data.Rows;
          const totalCount = response.data.Total || userData.length;
          
          setUsers(userData);
          setTotalPages(Math.ceil(totalCount / (response.data.PageSize || pageSize)));
          setPageSize(response.data.PageSize || pageSize);
          
          if (userData.length === 0) {
            setError('当前页没有用户数据');
          }
        } else {
          setError('API返回数据格式不正确，无法找到用户列表');
          setUsers([]);
          setTotalPages(1);
        }
      } else {
        setError(`获取用户失败: ${response?.errmsg || '未知错误'}`);
        setUsers([]);
        setTotalPages(1);
      }
    } catch (err) {
      setError(`网络请求失败: ${err.message || '无法连接到服务器'}`);
      setUsers([]);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  // 删除用户 - address参数通过URL传递
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`确定要删除用户 ${user.address} 吗？`)) {
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');
    
    try {
      // address参数通过URL查询参数传递
      const encodedAddress = encodeURIComponent(user.address);
      const response = await fetchAPI(`/users?address=${encodedAddress}`, 'DELETE');
      
      if (response && response.errno === '0') {
        setSuccessMessage(`成功删除用户 ${user.address}`);
        setCurrentPage(1);
        fetchUsers(1);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response?.errmsg || '删除用户失败');
      }
    } catch (err) {
      console.error('删除用户错误:', err);
      setError('网络错误，请检查您的连接');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 打开转账模态框
  const openTransferModal = (user) => {
    setSelectedUser(user);
    setTransferAmount('');
    setTransferError('');
    setIsTransferModalOpen(true);
  };
  
  // 关闭转账模态框
  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedUser(null);
    setTransferAmount('');
    setTransferError('');
  };

  // 打开发代币模态框
  const openMintModal = (user) => {
    setSelectedUser(user);
    setMintAmount('');
    setMintError('');
    setIsMintModalOpen(true);
  };

  // 关闭发代币模态框
  const closeMintModal = () => {
    setIsMintModalOpen(false);
    setSelectedUser(null);
    setMintAmount('');
    setMintError('');
  };

  // 处理代币金额变化
  const handleMintAmountChange = (e) => {
    const value = e.target.value;
    // 只允许输入数字和小数点
    if (value === '' || /^\d+(\.\d{0,8})?$/.test(value)) {
      setMintAmount(value);
      setMintError('');
    }
  };

  // 提交发代币请求
  const handleMintToken = async () => {
    if (!selectedUser || !mintAmount) {
      setMintError('请输入代币金额');
      return;
    }
    
    if (parseFloat(mintAmount) <= 0) {
      setMintError('代币金额必须大于0');
      return;
    }
    
    setIsMinting(true);
    setMintError('');
    
    try {
      // 将输入的代币金额转换为整数（根据实际需求调整）
      const tokenAmount = (parseFloat(mintAmount)).toString();
      const response = await fetchAPI('/token/mint', 'POST', {
        to: selectedUser.address,
        value: tokenAmount
      });
      
      if (response && response.errno === '0') {
        setSuccessMessage(`成功发放 ${mintAmount} 代币给用户 ${selectedUser.address}`);
        closeMintModal();
        // 发放成功后刷新整个页面
        setTimeout(() => {
          setSuccessMessage('');
          window.location.reload();
        }, 1500);
      } else {
        setMintError(response?.errmsg || '发放代币失败');
      }
    } catch (err) {
      console.error('发放代币错误:', err);
      setMintError('网络错误，请检查您的连接');
    } finally {
      setIsMinting(false);
    }
  };
  
  // 处理转账金额变化
  const handleAmountChange = (e) => {
    const value = e.target.value;
    // 只允许输入数字和小数点
    if (value === '' || /^\d+(\.\d{0,8})?$/.test(value)) {
      setTransferAmount(value);
      setTransferError('');
    }
  };
  
  // 提交转账请求
  const handleTransfer = async () => {
    if (!selectedUser || !transferAmount) {
      setTransferError('请输入转账金额');
      return;
    }
    
    if (parseFloat(transferAmount) <= 0) {
      setTransferError('转账金额必须大于0');
      return;
    }
    
    setIsTransferring(true);
    setTransferError('');
    
    try {
      // 将输入的ETH金额转换为WEI（1 ETH = 10^18 WEI）
      const weiAmount = (parseFloat(transferAmount) * 10**18).toString();
      const response = await fetchAPI('/transfer', 'POST', {
        to: selectedUser.address,
        value: weiAmount
      });
      
      if (response && response.errno === '0') {
        setSuccessMessage(`成功转账 ${transferAmount} ETH 给用户 ${selectedUser.address}`);
        closeTransferModal();
        // 转账成功后刷新整个页面
        setTimeout(() => {
          setSuccessMessage('');
          window.location.reload();
        }, 1500);
      } else {
        setTransferError(response?.errmsg || '转账失败');
      }
    } catch (err) {
      console.error('转账错误:', err);
      setTransferError('网络错误，请检查您的连接');
    } finally {
      setIsTransferring(false);
    }
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchUsers(value);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Box className="user-management-page" p={3}>
      <Typography variant="h5" component="h1" gutterBottom>
        用户管理
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        显示系统中所有用户列表，您可以删除不需要的用户。
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>加载中...</Typography>
        </Box>
      ) : (
        <Box>
          {users.length === 0 ? (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
              <Typography variant="h6" color="textSecondary">暂无用户数据</Typography>
              <Button 
                variant="outlined" 
                onClick={() => fetchUsers(currentPage)} 
                sx={{ mt: 2 }}
              >
                重试加载
              </Button>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>序号</TableCell>
                      <TableCell>用户名</TableCell>
                      <TableCell>邮箱</TableCell>
                      <TableCell>地址</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map((user, index) => (
                      <TableRow key={user.address || user.username || index}>
                        <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                        <TableCell>{user.username || '未设置'}</TableCell>
                        <TableCell>{user.email || '未设置'}</TableCell>
                        <TableCell>{user.address || '未设置'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outlined" 
                            color="primary" 
                            size="small" 
                            startIcon={<Send />}
                            onClick={() => openTransferModal(user)}
                            sx={{ mr: 1 }}
                            disabled={!user.address || user.username === 'admin'}
                          >
                            转账
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="success" 
                            size="small" 
                            onClick={() => openMintModal(user)}
                            sx={{ mr: 1 }}
                            disabled={!user.address}
                          >
                            发代币
                          </Button>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            size="small" 
                            startIcon={<Delete />}
                            onClick={() => handleDeleteUser(user)}
                          >
                            删除
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box display="flex" justifyContent="center" mt={2}>
                <Pagination 
                  count={totalPages} 
                  page={currentPage} 
                  onChange={handlePageChange} 
                  color="primary" 
                />
              </Box>
            </>
          )}
        </Box>
      )}
      
      {/* 转账模态框 */}
      <Modal
        open={isTransferModalOpen}
        onClose={closeTransferModal}
        aria-labelledby="transfer-modal-title"
        aria-describedby="transfer-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography id="transfer-modal-title" variant="h6" component="h2" gutterBottom>
            转账给 {selectedUser?.username || selectedUser?.address}
          </Typography>
          <Typography id="transfer-modal-description" variant="body2" color="textSecondary" gutterBottom>
            请输入转账金额 (ETH)
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="transfer-amount">金额 (ETH)</InputLabel>
            <Input
              id="transfer-amount"
              type="text"
              value={transferAmount}
              onChange={handleAmountChange}
              placeholder="0.00"
              error={!!transferError}
            />
            {transferError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {transferError}
              </Typography>
            )}
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={closeTransferModal} sx={{ mr: 2 }}>
              取消
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleTransfer}
              disabled={isTransferring || !transferAmount || parseFloat(transferAmount) <= 0}
            >
              {isTransferring ? '处理中...' : '确定'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* 发代币模态框 */}
      <Modal
        open={isMintModalOpen}
        onClose={closeMintModal}
        aria-labelledby="mint-modal-title"
        aria-describedby="mint-modal-description"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          border: '2px solid #000',
          boxShadow: 24,
          p: 4,
          borderRadius: 2
        }}>
          <Typography id="mint-modal-title" variant="h6" component="h2" gutterBottom>
            发放代币给 {selectedUser?.username || selectedUser?.address}
          </Typography>
          <Typography id="mint-modal-description" variant="body2" color="textSecondary" gutterBottom>
            请输入代币金额
          </Typography>
          <FormControl fullWidth margin="normal">
            <InputLabel htmlFor="mint-amount">代币金额</InputLabel>
            <Input
              id="mint-amount"
              type="text"
              value={mintAmount}
              onChange={handleMintAmountChange}
              placeholder="0.00"
              error={!!mintError}
            />
            {mintError && (
              <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
                {mintError}
              </Typography>
            )}
          </FormControl>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button onClick={closeMintModal} sx={{ mr: 2 }}>
              取消
            </Button>
            <Button 
              variant="contained" 
              color="success" 
              onClick={handleMintToken}
              disabled={isMinting || !mintAmount || parseFloat(mintAmount) <= 0}
            >
              {isMinting ? '处理中...' : '发放'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}

export default UserManagementPage;