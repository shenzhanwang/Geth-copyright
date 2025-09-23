// 处理登录和注册的API交互

// API基础URL
export const API_BASE_URL = 'http://localhost:9527';

/**
 * 处理API请求的通用函数
 * @param {string} endpoint - API端点
 * @param {string} method - HTTP方法
 * @param {object} data - 请求数据
 * @returns {Promise} - 返回Promise对象
 */
export async function fetchAPI(endpoint, method, data = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    const options = {
      method,
      headers,
      credentials: 'include', // 包含cookies
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

/**
 * 用户注册
 * @param {string} password - 用户密码
 * @param {string} username - 用户名
 * @param {string} email - 用户邮箱
 * @returns {Promise} - 返回Promise对象，包含注册结果
 */
export async function registerUser(password, username = '', email = '') {
  const response = await fetchAPI('/register', 'POST', { identity_id: password, username, email });
  return response;
}

/**
 * 用户登录
 * @param {string} password - 用户密码
 * @param {string} username - 用户名
 * @returns {Promise} - 返回Promise对象，包含登录结果
 */
export async function loginUser(password, username = '') {
  const response = await fetchAPI('/login', 'POST', { identity_id: password, username });
  return response;
}

/**
 * 检查用户会话状态
 * @returns {Promise} - 返回Promise对象，包含会话状态
 */
export async function checkSession() {
  const response = await fetchAPI('/session', 'GET');
  return response;
}

/**
 * 退出登录
 * @returns {Promise} - 返回Promise对象
 */
export async function logoutUser() {
  // 这里可以添加清除本地存储的逻辑
  // 由于后端使用session cookie，前端只需要清除本地存储的用户信息
  localStorage.removeItem('userInfo');
}

/**
 * 保存用户信息到本地存储
 * @param {object} userInfo - 用户信息
 */
export function saveUserInfo(userInfo) {
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
}

/**
 * 从本地存储获取用户信息
 * @returns {object|null} - 用户信息或null
 */
export function getUserInfo() {
  const userInfo = localStorage.getItem('userInfo');
  return userInfo ? JSON.parse(userInfo) : null;
}

/**
 * 将WEI转换为ETH并保留两位小数
 * @param {string|number} weiValue - WEI单位的余额
 * @returns {string} - ETH单位的余额，保留两位小数
 */
function convertWeiToEth(weiValue) {
  // 1 ETH = 10^18 WEI
  const wei = BigInt(weiValue);
  const eth = Number(wei) / 1000000000000000000;
  return eth.toFixed(2);
}

/**
 * 获取以太坊余额
 * @returns {Promise} - 返回Promise对象，包含以太坊余额信息
 */
export async function getEthBalance() {
  const response = await fetchAPI('/balance', 'GET');
  // 检查响应结构，正确路径是response.data.balance
  if (response && typeof response === 'object' && response.data && 'balance' in response.data) {
    // 将WEI转换为ETH并保留两位小数
    const ethBalance = convertWeiToEth(response.data.balance);
    return { data: ethBalance };
  }
  // 兼容原有的响应格式
  return { data: '0.00' };
}

/**
 * 获取代币余额
 * @returns {Promise} - 返回Promise对象，包含代币余额信息
 */
export async function getTokenBalance() {
  const response = await fetchAPI('/token/balance', 'GET');
  // 检查响应结构，正确路径是response.data.balance
  if (response && typeof response === 'object' && response.data && 'balance' in response.data) {
    return { data: response.data.balance.toString() };
  }
  // 兼容原有的响应格式
  return { data: '0' };
}