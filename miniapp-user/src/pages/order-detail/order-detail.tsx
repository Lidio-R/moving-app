import { useState, useEffect, useCallback } from "react";
import { View, Text, Textarea } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { getOrderDetail, payOrder, cancelOrder, reviewOrder } from "../../api/client";
import "./order-detail.scss";

// 订单状态映射
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待接单", color: "#faad14" },
  accepted: { label: "已接单", color: "#1677ff" },
  driver_heading: { label: "司机前往中", color: "#1677ff" },
  loading: { label: "装货中", color: "#1677ff" },
  in_transit: { label: "运输中", color: "#1677ff" },
  unloading: { label: "卸货中", color: "#1677ff" },
  completed: { label: "已完成", color: "#52c41a" },
  cancelled: { label: "已取消", color: "#999" },
};

export default function OrderDetailPage() {
  const router = useRouter();
  const { id } = router.params;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 取消弹窗
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // 评价弹窗
  const [showReview, setShowReview] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getOrderDetail(Number(id));
      setOrder(res);
    } catch (e: any) {
      Taro.showToast({ title: "加载失败", icon: "none" });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // 支付
  const handlePay = async () => {
    try {
      await payOrder(order.id);
      Taro.showToast({ title: "支付成功", icon: "success" });
      fetchOrder();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "支付失败", icon: "none" });
    }
  };

  // 取消订单
  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      Taro.showToast({ title: "请填写取消原因", icon: "none" });
      return;
    }
    try {
      await cancelOrder(order.id, cancelReason);
      Taro.showToast({ title: "已取消", icon: "success" });
      setShowCancel(false);
      fetchOrder();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "取消失败", icon: "none" });
    }
  };

  // 评价
  const handleReview = async () => {
    try {
      await reviewOrder(order.id, { rating, review_comment: reviewComment || undefined });
      Taro.showToast({ title: "评价成功", icon: "success" });
      setShowReview(false);
      fetchOrder();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "评价失败", icon: "none" });
    }
  };

  if (loading) {
    return (
      <View className="page-detail">
        <View className="loading-box">
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className="page-detail">
        <View className="loading-box">
          <Text>订单不存在</Text>
        </View>
      </View>
    );
  }

  const statusInfo = STATUS_MAP[order.status] || { label: order.status, color: "#999" };

  return (
    <View className="page-detail">
      {/* 状态头部 */}
      <View className="status-header" style={{ background: statusInfo.color }}>
        <Text className="status-label">{statusInfo.label}</Text>
        <Text className="order-no">{order.order_no}</Text>
      </View>

      {/* 地址信息 */}
      <View className="card">
        <View className="addr-item">
          <View className="addr-dot pickup" />
          <Text className="addr-text">{order.pickup_address}</Text>
        </View>
        <View className="addr-line-wrap">
          <Text className="addr-line-text">约 {order.distance_km} 公里</Text>
        </View>
        <View className="addr-item">
          <View className="addr-dot dropoff" />
          <Text className="addr-text">{order.dropoff_address}</Text>
        </View>
      </View>

      {/* 司机信息 */}
      {order.driver && (
        <View className="card">
          <Text className="card-title">司机信息</Text>
          <View className="info-row">
            <Text className="info-label">姓名</Text>
            <Text className="info-val">{order.driver.real_name || order.driver.user?.name}</Text>
          </View>
          <View className="info-row">
            <Text className="info-label">车牌</Text>
            <Text className="info-val">{order.driver.vehicle_license_no || "-"}</Text>
          </View>
        </View>
      )}

      {/* 订单详情 */}
      <View className="card">
        <Text className="card-title">订单详情</Text>
        <View className="info-row">
          <Text className="info-label">订单编号</Text>
          <Text className="info-val">{order.order_no}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">服务车型</Text>
          <Text className="info-val">{order.vehicle_type?.name || "-"}</Text>
        </View>
        <View className="info-row">
          <Text className="info-label">搬出楼层</Text>
          <Text className="info-val">
            {order.pickup_floor}层{order.pickup_has_elevator ? "(有电梯)" : "(无电梯)"}
          </Text>
        </View>
        <View className="info-row">
          <Text className="info-label">搬入楼层</Text>
          <Text className="info-val">
            {order.dropoff_floor}层{order.dropoff_has_elevator ? "(有电梯)" : "(无电梯)"}
          </Text>
        </View>
        <View className="info-row">
          <Text className="info-label">下单时间</Text>
          <Text className="info-val">{order.created_at}</Text>
        </View>
        {order.completed_at && (
          <View className="info-row">
            <Text className="info-label">完成时间</Text>
            <Text className="info-val">{order.completed_at}</Text>
          </View>
        )}
      </View>

      {/* 费用明细 */}
      <View className="card">
        <Text className="card-title">费用明细</Text>
        {order.price_breakdown && typeof order.price_breakdown === "object" && (
          <>
            {Array.isArray(order.price_breakdown.breakdown)
              ? order.price_breakdown.breakdown.map((item: any, i: number) => (
                  <View key={i} className="info-row">
                    <Text className="info-label">{item.label}</Text>
                    <Text className="info-val">¥{item.amount}</Text>
                  </View>
                ))
              : Object.entries(order.price_breakdown).map(([k, v]) => (
                  <View key={k} className="info-row">
                    <Text className="info-label">{k}</Text>
                    <Text className="info-val">¥{String(v)}</Text>
                  </View>
                ))}
          </>
        )}
        <View className="info-row total">
          <Text className="info-label">总计</Text>
          <Text className="info-val price">¥{order.total_price}</Text>
        </View>
      </View>

      {/* 评价展示 */}
      {order.rating > 0 && (
        <View className="card">
          <Text className="card-title">我的评价</Text>
          <View className="stars-row">
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} className="star">{s <= order.rating ? "⭐" : "☆"}</Text>
            ))}
          </View>
          {order.review_comment && (
            <Text className="review-text">{order.review_comment}</Text>
          )}
        </View>
      )}

      {/* 操作按钮 */}
      <View className="action-bar">
        {order.status === "pending" && order.payment_status === "unpaid" && (
          <>
            <View className="btn-outline" onClick={handlePay}>
              <Text>去支付 ¥{order.total_price}</Text>
            </View>
            <View className="btn-ghost" onClick={() => setShowCancel(true)}>
              <Text>取消订单</Text>
            </View>
          </>
        )}
        {order.status === "pending" && order.payment_status === "paid" && (
          <View className="btn-ghost" onClick={() => setShowCancel(true)}>
            <Text>取消订单</Text>
          </View>
        )}
        {order.status === "completed" && order.rating === 0 && (
          <View className="btn-outline" onClick={() => setShowReview(true)}>
            <Text>评价订单</Text>
          </View>
        )}
      </View>

      {/* 取消弹窗 */}
      {showCancel && (
        <View className="modal-overlay" onClick={() => setShowCancel(false)}>
          <View className="modal-box" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">取消订单</Text>
            <Textarea
              className="modal-textarea"
              placeholder="请填写取消原因"
              value={cancelReason}
              onInput={(e) => setCancelReason(e.detail.value)}
            />
            <View className="modal-btns">
              <View className="mbtn-cancel" onClick={() => setShowCancel(false)}>
                <Text>再想想</Text>
              </View>
              <View className="mbtn-confirm" onClick={handleCancel}>
                <Text>确认取消</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 评价弹窗 */}
      {showReview && (
        <View className="modal-overlay" onClick={() => setShowReview(false)}>
          <View className="modal-box" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">评价订单</Text>
            <View className="stars-row rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <Text
                  key={s}
                  className="star big"
                  onClick={() => setRating(s)}
                >
                  {s <= rating ? "⭐" : "☆"}
                </Text>
              ))}
            </View>
            <Textarea
              className="modal-textarea"
              placeholder="说说你的体验（可选）"
              value={reviewComment}
              onInput={(e) => setReviewComment(e.detail.value)}
            />
            <View className="modal-btns">
              <View className="mbtn-cancel" onClick={() => setShowReview(false)}>
                <Text>稍后再说</Text>
              </View>
              <View className="mbtn-confirm" onClick={handleReview}>
                <Text>提交评价</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
