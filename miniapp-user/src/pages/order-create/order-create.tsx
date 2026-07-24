import { useState, useEffect, useMemo } from "react";
import { View, Text, Input, Textarea, Picker } from "@tarojs/components";
import Taro, { useRouter } from "@tarojs/taro";
import { createOrder, calculatePrice, getVehicles } from "../../api/client";
import "./order-create.scss";

export default function OrderCreatePage() {
  const router = useRouter();
  const queryData = router.params.data;

  // 从首页传来的参数
  const initData = useMemo(() => {
    try {
      return queryData ? JSON.parse(decodeURIComponent(queryData)) : {};
    } catch {
      return {};
    }
  }, [queryData]);

  const [pickupAddr, setPickupAddr] = useState(initData.pickupAddr || "");
  const [dropoffAddr, setDropoffAddr] = useState(initData.dropoffAddr || "");
  const [distance] = useState(initData.distance || 5);
  const [vehicleId, setVehicleId] = useState<number | null>(initData.vehicleId || null);
  const [pickupFloor] = useState(initData.pickupFloor || 1);
  const [pickupElevator] = useState(initData.pickupElevator ?? true);
  const [dropoffFloor] = useState(initData.dropoffFloor || 1);
  const [dropoffElevator] = useState(initData.dropoffElevator ?? true);
  const [largeItemIds] = useState<number[]>(initData.largeItemIds || []);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [priceDetail, setPriceDetail] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // 表单
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [remark, setRemark] = useState("");
  const [couponCode, setCouponCode] = useState("");

  // 时间选择
  const [timeType, setTimeType] = useState<"now" | "schedule">("now");

  const timeOptions = useMemo(() => {
    const now = new Date();
    const items: string[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      for (let h = 8; h <= 20; h += 2) {
        const label = `${date.getMonth() + 1}月${date.getDate()}日 ${String(h).padStart(2, "0")}:00`;
        items.push(label);
      }
    }
    return items;
  }, []);

  useEffect(() => {
    getVehicles().then(setVehicles).catch(console.error);
  }, []);

  // 计价
  useEffect(() => {
    if (!vehicleId) return;
    calculatePrice({
      vehicle_type_id: vehicleId,
      distance_km: distance,
      pickup_floor: pickupFloor,
      pickup_has_elevator: pickupElevator,
      dropoff_floor: dropoffFloor,
      dropoff_has_elevator: dropoffElevator,
      large_item_ids: largeItemIds,
      coupon_code: couponCode || undefined,
    })
      .then(setPriceDetail)
      .catch(() => {});
  }, [vehicleId, couponCode]);

  // 提交下单
  const handleSubmit = async () => {
    if (!contactName || !contactPhone) {
      Taro.showToast({ title: "请填写联系信息", icon: "none" });
      return;
    }
    if (!pickupAddr || !dropoffAddr) {
      Taro.showToast({ title: "请选择地址", icon: "none" });
      return;
    }
    if (!vehicleId) {
      Taro.showToast({ title: "请选择车型", icon: "none" });
      return;
    }
    setSubmitting(true);
    try {
      const order = await createOrder({
        pickup_address: pickupAddr,
        dropoff_address: dropoffAddr,
        distance_km: distance,
        vehicle_type_id: vehicleId,
        pickup_floor: pickupFloor,
        pickup_has_elevator: pickupElevator,
        dropoff_floor: dropoffFloor,
        dropoff_has_elevator: dropoffElevator,
        large_item_ids: largeItemIds,
        coupon_code: couponCode || undefined,
        scheduled_time: timeType === "schedule" ? scheduledTime : undefined,
        contact_name: contactName,
        contact_phone: contactPhone,
        remark: remark || undefined,
      });
      Taro.showToast({ title: "下单成功", icon: "success" });
      setTimeout(() => {
        Taro.redirectTo({ url: `/pages/order-detail/order-detail?id=${order.id}` });
      }, 1000);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "下单失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const selectedVehicleName =
    vehicles.find((v) => v.id === vehicleId)?.name || "未选择";

  return (
    <View className="page-order-create">
      {/* 订单概要 */}
      <View className="card summary-card">
        <View className="summary-row">
          <Text className="s-label">出发</Text>
          <Text className="s-val">{pickupAddr || "未选择"}</Text>
        </View>
        <View className="summary-row">
          <Text className="s-label">到达</Text>
          <Text className="s-val">{dropoffAddr || "未选择"}</Text>
        </View>
        <View className="summary-row">
          <Text className="s-label">车型</Text>
          <Text className="s-val">{selectedVehicleName}</Text>
        </View>
        <View className="summary-row">
          <Text className="s-label">距离</Text>
          <Text className="s-val">约 {distance} 公里</Text>
        </View>
      </View>

      {/* 联系信息 */}
      <View className="card">
        <Text className="card-title">联系人信息</Text>
        <Input
          className="form-input"
          placeholder="联系人姓名"
          value={contactName}
          onInput={(e) => setContactName(e.detail.value)}
        />
        <Input
          className="form-input"
          placeholder="联系电话"
          type="number"
          value={contactPhone}
          onInput={(e) => setContactPhone(e.detail.value)}
        />
      </View>

      {/* 服务时间 */}
      <View className="card">
        <Text className="card-title">服务时间</Text>
        <View className="time-type">
          <View
            className={`time-opt ${timeType === "now" ? "active" : ""}`}
            onClick={() => setTimeType("now")}
          >
            <Text>尽快出发</Text>
          </View>
          <View
            className={`time-opt ${timeType === "schedule" ? "active" : ""}`}
            onClick={() => setTimeType("schedule")}
          >
            <Text>预约时间</Text>
          </View>
        </View>
        {timeType === "schedule" && (
          <Picker
            mode="selector"
            range={timeOptions}
            onChange={(e) => setScheduledTime(timeOptions[Number(e.detail.value)])}
          >
            <View className="picker-display">
              <Text>{scheduledTime || "请选择预约时间"}</Text>
            </View>
          </Picker>
        )}
      </View>

      {/* 优惠券 */}
      <View className="card">
        <Text className="card-title">优惠券</Text>
        <Input
          className="form-input"
          placeholder="输入优惠券码（可选）"
          value={couponCode}
          onInput={(e) => setCouponCode(e.detail.value)}
        />
      </View>

      {/* 备注 */}
      <View className="card">
        <Text className="card-title">备注（可选）</Text>
        <Textarea
          className="form-textarea"
          placeholder="如有额外说明请填写..."
          value={remark}
          onInput={(e) => setRemark(e.detail.value)}
        />
      </View>

      {/* 费用明细 */}
      {priceDetail && (
        <View className="card">
          <Text className="card-title">费用明细</Text>
          {priceDetail.breakdown?.map((item: any, i: number) => (
            <View key={i} className="price-row">
              <Text className="p-label">{item.label}</Text>
              <Text className="p-val">¥{item.amount}</Text>
            </View>
          ))}
          <View className="price-row total">
            <Text className="p-label">应付总额</Text>
            <Text className="p-val">¥{priceDetail.total_price}</Text>
          </View>
        </View>
      )}

      {/* 底部提交 */}
      <View className="bottom-bar">
        {priceDetail && (
          <View className="total-info">
            <Text className="total-text">合计</Text>
            <Text className="total-price">¥{priceDetail.total_price}</Text>
          </View>
        )}
        <View
          className={`submit-btn ${submitting ? "disabled" : ""}`}
          onClick={submitting ? undefined : handleSubmit}
        >
          <Text>{submitting ? "提交中..." : "确认下单"}</Text>
        </View>
      </View>
    </View>
  );
}
