import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { request } from "../../api/client";
import "./coupons.scss";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Taro.getStorageSync("token");
    if (!token) {
      Taro.showToast({ title: "请先登录", icon: "none" });
      setLoading(false);
      return;
    }
    request<any[]>("/admin/coupons")
      .then((res) => setCoupons(res || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="page-coupons">
      {loading ? (
        <View className="empty-box">
          <Text>加载中...</Text>
        </View>
      ) : coupons.length === 0 ? (
        <View className="empty-box">
          <Text className="empty-icon">🎫</Text>
          <Text className="empty-text">暂无可用优惠券</Text>
        </View>
      ) : (
        <View className="coupon-list">
          {coupons.map((c) => (
            <View key={c.id} className="coupon-item">
              <View className="c-left">
                <Text className="c-value">
                  {c.discount_type === "percent" ? `${c.discount_value}折` : `¥${c.discount_value}`}
                </Text>
                <Text className="c-cond">
                  {c.min_order_amount > 0 ? `满¥${c.min_order_amount}可用` : "无门槛"}
                </Text>
              </View>
              <View className="c-right">
                <Text className="c-code">兑换码：{c.code}</Text>
                <Text className="c-date">
                  有效期：{c.valid_from?.slice(0, 10)} ~ {c.valid_to?.slice(0, 10)}
                </Text>
                <Text className="c-limit">已用 {c.used_count}/{c.usage_limit}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
