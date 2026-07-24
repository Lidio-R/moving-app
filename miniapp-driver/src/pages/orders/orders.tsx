import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getDriverOrders } from "../../api/client";
import "./orders.scss";

const STATUS_LABELS: Record<string, string> = {
  pending: "待接单", accepted: "已接单", driver_heading: "前往中", loading: "装货中",
  in_transit: "运输中", unloading: "卸货中", completed: "已完成", cancelled: "已取消",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDriverOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const goDetail = (id: number) => Taro.navigateTo({ url: `/pages/order-detail/order-detail?id=${id}` });

  return (
    <View className="page-orders">
      {loading ? (
        <View className="empty"><Text>加载中...</Text></View>
      ) : orders.length === 0 ? (
        <View className="empty"><Text className="empty-icon">📭</Text><Text className="empty-text">暂无订单</Text></View>
      ) : (
        orders.map((o) => (
          <View key={o.id} className="order-card" onClick={() => goDetail(o.id)}>
            <View className="oc-header">
              <Text className="oc-price">¥{o.total_price}</Text>
              <Text className="oc-status">{STATUS_LABELS[o.status] || o.status}</Text>
            </View>
            <View className="oc-addr"><View className="oc-dot pickup" /><Text className="oc-text">{o.pickup_address}</Text></View>
            <View className="oc-addr"><View className="oc-dot dropoff" /><Text className="oc-text">{o.dropoff_address}</Text></View>
            <View className="oc-footer">
              <Text className="oc-time">{o.created_at?.slice(0, 16)}</Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}
