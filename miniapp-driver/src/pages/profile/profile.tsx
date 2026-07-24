import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getDriverMe, userLogin } from "../../api/client";
import "./profile.scss";

export default function DriverProfilePage() {
  const [driver, setDriver] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(!!Taro.getStorageSync("token"));
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  useEffect(() => {
    if (!isLogin) return;
    getDriverMe().then(setDriver).catch(() => {});
  }, [isLogin]);

  const handleLogin = async () => {
    try {
      const res = await userLogin({ phone: loginPhone, password: loginPwd });
      Taro.setStorageSync("token", res.access_token);
      Taro.setStorageSync("user", JSON.stringify(res.user));
      setIsLogin(true);
      setShowLogin(false);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "登录失败", icon: "none" });
    }
  };

  const handleLogout = () => {
    Taro.removeStorageSync("token");
    setIsLogin(false);
    setDriver(null);
  };

  return (
    <View className="page-profile">
      <View className="profile-header">
        {isLogin ? (
          <>
            <View className="avatar"><Text className="avatar-text">D</Text></View>
            <Text className="nickname">{driver?.real_name || "司机"}</Text>
            <Text className="phone">状态：{driver?.status === "approved" ? "已认证" : driver?.status || "-"}</Text>
          </>
        ) : (
          <>
            <View className="avatar"><Text className="avatar-text">?</Text></View>
            <Text className="nickname">未登录</Text>
            <View className="login-btn-mini" onClick={() => setShowLogin(true)}><Text>点击登录</Text></View>
          </>
        )}
      </View>

      <View className="menu-section">
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: "/pages/apply/apply" })}>
          <Text className="menu-icon">📝</Text><Text className="menu-text">入驻资料</Text><Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: "/pages/wallet/wallet" })}>
          <Text className="menu-icon">💰</Text><Text className="menu-text">我的钱包</Text><Text className="menu-arrow">›</Text>
        </View>
        <View className="menu-item" onClick={() => Taro.navigateTo({ url: "/pages/withdrawals/withdrawals" })}>
          <Text className="menu-icon">📋</Text><Text className="menu-text">提现记录</Text><Text className="menu-arrow">›</Text>
        </View>
      </View>

      {isLogin && (
        <View className="logout-btn" onClick={handleLogout}><Text>退出登录</Text></View>
      )}

      {/* 登录弹窗 */}
      {showLogin && (
        <View className="modal-overlay" onClick={() => setShowLogin(false)}>
          <View className="modal-login" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">司机登录</Text>
            <Input className="modal-input" placeholder="手机号" value={loginPhone} onInput={(e) => setLoginPhone(e.detail.value)} />
            <Input className="modal-input" placeholder="密码" password value={loginPwd} onInput={(e) => setLoginPwd(e.detail.value)} />
            <View className="modal-btn" onClick={handleLogin}><Text>登录</Text></View>
          </View>
        </View>
      )}

      <View className="driver-tabbar">
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/index/index" })}><Text>🏠</Text><Text className="tblabel">接单</Text></View>
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/wallet/wallet" })}><Text>💰</Text><Text className="tblabel">钱包</Text></View>
        <View className="tbitem active"><Text>👤</Text><Text className="tblabel">我的</Text></View>
      </View>
    </View>
  );
}
