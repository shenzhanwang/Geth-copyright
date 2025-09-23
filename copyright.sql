/*
 Navicat Premium Data Transfer

 Source Server         : copyright
 Source Server Type    : MySQL
 Source Server Version : 80019
 Source Host           : localhost:3306
 Source Schema         : copyright

 Target Server Type    : MySQL
 Target Server Version : 80019
 File Encoding         : 65001

 Date: 20/09/2025 10:28:28
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for t_auction
-- ----------------------------
DROP TABLE IF EXISTS `t_auction`;
CREATE TABLE `t_auction`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片归属账户地址',
  `token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片Token ID',
  `weight` int(0) NOT NULL DEFAULT 0 COMMENT '拍卖百分比 (整数表示，如 50 表示 50%)',
  `price` int(0) NOT NULL DEFAULT 0 COMMENT '百分比单价 (单位：最小货币单位，如分)',
  `created_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_token_id`(`token_id`) USING BTREE,
  INDEX `idx_address`(`address`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '卖家商品列表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_auction
-- ----------------------------

-- ----------------------------
-- Table structure for t_auction_his
-- ----------------------------
DROP TABLE IF EXISTS `t_auction_his`;
CREATE TABLE `t_auction_his`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `buyer` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '拍卖者地址',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '卖家地址',
  `token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片Token ID',
  `weight` bigint(0) NOT NULL COMMENT '拍卖百分比 (历史记录，使用 BIGINT)',
  `price` bigint(0) NOT NULL COMMENT '百分比单价 (历史记录，使用 BIGINT)',
  `created_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_token_id`(`token_id`) USING BTREE,
  INDEX `idx_buyer`(`buyer`) USING BTREE,
  INDEX `idx_address`(`address`) USING BTREE,
  INDEX `idx_created_at`(`created_at`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '拍卖历史记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_auction_his
-- ----------------------------

-- ----------------------------
-- Table structure for t_content
-- ----------------------------
DROP TABLE IF EXISTS `t_content`;
CREATE TABLE `t_content`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '原图片名称',
  `content` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片保存路径',
  `content_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片内容哈希值',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片上传用户地址',
  `token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '图片Token ID',
  `created_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_token_id`(`token_id`) USING BTREE,
  INDEX `idx_address`(`address`) USING BTREE,
  INDEX `idx_content_hash`(`content_hash`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '数字资产（图片）信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_content
-- ----------------------------

-- ----------------------------
-- Table structure for t_equity_registration
-- ----------------------------
DROP TABLE IF EXISTS `t_equity_registration`;
CREATE TABLE `t_equity_registration`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT,
  `address` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资产所属人',
  `token_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资产id',
  `weight` int(0) NOT NULL COMMENT '份额，正数表示增加，负数表示扣除',
  `created_at` timestamp(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '权益登记表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_equity_registration
-- ----------------------------

-- ----------------------------
-- Table structure for t_user
-- ----------------------------
DROP TABLE IF EXISTS `t_user`;
CREATE TABLE `t_user`  (
  `id` bigint(0) UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱地址',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码 (建议存储哈希值)',
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户地址 (如钱包地址)',
  `created_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) COMMENT '创建时间',
  `updated_at` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0) COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_address`(`address`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户信息表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of t_user
-- ----------------------------
INSERT INTO `t_user` VALUES (1, '57948@qq.com', '1234', 'admin', '0xCE92C80928B5A0cB2d720fA58296519a9ED7e354', '2025-09-02 16:44:05', '2025-09-10 16:12:31');
INSERT INTO `t_user` VALUES (2, 'iuy@dc.com.cn', '1234', 'ly', '0xEb979D685624C6aFf5994EBA657FDfbfe26a3C67', '2025-09-03 14:04:55', '2025-09-11 13:39:48');
INSERT INTO `t_user` VALUES (3, 'angshenz@cc.com.cn', '1234', 'wsz', '0x4322D98A4ca72a18326A389E6dafA3dCd70260A5', '2025-09-03 14:05:20', '2025-09-11 13:39:52');
INSERT INTO `t_user` VALUES (4, '7642@qq.com', '1234', 'qwe', '0x409328C1598429d24f6e46B260A955E110c59E93', '2025-09-03 14:05:31', '2025-09-10 16:12:31');

SET FOREIGN_KEY_CHECKS = 1;
