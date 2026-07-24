import { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getMyOrders } from "../../api/client";
import "./my-orders.scss";

const STATUS_TABS = [
  { key: "", label: "全部" },
  { key: "pending", label: "待接单" },
  { key: "accepted", label: "进行中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const STATUS_LABELS: Record<string, string> = {
  pending: "待接单",
  accepted: "已接单",
  driver_heading: "司机前往中",
  loading: "装货中",
  in_transit: "运输中",
  unloading: "卸货中",
  completed: "已完成",
  cancelled: "已取消",
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeTab) params.status = activeTab;
      const res = await getMyOrders(params);
      setOrders(res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const token = Taro.getStorageSync("token");
    if (!token) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    fetchOrders();
  }, [fetchOrders]);

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });
  };

  const formatTime = (t: string) => {
    if (!t) return "";
    return t.slice(0, 16).replace("T", " ");
  };

  return (
    <View className="page-my-orders">
      {/* 状态筛选 */}
      <ScrollView scrollX className="tabs">
        {STATUS_TABS.map((tab) => (
          <View
            key={tab.key}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            <Text>{tab.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 订单列表 */}
      {loading ? (
        <View className="empty-box">
          <Text>加载中...</Text>
        </View>
      ) : orders.length === 0 ? (
        <View className="empty-box">
          <Text className="empty-icon">📭</Text>
          <Text className="empty-text">暂无订单</Text>
        </View>
      ) : (
        <View className="order-list">
          {orders.map((order) => (
            <View key={order.id} className="order-card" onClick={() => goDetail(order.id)}>
              <View className="oc-header">
                <Text className="oc-no">{order.order_no}</Text>
                <Text className="oc-status">{STATUS_LABELS[order.status] || order.status}</Text>
              </View>
              <View className="oc-body">
                <View className="oc-addr">
                  <View className="oc-dot pickup" />
                  <Text className="oc-text">{order.pickup_address}</Text>
                </View>
                <View className="oc-addr">
                  <View className="oc-dot dropoff" />
                  <Text className="oc-text">{order.dropoff_address}</Text>
                </View>
              </View>
              <View className="oc-footer">
                <Text className="oc-time">{formatTime(order.created_at)}</Text>
                <Text className="oc-price">¥{order.total_price}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
