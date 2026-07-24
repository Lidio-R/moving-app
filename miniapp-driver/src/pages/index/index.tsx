import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getDriverMe, toggleOnline, getAvailableOrders, acceptOrder, getDriverOrders } from "../../api/client";
import "./index.scss";

export default function DriverIndexPage() {
  const [driver, setDriver] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [tab, setTab] = useState<"pool" | "mine">("pool");

  const fetchData = useCallback(async () => {
    // 没登录就不调接口，避免401刷屏
    if (!Taro.getStorageSync("token")) return;
    try {
      const d = await getDriverMe();
      setDriver(d);
      setIsOnline(d.is_online);
    } catch (e) {
      // 未入驻
    }
    try {
      const orders = await getAvailableOrders();
      setAvailableOrders(orders || []);
    } catch {}
    try {
      const mine = await getDriverOrders();
      setMyOrders(mine || []);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggleOnline = async () => {
    try {
      await toggleOnline();
      setIsOnline(!isOnline);
      Taro.showToast({ title: isOnline ? "已离线" : "已上线", icon: "success" });
      fetchData();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "操作失败", icon: "none" });
    }
  };

  const handleAccept = async (orderId: number) => {
    try {
      await acceptOrder(orderId);
      Taro.showToast({ title: "接单成功", icon: "success" });
      fetchData();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "接单失败", icon: "none" });
    }
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "待接单", accepted: "已接单", driver_heading: "前往中",
    loading: "装货中", in_transit: "运输中", unloading: "卸货中",
    completed: "已完成", cancelled: "已取消",
  };

  // 未入驻
  if (!driver) {
    return (
      <View className="page-driver-index">
        <View className="hero">
          <Text className="hero-title">搬家司机端</Text>
          <Text className="hero-sub">加入我们，接单赚钱</Text>
        </View>
        <View className="card center-card">
          <Text className="empty-icon">🚛</Text>
          <Text className="empty-title">您还未入驻</Text>
          <Text className="empty-desc">完成实名认证和车辆信息提交即可开始接单</Text>
          <View className="btn-primary" onClick={() => Taro.navigateTo({ url: "/pages/apply/apply" })}>
            <Text>立即入驻</Text>
          </View>
        </View>
      </View>
    );
  }

  // 审核中
  if (driver.status === "pending") {
    return (
      <View className="page-driver-index">
        <View className="hero"><Text className="hero-title">搬家司机端</Text></View>
        <View className="card center-card">
          <Text className="empty-icon">⏳</Text>
          <Text className="empty-title">审核中</Text>
          <Text className="empty-desc">您的入驻资料已提交，请耐心等待管理员审核</Text>
        </View>
      </View>
    );
  }

  if (driver.status !== "approved") {
    return (
      <View className="page-driver-index">
        <View className="hero"><Text className="hero-title">搬家司机端</Text></View>
        <View className="card center-card">
          <Text className="empty-icon">❌</Text>
          <Text className="empty-title">账号异常</Text>
          <Text className="empty-desc">状态：{driver.status}，请联系客服</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page-driver-index">
      {/* 上线状态 */}
      <View className="online-bar">
        <View className="online-info">
          <Text className="online-status">{isOnline ? "🟢 在线接单中" : "🔴 已离线"}</Text>
          <Text className="online-income">今日收入 ¥{driver.wallet?.available_balance || 0}</Text>
        </View>
        <View className={`toggle-btn ${isOnline ? "on" : "off"}`} onClick={handleToggleOnline}>
          <Text>{isOnline ? "离线" : "上线"}</Text>
        </View>
      </View>

      {/* Tab 切换 */}
      <View className="tabs">
        <View className={`tab-item ${tab === "pool" ? "active" : ""}`} onClick={() => setTab("pool")}>
          <Text>抢单池 ({availableOrders.length})</Text>
        </View>
        <View className={`tab-item ${tab === "mine" ? "active" : ""}`} onClick={() => setTab("mine")}>
          <Text>我的订单 ({myOrders.length})</Text>
        </View>
      </View>

      {/* 抢单池 */}
      {tab === "pool" && (
        <ScrollView scrollY className="order-scroll">
          {availableOrders.length === 0 ? (
            <View className="empty-state"><Text className="empty-text">暂无待抢订单</Text></View>
          ) : (
            availableOrders.map((o) => (
              <View key={o.id} className="order-card">
                <View className="oc-header">
                  <Text className="oc-price">¥{o.total_price}</Text>
                  <Text className="oc-distance">约{o.distance_km}km</Text>
                </View>
                <View className="oc-addr">
                  <View className="oc-dot pickup" />
                  <Text className="oc-text">{o.pickup_address}</Text>
                </View>
                <View className="oc-addr">
                  <View className="oc-dot dropoff" />
                  <Text className="oc-text">{o.dropoff_address}</Text>
                </View>
                <View className="oc-footer">
                  <Text className="oc-info">{o.vehicle_type?.name} · {o.pickup_floor}楼{(o.pickup_has_elevator ? "有电梯" : "无电梯")}</Text>
                  <View className="btn-accept" onClick={() => handleAccept(o.id)}>
                    <Text>抢单</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 我的订单 */}
      {tab === "mine" && (
        <ScrollView scrollY className="order-scroll">
          {myOrders.length === 0 ? (
            <View className="empty-state"><Text className="empty-text">暂无订单</Text></View>
          ) : (
            myOrders.map((o) => (
              <View key={o.id} className="order-card" onClick={() => Taro.navigateTo({ url: `/pages/order-detail/order-detail?id=${o.id}` })}>
                <View className="oc-header">
                  <Text className="oc-price">¥{o.total_price}</Text>
                  <Text className="oc-status">{STATUS_LABELS[o.status] || o.status}</Text>
                </View>
                <View className="oc-addr">
                  <View className="oc-dot pickup" />
                  <Text className="oc-text">{o.pickup_address}</Text>
                </View>
                <View className="oc-addr">
                  <View className="oc-dot dropoff" />
                  <Text className="oc-text">{o.dropoff_address}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 底部导航 */}
      <View className="driver-tabbar">
        <View className="tbitem active"><Text>🏠</Text><Text className="tblabel">接单</Text></View>
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/wallet/wallet" })}><Text>💰</Text><Text className="tblabel">钱包</Text></View>
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/profile/profile" })}><Text>👤</Text><Text className="tblabel">我的</Text></View>
      </View>
    </View>
  );
}
