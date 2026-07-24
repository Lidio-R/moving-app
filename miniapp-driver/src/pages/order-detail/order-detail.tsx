import { useState, useEffect, useCallback } from "react";
import { View, Text } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getOrderDetail, updateOrderStatus } from "../../api/client";
import "./order-detail.scss";

const STATUS_FLOW: { key: string; label: string; next?: string; nextLabel?: string }[] = [
  { key: "accepted", label: "已接单", next: "driver_heading", nextLabel: "出发前往" },
  { key: "driver_heading", label: "前往中", next: "loading", nextLabel: "到达装货地" },
  { key: "loading", label: "装货中", next: "in_transit", nextLabel: "出发运输" },
  { key: "in_transit", label: "运输中", next: "unloading", nextLabel: "到达卸货地" },
  { key: "unloading", label: "卸货中", next: "completed", nextLabel: "完成订单" },
];

export default function DriverOrderDetailPage() {
  const router = useRouter();
  const { id } = router.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setOrder(await getOrderDetail(Number(id)));
    } catch (e: any) {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleStatusChange = async (nextStatus: string) => {
    setActionLoading(true);
    try {
      await updateOrderStatus(order.id, nextStatus);
      Taro.showToast({ title: "状态已更新", icon: "success" });
      await fetchOrder();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "操作失败", icon: "none" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleNavigate = () => {
    // 跳转微信内置地图导航
    const lat = order.dropoff_lat || 22.543;
    const lng = order.dropoff_lng || 114.058;
    Taro.openLocation({
      latitude: lat, longitude: lng,
      name: order.dropoff_address, scale: 16,
      success: () => {},
      fail: () => Taro.showToast({ title: "导航功能需要真机", icon: "none" }),
    });
  };

  if (loading) return <View className="page-detail"><View className="loading-box"><Text>加载中...</Text></View></View>;
  if (!order) return <View className="page-detail"><View className="loading-box"><Text>订单不存在</Text></View></View>;

  const flowItem = STATUS_FLOW.find((f) => f.key === order.status);
  const canAdvance = !!flowItem?.next;

  return (
    <View className="page-detail">
      {/* 状态头部 */}
      <View className="status-header">
        <Text className="status-label">{flowItem?.label || order.status}</Text>
        <Text className="order-no">{order.order_no}</Text>
      </View>

      {/* 地址 */}
      <View className="card">
        <View className="addr-item"><View className="addr-dot pickup" /><Text className="addr-text">{order.pickup_address}</Text></View>
        <View className="addr-line-wrap"><Text className="addr-line-text">约 {order.distance_km} 公里</Text></View>
        <View className="addr-item"><View className="addr-dot dropoff" /><Text className="addr-text">{order.dropoff_address}</Text></View>
      </View>

      {/* 客户信息 */}
      <View className="card">
        <Text className="card-title">客户信息</Text>
        <View className="info-row"><Text className="info-label">联系人</Text><Text className="info-val">{order.contact_name || "-"}</Text></View>
        <View className="info-row"><Text className="info-label">电话</Text><Text className="info-val">{order.contact_phone || "-"}</Text></View>
      </View>

      {/* 订单详情 */}
      <View className="card">
        <Text className="card-title">服务详情</Text>
        <View className="info-row"><Text className="info-label">车型</Text><Text className="info-val">{order.vehicle_type?.name}</Text></View>
        <View className="info-row"><Text className="info-label">搬出</Text><Text className="info-val">{order.pickup_floor}层{order.pickup_has_elevator?"(有电梯)":"(无电梯)"}</Text></View>
        <View className="info-row"><Text className="info-label">搬入</Text><Text className="info-val">{order.dropoff_floor}层{order.dropoff_has_elevator?"(有电梯)":"(无电梯)"}</Text></View>
        <View className="info-row"><Text className="info-label">大件</Text><Text className="info-val">{order.large_items?.length ? order.large_items.join("、") : "无"}</Text></View>
        {order.remark && <View className="info-row"><Text className="info-label">备注</Text><Text className="info-val">{order.remark}</Text></View>}
      </View>

      {/* 费用 */}
      <View className="card">
        <Text className="card-title">费用</Text>
        <View className="info-row total"><Text className="info-label">订单总额</Text><Text className="info-val price">¥{order.total_price}</Text></View>
      </View>

      {/* 进度操作 */}
      {canAdvance && order.status !== "completed" && order.status !== "cancelled" && (
        <View className="action-bar">
          <View className="btn-nav" onClick={handleNavigate}>
            <Text>🧭 导航</Text>
          </View>
          <View className={`btn-next ${actionLoading ? "disabled" : ""}`} onClick={actionLoading ? undefined : () => handleStatusChange(flowItem!.next!)}>
            <Text>{actionLoading ? "处理中..." : flowItem!.nextLabel!}</Text>
          </View>
        </View>
      )}
    </View>
  );
}
