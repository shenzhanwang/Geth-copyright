import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Divider, Card, CardContent, CircularProgress, Alert, Button, Modal, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { fetchAPI } from '../auth/authService'; // 确保此路径正确指向你的 authService 文件
import { Person, ShoppingCart, History, Store, Image as ImageIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../auth/authService'; // 确保此路径正确

function ProfilePage() {
  const [activeMenu, setActiveMenu] = useState('myAssets');
  const [isLoading, setIsLoading] = useState(true);
  const [myAssets, setMyAssets] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0); // 当前页码
  
  // 拍卖资产相关状态
  const [auctionAssets, setAuctionAssets] = useState([]);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [auctionError, setAuctionError] = useState('');
  const [auctionCurrentPage, setAuctionCurrentPage] = useState(0);

  // 我的出售资产相关状态
  const [myAuctionsAssets, setMyAuctionsAssets] = useState([]);
  const [myAuctionsLoading, setMyAuctionsLoading] = useState(false);
  const [myAuctionsError, setMyAuctionsError] = useState('');
  const [myAuctionsCurrentPage, setMyAuctionsCurrentPage] = useState(0);

  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 出售相关状态
  const [sellDialogOpen, setSellDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [sellPercentage, setSellPercentage] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [sellError, setSellError] = useState('');

  // 购买相关状态
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [purchasePercentage, setPurchasePercentage] = useState('');
  const [purchaseError, setPurchaseError] = useState('');

  // 购买记录相关状态
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1); // API页码从1开始
  const [historyPageSize] = useState(5); // 每页条数，用户需求为5
  const [totalHistoryItems, setTotalHistoryItems] = useState(0); // 总记录数

  const itemsPerPage = 3; // 每页展示的图片数量

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsModalOpen(true);
  };

  // 处理出售资产点击
  const handleSellAsset = (asset) => {
    setSelectedAsset(asset);
    setSellPercentage('');
    setSellPrice('');
    setSellError('');
    setSellDialogOpen(true);
  };

  // 处理购买资产点击
  const handlePurchaseAsset = (asset) => {
    setSelectedAsset(asset);
    setPurchasePercentage('');
    setPurchaseError('');
    setPurchaseDialogOpen(true);
  };

  // 格式化时间
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      return new Date(timeStr).toLocaleString();
    } catch {
      return timeStr;
    }
  };

  // 获取购买记录数据
  const fetchPurchaseHistory = async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const response = await fetchAPI(`/auction/history?pageNum=${historyCurrentPage}&pageSize=${historyPageSize}`, 'GET');
      
      if (response && response.errno === '0' && response.data) {
        setPurchaseHistory(response.data.Rows || []);
        setTotalHistoryItems(response.data.Total || 0);
      } else {
        setHistoryError('获取购买记录失败，请重试');
      }
    } catch (err) {
      console.error('获取购买记录失败:', err);
      setHistoryError('获取购买记录失败，请检查网络连接');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 处理购买记录分页
  const handleHistoryPageChange = (newPage) => {
    if (newPage < 1 || newPage > totalHistoryPages) return;
    setHistoryCurrentPage(newPage);
  };

  // 处理撤销出售点击 - 调用DELETE /auction接口
  const handleCancelAuction = async (asset) => {
    if (!window.confirm(`确定要撤销此商品的出售吗？`)) {
      return;
    }
    
    // 显示加载状态
    setIsLoading(true);
    try {
      // 调用DELETE /auction接口，通过查询参数传递token_id
      const response = await fetchAPI(`/auction?token_id=${asset.token_id}`, 'DELETE');
      
      if (response && response.errno === '0') {
        // 撤销成功
        alert(`成功撤销出售`);
        fetchMyAuctions(); // 刷新我的出售列表
      } else {
        // 撤销失败
        alert(`撤销失败: ${response?.msg || '未知错误'}`);
      }
    } catch (err) {
      console.error('撤销出售请求失败:', err);
      alert(`网络错误: ${err.message || '无法连接到服务器'}`);
    } finally {
      // 隐藏加载状态
      setIsLoading(false);
    }
  };

  // 处理出售表单提交
  const handleSellSubmit = async () => {
    // 验证输入
    if (!sellPercentage || !sellPrice) {
      setSellError('请填写出售份额和单价');
      return;
    }

    const percentage = parseFloat(sellPercentage);
    const price = parseFloat(sellPrice);

    if (isNaN(percentage) || percentage <= 0 || percentage > selectedAsset.weight || !Number.isInteger(percentage)) {
      setSellError(`出售份额必须在1-${selectedAsset.weight}%之间的整数`);
      return;
    }

    if (isNaN(price) || price <= 0) {
      setSellError('出售单价必须大于0');
      return;
    }

    // 调用后端出售接口
    try {
      setIsLoading(true);
      const response = await fetchAPI('/auction', 'POST', {
          token_id: selectedAsset.token_id,
          weight: percentage,
          price: price
        });
      
      if (response && response.errno === '0') {
        // 出售成功
        alert(`成功提交出售请求：${percentage}% 份额，单价：${price}`);
        setSellDialogOpen(false);
        // 刷新资产列表
        fetchMyAssets();
      } else {
        // 确保错误消息被正确设置，特别是处理错误码如"4107"的情况
        setSellError(response?.errmsg || response?.msg || '出售失败，请重试');
      }
    } catch (error) {
      console.error('出售请求失败:', error);
      setSellError('网络错误，请检查您的连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理购买表单提交
  const handlePurchaseSubmit = async () => {
    // 验证输入
    if (!purchasePercentage) {
      setPurchaseError('请填写购买份额');
      return;
    }

    const percentage = parseFloat(purchasePercentage);
    const asset = selectedAsset;

    if (isNaN(percentage) || percentage <= 0 || percentage > asset.weight || !Number.isInteger(percentage)) {
      setPurchaseError(`购买份额必须在1-${asset.weight}%之间的整数`);
      return;
    }

    // 检查是否有address
    if (!asset.address) {
      setPurchaseError('该资产缺少必要的地址信息，无法购买');
      return;
    }

    // 调用后端购买接口 - 添加address参数（从资产中获取）
    try {
      setIsLoading(true);
      const response = await fetchAPI('/auction/bid', 'POST', {
          token_id: asset.token_id,  // 参数名与用户要求一致
          weight: percentage,        // 参数名与用户要求一致
          price: asset.price,        // 参数名与用户要求一致
          address: asset.address     // 新增：从资产获取地址
        });
      
      if (response && response.errno === '0') {
        // 购买成功
        alert(`成功购买 ${percentage}% 份额，总价：${percentage * asset.price}`);
        setPurchaseDialogOpen(false);
        // 刷新拍卖资产列表
        fetchAuctionAssets();
      } else {
        setPurchaseError(response?.msg || '购买失败，请重试');
      }
    } catch (error) {
      console.error('购买请求失败:', error);
      setPurchaseError('网络错误，请检查您的连接');
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const menuItems = [
    { id: 'myAssets', label: '我的资产', icon: <Person fontSize="small" /> },
    { id: 'mySales', label: '出售资产', icon: <Store fontSize="small" /> },
    { id: 'purchasedAssets', label: '购买资产', icon: <ShoppingCart fontSize="small" /> },
    { id: 'purchaseHistory', label: '购买记录', icon: <History fontSize="small" /> },
  ];

  const fetchMyAssets = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetchAPI('/content', 'GET');
      if (response && response.errno === '0' && response.data) {
        if (response.data.contents) {
          const assets = Array.isArray(response.data.contents) ? response.data.contents : [response.data.contents];
          setMyAssets(
            assets.map((item, index) => ({
              id: item.id || index.toString(),
              token_id: item.token_id || '',
              file_name: item.title || item.file_name || item.name || `image_${index}`,
              file_path: item.content || item.file_path || '',
              create_time: item.create_time || new Date().toLocaleString(),
              file_size: item.file_size || 0,
              weight: item.weight || 0,
            }))
          );
        } else if (response.data.content) {
          const assets = Array.isArray(response.data.content) ? response.data.content : [response.data.content];
          setMyAssets(
            assets.map((item, index) => ({
              id: item.id || index.toString(),
              token_id: item.token_id || '',
              file_name: item.file_name || item.name || `image_${index}`,
              file_path: item.content || item.file_path || '',
              create_time: item.create_time || new Date().toLocaleString(),
              file_size: item.file_size || 0,
              weight: item.weight || 0,
            }))
          );
        } else {
          setMyAssets(Array.isArray(response.data) ? response.data : []);
        }
        setCurrentPage(0); // 重置页码
      } else {
        setError('获取资产失败，请重试');
      }
    } catch (err) {
      console.error('获取我的资产失败:', err);
      setError('获取资产失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAuctionAssets = async () => {
    setAuctionLoading(true);
    setAuctionError('');
    try {
      const response = await fetchAPI('/auctions', 'GET');
      if (response && response.errno === '0' && response.data) {
        const assets = Array.isArray(response.data) ? response.data : [response.data];
        setAuctionAssets(
          assets.map((item, index) => ({
            id: item.id || index.toString(),
            token_id: item.token_id || '',
            file_name: item.title || item.file_name || item.name || `auction_${index}`,
            file_path: item.content || item.file_path || '',
            create_time: item.create_time || new Date().toLocaleString(),
            price: item.price || 0,
            seller: item.seller || '未知卖家',
            username: item.username || '',
            weight: item.weight || 0,
            address: item.address || ''
          }))
        );
        setAuctionCurrentPage(0); // 重置页码
      } else {
        setAuctionError('获取拍卖资产失败，请重试');
      }
    } catch (err) {
      console.error('获取拍卖资产失败:', err);
      setAuctionError('获取拍卖资产失败，请检查网络连接');
    } finally {
      setAuctionLoading(false);
    }
  };

  const fetchMyAuctions = async () => {
    setMyAuctionsLoading(true);
    setMyAuctionsError('');
    try {
      const response = await fetchAPI('/myauctions', 'GET');
      if (response && response.errno === '0' && response.data) {
        const assets = Array.isArray(response.data) ? response.data : [response.data];
        setMyAuctionsAssets(
          assets.map((item, index) => ({
            id: item.id || index.toString(),
            token_id: item.token_id || '',
            file_name: item.title || item.file_name || item.name || `myauction_${index}`,
            file_path: item.content || item.file_path || '',
            create_time: item.create_time || new Date().toLocaleString(),
            price: item.price || 0,
            weight: item.weight || 0,
            address: item.address || ''
          }))
        );
        setMyAuctionsCurrentPage(0); // 重置页码
      } else {
        setMyAuctionsError('获取我出售的资产失败，请重试');
      }
    } catch (err) {
      console.error('获取我出售的资产失败:', err);
      setMyAuctionsError('获取我出售的资产失败，请检查网络连接');
    } finally {
      setMyAuctionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'myAssets') {
      fetchMyAssets();
    } else if (activeMenu === 'purchasedAssets') {
      fetchAuctionAssets();
    } else if (activeMenu === 'mySales') {
      fetchMyAuctions(); // 切换到出售资产时获取数据
    } else if (activeMenu === 'purchaseHistory') {
      fetchPurchaseHistory(); // 切换到购买记录时获取数据
    }
  }, [activeMenu, historyCurrentPage]);

  const totalPages = Math.ceil(myAssets.length / itemsPerPage);
  const totalAuctionPages = Math.ceil(auctionAssets.length / itemsPerPage);
  const totalMyAuctionsPages = Math.ceil(myAuctionsAssets.length / itemsPerPage);
  const totalHistoryPages = Math.ceil(totalHistoryItems / historyPageSize);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
  };

  const handleAuctionPrevPage = () => {
    setAuctionCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleAuctionNextPage = () => {
    setAuctionCurrentPage((prev) => Math.min(prev + 1, totalAuctionPages - 1));
  };

  const handleMyAuctionsPrevPage = () => {
    setMyAuctionsCurrentPage((prev) => Math.max(prev - 1, 0));
  };

  const handleMyAuctionsNextPage = () => {
    setMyAuctionsCurrentPage((prev) => Math.min(prev + 1, totalMyAuctionsPages - 1));
  };

  const renderMyAssets = () => {
    const handleUploadImage = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('fileName', file);

        const response = await fetch(`${API_BASE_URL}/content`, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`上传失败: ${response.status}`);
        }

        const result = await response.json();
        if (result && result.errno === '0') {
          fetchMyAssets(); // 上传成功后刷新列表
        } else {
          setError(result?.message || '上传失败，请重试');
        }
      } catch (err) {
        console.error('上传图片失败:', err);
        setError('上传失败，请检查网络连接');
      } finally {
        setIsLoading(false);
        event.target.value = ''; // 重置文件输入
      }
    };

    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>加载中...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" variant="filled" style={{ marginBottom: 16 }}>
          {error}
        </Alert>
      );
    }

    const UploadButton = (
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <label
          style={{
            display: 'inline-block',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          <input type="file" accept="image/*" onChange={handleUploadImage} style={{ display: 'none' }} />
          上传图片
        </label>
      </Box>
    );

    if (myAssets.length === 0) {
      return (
        <>
          {UploadButton}
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
            <ImageIcon fontSize="large" color="disabled" />
            <Typography variant="h6" style={{ marginTop: 16, color: '#666' }}>
              暂无资产
            </Typography>
            <Typography variant="body2" style={{ marginTop: 8, color: '#999' }}>
              您还没有上传任何图片资产
            </Typography>
          </Box>
        </>
      );
    }

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssets = myAssets.slice(startIndex, endIndex);

    const getImageUrl = (filePath, fileName) => {
      if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
        return filePath;
      } else if (filePath && filePath.startsWith('/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath && filePath.startsWith('/static/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath) {
        return `http://localhost:9527/contents/${filePath}`;
      } else if (fileName) {
        return `http://localhost:9527/contents/${fileName}`;
      } else {
        return '';
      }
    };

    return (
      <>
        {UploadButton}
        <div className="image-gallery" style={{ marginTop: 20, padding: '0 20px' }}>
          <Typography variant="h6" gutterBottom> 我的资产 </Typography>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
            {currentAssets.map((asset) => {
              const imageUrl = getImageUrl(asset.file_path, asset.file_name);
              const key = asset.id || asset.file_name || asset.file_path || Math.random().toString();
              return (
                <Card key={key} className="gallery-card asset-card" elevation={2} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '30%',
                  maxWidth: '300px'
                }}>
                  <div
                    className="gallery-image-container"
                    style={{
                      width: '100%',
                      height: '200px',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f5f5f5'
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={asset.file_name || '图片资产'}
                        className="gallery-image asset-image"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'contain',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleImageClick(imageUrl)}
                      />
                    ) : (
                      <ImageIcon fontSize="large" color="disabled" />
                    )}
                  </div>
                  <CardContent style={{ flexGrow: 1, padding: '12px 16px' }}>
                    <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                      持有份额: {asset.weight}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                      上传时间: {asset.create_time || '未知'}
                    </Typography>
                  </CardContent>
                  <Box style={{ padding: '0 16px 16px 16px', width: '100%' }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      fullWidth
                      onClick={() => handleSellAsset(asset)}
                      style={{ backgroundColor: '#1976d2' }}
                    >
                      出售
                    </Button>
                  </Box>
                </Card>
              );
            })}
          </div>

          <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              variant="outlined"
              size="small"
              style={{ marginRight: '10px' }}
            >
              上一页
            </Button>
            <Typography variant="body2">
              {currentPage + 1} / {totalPages}
            </Typography>
            <Button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              variant="outlined"
              size="small"
              style={{ marginLeft: '10px' }}
            >
              下一页
            </Button>
          </Box>
        </div>

        {isModalOpen && selectedImage && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={closeModal}
          >
            <div
              className="modal-content"
              style={{
                position: 'relative',
                maxWidth: '95%',
                maxHeight: '95%',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close-button"
                style={{
                  position: 'absolute',
                  top: -40,
                  right: 0,
                  color: 'white',
                  backgroundColor: '#f44336',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '5px 10px'
                }}
                onClick={closeModal}
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="放大图片"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '4px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        )}
      </>
    );
  };

  const renderMyAuctions = () => {
    if (myAuctionsLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>加载中...</Typography>
        </Box>
      );
    }

    if (myAuctionsError) {
      return (
        <Alert severity="error" variant="filled" style={{ marginBottom: 16 }}>
          {myAuctionsError}
        </Alert>
      );
    }

    const startIndex = myAuctionsCurrentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssets = myAuctionsAssets.slice(startIndex, endIndex);

    const getImageUrl = (filePath, fileName) => {
      if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
        return filePath;
      } else if (filePath && filePath.startsWith('/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath && filePath.startsWith('/static/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath) {
        return `http://localhost:9527/contents/${filePath}`;
      } else if (fileName) {
        return `http://localhost:9527/contents/${fileName}`;
      } else {
        return '';
      }
    };

    if (myAuctionsAssets.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
          <ImageIcon fontSize="large" color="disabled" />
          <Typography variant="h6" style={{ marginTop: 16, color: '#666' }}>
            暂无出售资产
          </Typography>
          <Typography variant="body2" style={{ marginTop: 8, color: '#999' }}>
            您还没有正在出售的资产
          </Typography>
        </Box>
      );
    }

    return (
      <div className="image-gallery" style={{ marginTop: 20, padding: '0 20px' }}>
        <Typography variant="h6" gutterBottom> 我出售的资产 </Typography>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          {currentAssets.map((asset) => {
            const imageUrl = getImageUrl(asset.file_path, asset.file_name);
            const key = asset.id || asset.file_name || Math.random().toString();
            return (
              <Card key={key} className="gallery-card asset-card" elevation={2} style={{
                display: 'flex',
                flexDirection: 'column',
                width: '30%',
                maxWidth: '300px'
              }}>
                <div
                  className="gallery-image-container"
                  style={{
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={asset.file_name || '出售资产'}
                      className="gallery-image asset-image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(imageUrl)}
                    />
                  ) : (
                    <ImageIcon fontSize="large" color="disabled" />
                  )}
                </div>
                <CardContent style={{ flexGrow: 1, padding: '12px 16px' }}>
                  <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                    价格: {asset.price} 代币
                  </Typography>
                  <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                    出售份额: {asset.weight}%
                  </Typography>
                </CardContent>
                <Box style={{ padding: '0 16px 16px 16px', width: '100%' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => handleCancelAuction(asset)}
                    style={{ backgroundColor: '#f44336' }}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={20} color="inherit" /> : '撤销出售'}
                  </Button>
                </Box>
              </Card>
            );
          })}
        </div>

        <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
          <Button
            onClick={handleMyAuctionsPrevPage}
            disabled={myAuctionsCurrentPage === 0}
            variant="outlined"
            size="small"
            style={{ marginRight: '10px' }}
          >
            上一页
          </Button>
          <Typography variant="body2">
            {myAuctionsCurrentPage + 1} / {totalMyAuctionsPages}
          </Typography>
          <Button
            onClick={handleMyAuctionsNextPage}
            disabled={myAuctionsCurrentPage >= totalMyAuctionsPages - 1}
            variant="outlined"
            size="small"
            style={{ marginLeft: '10px' }}
          >
            下一页
          </Button>
        </Box>
      </div>
    );
  };

  const renderPurchasedAssets = () => {
    if (auctionLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>加载中...</Typography>
        </Box>
      );
    }

    if (auctionError) {
      return (
        <Alert severity="error" variant="filled" style={{ marginBottom: 16 }}>
          {auctionError}
        </Alert>
      );
    }

    const startIndex = auctionCurrentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentAssets = auctionAssets.slice(startIndex, endIndex);

    const getImageUrl = (filePath, fileName) => {
      if (filePath && (filePath.startsWith('http://') || filePath.startsWith('https://'))) {
        return filePath;
      } else if (filePath && filePath.startsWith('/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath && filePath.startsWith('/static/contents/')) {
        return `http://localhost:9527${filePath}`;
      } else if (filePath) {
        return `http://localhost:9527/contents/${filePath}`;
      } else if (fileName) {
        return `http://localhost:9527/contents/${fileName}`;
      } else {
        return '';
      }
    };

    if (auctionAssets.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
          <ImageIcon fontSize="large" color="disabled" />
          <Typography variant="h6" style={{ marginTop: 16, color: '#666' }}>
            暂无可购买资产
          </Typography>
          <Typography variant="body2" style={{ marginTop: 8, color: '#999' }}>
            当前没有可购买的资产拍卖信息
          </Typography>
        </Box>
      );
    }

    return (
      <div className="image-gallery" style={{ marginTop: 20, padding: '0 20px' }}>
        <Typography variant="h6" gutterBottom> 可购买资产 </Typography>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px' }}>
          {currentAssets.map((asset) => {
            const imageUrl = getImageUrl(asset.file_path, asset.file_name);
            const key = asset.id || asset.file_name || Math.random().toString();
            return (
              <Card key={key} className="gallery-card asset-card" elevation={2} style={{
                display: 'flex',
                flexDirection: 'column',
                width: '30%',
                maxWidth: '300px'
              }}>
                <div
                  className="gallery-image-container"
                  style={{
                    width: '100%',
                    height: '200px',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5'
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={asset.file_name || '拍卖资产'}
                      className="gallery-image asset-image"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleImageClick(imageUrl)}
                    />
                  ) : (
                    <ImageIcon fontSize="large" color="disabled" />
                  )}
                </div>
                <CardContent style={{ flexGrow: 1, padding: '12px 16px' }}>
                  <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                    价格: {asset.price} 代币
                  </Typography>
                  <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                    可购份额: {asset.weight}%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" style={{ whiteSpace: 'nowrap', marginBottom: '4px', display: 'block', fontWeight: 'bold' }}>
                    卖家: {asset.username || asset.seller || '未知卖家'}
                  </Typography>
                </CardContent>
                <Box style={{ padding: '0 16px 16px 16px', width: '100%' }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    onClick={() => handlePurchaseAsset(asset)}
                    style={{ backgroundColor: '#4caf50' }}
                  >
                    购买
                  </Button>
                </Box>
              </Card>
            );
          })}
        </div>

        <Box display="flex" justifyContent="center" mt={2}>
          <Button
            onClick={handleAuctionPrevPage}
            disabled={auctionCurrentPage === 0}
            variant="outlined"
            size="small"
            style={{ marginRight: '10px' }}
          >
            上一页
          </Button>
          <Typography variant="body2">
            {auctionCurrentPage + 1} / {totalAuctionPages}
          </Typography>
          <Button
            onClick={handleAuctionNextPage}
            disabled={auctionCurrentPage >= totalAuctionPages - 1}
            variant="outlined"
            size="small"
            style={{ marginLeft: '10px' }}
          >
            下一页
          </Button>
        </Box>

        {isModalOpen && selectedImage && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={closeModal}
          >
            <div
              className="modal-content"
              style={{
                position: 'relative',
                maxWidth: '95%',
                maxHeight: '95%',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close-button"
                style={{
                  position: 'absolute',
                  top: -40,
                  right: 0,
                  color: 'white',
                  backgroundColor: '#f44336',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '5px 10px'
                }}
                onClick={closeModal}
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="放大图片"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '4px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // 渲染购买记录
  const renderPurchaseHistory = () => {
    if (historyLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography variant="body1" style={{ marginLeft: 16 }}>加载中...</Typography>
        </Box>
      );
    }

    if (historyError) {
      return (
        <Alert severity="error" variant="filled" style={{ marginBottom: 16 }}>
          {historyError}
        </Alert>
      );
    }

    if (purchaseHistory.length === 0) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="300px">
          <ShoppingCart fontSize="large" color="disabled" />
          <Typography variant="h6" style={{ marginTop: 16, color: '#666' }}>
            暂无购买记录
          </Typography>
          <Typography variant="body2" style={{ marginTop: 8, color: '#999' }}>
            您还没有任何购买记录
          </Typography>
        </Box>
      );
    }

    return (
      <Box style={{ marginTop: 20, padding: '0 20px' }}>
        <Typography variant="h6" gutterBottom> 我的购买记录 </Typography>
        
        <TableContainer component={Card}>
          <Table aria-label="purchase history table">
            <TableHead>
              <TableRow>
                <TableCell>序号</TableCell>
                <TableCell>购买份额</TableCell>
                <TableCell>单价</TableCell>
                <TableCell>总价</TableCell>
                <TableCell>购买时间</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchaseHistory.map((row, index) => (
                <TableRow key={row.id || index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{row.weight}%</TableCell>
                  <TableCell>{row.price} 代币</TableCell>
                  <TableCell>{(parseFloat(row.weight) * parseFloat(row.price)).toFixed(2)} 代币</TableCell>
                  <TableCell>{formatTime(row.created_at)}</TableCell>
                  <TableCell>
                    {row.content && (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => {
                          // 确保使用正确的端口号9527处理图片URL
                          let imageUrl = row.content;
                          if (imageUrl && !(imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
                            if (imageUrl.startsWith('/contents/') || imageUrl.startsWith('/static/contents/')) {
                              imageUrl = `http://localhost:9527${imageUrl}`;
                            } else {
                              imageUrl = `http://localhost:9527/contents/${imageUrl}`;
                            }
                          }
                          handleImageClick(imageUrl);
                        }}
                      >
                        预览
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* 分页控件 */}
        <Box display="flex" justifyContent="center" mt={2} mb={2}>
          <Button
            onClick={() => handleHistoryPageChange(historyCurrentPage - 1)}
            disabled={historyCurrentPage === 1}
            variant="outlined"
            size="small"
            style={{ marginRight: '10px' }}
          >
            上一页
          </Button>
          <Typography variant="body2">
            第 {historyCurrentPage} 页 / 共 {totalHistoryPages} 页 
          </Typography>
          <Button
            onClick={() => handleHistoryPageChange(historyCurrentPage + 1)}
            disabled={historyCurrentPage >= totalHistoryPages}
            variant="outlined"
            size="small"
            style={{ marginLeft: '10px' }}
          >
            下一页
          </Button>
          <Typography variant="body2" style={{ marginLeft: '20px' }}>
            共 {totalHistoryItems} 条记录
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'myAssets':
        return renderMyAssets();
      case 'mySales':
        return renderMyAuctions();
      case 'purchasedAssets':
        return renderPurchasedAssets();
      case 'purchaseHistory':
        return renderPurchaseHistory();
      default:
        return renderMyAssets();
    }
  };

  return (
    <div className="profile-page" style={{ padding: '20px' }}>
      <div className="profile-layout" style={{ display: 'flex', gap: '20px' }}>
        <div className="profile-sidebar" style={{ width: '200px', flexShrink: 0 }}>
          <Typography variant="h6" gutterBottom> 个人中心 </Typography>
          <List>
            {menuItems.map((item) => (
              <React.Fragment key={item.id}>
                <ListItem
                  button
                  onClick={() => setActiveMenu(item.id)}
                  selected={activeMenu === item.id}
                  style={{
                    borderRadius: '4px',
                    marginBottom: '4px',
                    backgroundColor: activeMenu === item.id ? 'rgba(25, 118, 210, 0.08)' : 'transparent'
                  }}
                >
                  <div style={{ marginRight: 8 }}>{item.icon}</div>
                  <ListItemText primary={item.label} />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </div>

        <div className="profile-content" style={{ flexGrow: 1, overflow: 'hidden' }}>
          <div className="profile-content-body">
            {renderContent()}
          </div>
        </div>

        <Dialog
          open={sellDialogOpen}
          onClose={() => setSellDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>出售资产份额</DialogTitle>
          <DialogContent>
            {sellError && (
              <Alert severity="error" variant="filled" style={{ marginBottom: 16 }}
                onClose={() => setSellError('')}>
                {sellError}
              </Alert>
            )}
            {selectedAsset && (
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  资产名称: {selectedAsset.file_name}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  当前持有份额: {selectedAsset.weight}%
                </Typography>
                <TextField
                  margin="dense"
                  label="出售份额 (%)"
                  type="number"
                  fullWidth
                  value={sellPercentage}
                  onChange={(e) => setSellPercentage(e.target.value)}
                  inputProps={{ min: 1, max: selectedAsset.weight, step: 1 }}
                  error={!!sellError && (sellError.includes('份额') || sellError.includes('整数'))}
                  helperText={sellError && (sellError.includes('份额') || sellError.includes('整数')) ? sellError : ''} />
                <TextField
                  margin="dense"
                  label="出售单价"
                  type="number"
                  fullWidth
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  inputProps={{ min: 0.01, step: 0.01 }}
                  error={!!sellError && sellError.includes('单价')}
                />
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSellDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSellSubmit} color="primary">
              确认出售
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={purchaseDialogOpen}
          onClose={() => setPurchaseDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>购买资产份额</DialogTitle>
          <DialogContent>
            {selectedAsset && (
              <div>
                <Typography variant="subtitle2" gutterBottom>
                  单价: {selectedAsset.price} 代币
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  可购份额: {selectedAsset.weight}%
                </Typography>
                <TextField
                  margin="dense"
                  label="购买份额 (%)"
                  type="number"
                  fullWidth
                  value={purchasePercentage}
                  onChange={(e) => setPurchasePercentage(e.target.value)}
                  inputProps={{ min: 1, max: selectedAsset.weight, step: 1 }}
                  error={!!purchaseError}
                  helperText={purchaseError}
                />
                <Typography variant="subtitle2" style={{ marginTop: 16 }}>
                  预计总价: {purchasePercentage ? (parseFloat(purchasePercentage) * selectedAsset.price).toFixed(2) : 0} 代币
                </Typography>
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPurchaseDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handlePurchaseSubmit} color="primary">
              确认购买
            </Button>
          </DialogActions>
        </Dialog>

        {/* 图片预览模态框 */}
        {isModalOpen && selectedImage && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              cursor: 'pointer'
            }}
            onClick={closeModal}
          >
            <div
              className="modal-content"
              style={{
                position: 'relative',
                maxWidth: '95%',
                maxHeight: '95%',
                cursor: 'default'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close-button"
                style={{
                  position: 'absolute',
                  top: -40,
                  right: 0,
                  color: 'white',
                  backgroundColor: '#f44336',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  padding: '5px 10px'
                }}
                onClick={closeModal}
              >
                ×
              </button>
              <img
                src={selectedImage}
                alt="放大图片"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '4px',
                  objectFit: 'contain'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;