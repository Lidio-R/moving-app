import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getUserInfo } from "../../api/client";
import "./profile.scss";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(!!Taro.getStorageSync("token"));

  useEffect(() => {
    if (!isLogin) return;
    getUserInfo()
      .then(setUser)
      .catch(() => {
        Taro.removeStorageSync("token");
        setIsLogin(false);
      });
  }, [isLogin]);

  const handleLogin = () => {
    Taro.reLaunch({ url: "/pages/index/index" });
  };

  const handleLogout = () => {
    Taro.removeStorageSync("token");
    Taro.removeStorageSync("user");
    setIsLogin(false);
    setUser(null);
    Taro.showToast({ title: "已退出", icon: "success" });
  };

  const goOrders = () => {
    if (!isLogin) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    Taro.navigateTo({ url: "/pages/my-orders/my-orders" });
  };

  const goCoupons = () => {
    if (!isLogin) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    Taro.navigateTo({ url: "/pages/coupons/coupons" });
  };

  return (
    <View className="page-profile">
      {/* 头像区域 */}
      <View className="profile-header">
        {isLogin && user ? (
          <>
            <View className="avatar">
              <Text className="avatar-text">
                {(user.name || user.phone)?.[0]?.toUpperCase?.() || "U"}
              </Text>
            </View>
            <Text className="nickname">{user.name || user.phone}</Text>
            <Text className="phone">{user.phone}</Text>
          </>
        ) : (
          <>
            <View className="avatar">
              <Text className="avatar-text">?</Text>
            </View>
            <Text className="nickname">未登录</Text>
            <View className="login-btn" onClick={handleLogin}>
              <Text>点击登录</Text>
            </View>
          </>
        )}
      </View>

      {/* 菜单 */}
      <View className="menu-section">
        <View className="menu-item" onClick={goOrders}>
          <Text className="menu-icon">📋</Text>
          <Text className="menu-text">我的订单</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={goCoupons}>
          <Text className="menu-icon">🎫</Text>
          <Text className="menu-text">优惠券</Text>
          <Text className="menu-arrow">›</Text>
        </View>
      </View>

      <View className="menu-section">
        <View className="menu-item">
          <Text className="menu-icon">📖</Text>
          <Text className="menu-text">收费标准说明</Text>
          <Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item">
          <Text className="menu-icon">📞</Text>
          <Text className="menu-text">联系客服</Text>
          <Text className="menu-arrow">›</Text>
        </View>
      </View>

      {/* 退出 */}
      {isLogin && (
        <View className="logout-btn" onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      )}

      <Text className="version-text">搬家服务 v1.0.0</Text>
    </View>
  );
}
