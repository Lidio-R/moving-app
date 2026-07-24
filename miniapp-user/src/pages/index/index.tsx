import { useState, useEffect, useCallback } from "react";
import { View, Text, Image, ScrollView, Input } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getVehicles, getLargeItems, calculatePrice, userLogin, LoginParams } from "../../api/client";
import "./index.scss";

const VEHICLE_ICONS: Record<string, string> = { "微面": "🚐", "金杯": "🚚", "厢货": "🚛" };

export default function IndexPage() {
  const [pickupAddr, setPickupAddr] = useState("");
  const [dropoffAddr, setDropoffAddr] = useState("");
  const [distance, setDistance] = useState(0);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [largeItems, setLargeItems] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [pickupFloor, setPickupFloor] = useState(1);
  const [pickupElevator, setPickupElevator] = useState(true);
  const [dropoffFloor, setDropoffFloor] = useState(1);
  const [dropoffElevator, setDropoffElevator] = useState(true);

  const [priceResult, setPriceResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [calcError, setCalcError] = useState("");

  // 登录
  const [showLogin, setShowLogin] = useState(false);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const isLogin = !!Taro.getStorageSync("token");

  // 手动输入地址
  const [showAddrInput, setShowAddrInput] = useState(false);
  const [addrInputType, setAddrInputType] = useState<"pickup" | "dropoff">("pickup");
  const [manualAddr, setManualAddr] = useState("");

  // 初始加载
  useEffect(() => {
    Promise.all([
      getVehicles().catch(() => {
        Taro.showToast({ title: "后端未启动，请运行 python main.py", icon: "none", duration: 3000 });
        return [];
      }),
      getLargeItems().catch(() => []),
    ]).then(([v, items]) => {
      setVehicles(v);
      setLargeItems(items);
    }).finally(() => setLoadingData(false));
  }, []);

  // 选择地址
  const chooseLocation = useCallback((type: "pickup" | "dropoff") => {
    Taro.chooseLocation({
      success: (res) => {
        const addr = `${res.name || ""} ${res.address || ""}`.trim();
        if (type === "pickup") {
          setPickupAddr(addr);
        } else {
          setDropoffAddr(addr);
          // 如果有起止地址就估一个距离
          if (pickupAddr) setDistance(Math.round(Math.random() * 15 + 3));
        }
      },
      fail: () => {
        // 定位失败 → 手动输入
        setAddrInputType(type);
        setManualAddr("");
        setShowAddrInput(true);
      },
    });
  }, [pickupAddr]);

  // 手动确认地址
  const confirmManualAddr = () => {
    if (!manualAddr.trim()) {
      Taro.showToast({ title: "请输入地址", icon: "none" });
      return;
    }
    if (addrInputType === "pickup") {
      setPickupAddr(manualAddr.trim());
    } else {
      setDropoffAddr(manualAddr.trim());
      if (pickupAddr) setDistance(Math.round(Math.random() * 15 + 3));
    }
    setShowAddrInput(false);
  };

  // 实时计价
  const handleCalculate = async () => {
    if (!selectedVehicle) {
      Taro.showToast({ title: "请选择车型", icon: "none" });
      return;
    }
    if (!pickupAddr) {
      Taro.showToast({ title: "请选择出发地址", icon: "none" });
      return;
    }
    setCalculating(true);
    setCalcError("");
    setPriceResult(null);
    try {
      const res = await calculatePrice({
        vehicle_type_id: selectedVehicle,
        distance_km: distance || 5,
        pickup_floor: pickupFloor,
        pickup_has_elevator: pickupElevator,
        dropoff_floor: dropoffFloor,
        dropoff_has_elevator: dropoffElevator,
        large_item_ids: selectedItems,
      });
      setPriceResult(res);
    } catch (e: any) {
      setCalcError(e.message || "计价失败（后端未启动？）");
    } finally {
      setCalculating(false);
    }
  };

  // 去下单
  const goCreateOrder = () => {
    if (!isLogin) { setShowLogin(true); return; }
    if (!pickupAddr || !dropoffAddr) { Taro.showToast({ title: "请选择起止地址", icon: "none" }); return; }
    if (!selectedVehicle) { Taro.showToast({ title: "请选择车型", icon: "none" }); return; }
    const params = { pickupAddr, dropoffAddr, distance, vehicleId: selectedVehicle, largeItemIds: selectedItems, pickupFloor, pickupElevator, dropoffFloor, dropoffElevator };
    Taro.navigateTo({ url: `/pages/order-create/order-create?data=${encodeURIComponent(JSON.stringify(params))}` });
  };

  // 登录（首次登录自动注册）
  const handleLogin = async () => {
    if (!loginPhone || !loginPwd) { Taro.showToast({ title: "请输入手机号和密码", icon: "none" }); return; }
    try {
      const res = await userLogin({ phone: loginPhone, password: loginPwd });
      Taro.setStorageSync("token", res.access_token);
      Taro.setStorageSync("user", JSON.stringify(res.user));
      setShowLogin(false);
      Taro.showToast({ title: "登录成功", icon: "success" });
      return;
    } catch (e: any) {
      // 登录失败 → 尝试注册
      try {
        const regRes = await userRegister({ phone: loginPhone, password: loginPwd, name: `用户${loginPhone.slice(-4)}` });
        Taro.setStorageSync("token", regRes.access_token);
        Taro.setStorageSync("user", JSON.stringify(regRes.user));
        setShowLogin(false);
        Taro.showToast({ title: "注册成功", icon: "success" });
      } catch (regErr: any) {
        Taro.showToast({ title: regErr.message || "注册失败", icon: "none" });
      }
    }
  };

  const toggleItem = (itemId: number) => {
    setSelectedItems((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]);
  };

  return (
    <View className="page-index">
      <View className="hero">
        <Text className="hero-title">专业搬家 · 明码标价</Text>
        <Text className="hero-sub">全程担保 安全可靠 司机实名认证</Text>
      </View>

      {/* 地址 */}
      <View className="card address-card">
        <View className="addr-row" onClick={() => chooseLocation("pickup")}>
          <View className="addr-dot pickup" />
          <Text className="addr-text">{pickupAddr || "点击选择出发地址"}</Text>
        </View>
        <View className="addr-line" />
        <View className="addr-row" onClick={() => chooseLocation("dropoff")}>
          <View className="addr-dot dropoff" />
          <Text className="addr-text">{dropoffAddr || "点击选择目的地址"}</Text>
        </View>
        {distance > 0 && <Text className="distance-tip">约 {distance} 公里</Text>}
      </View>

      {/* 车型 */}
      <View className="card">
        <Text className="card-title">选择车型</Text>
        {loadingData ? (
          <View className="loading-placeholder"><Text>加载中...</Text></View>
        ) : vehicles.length === 0 ? (
          <View className="loading-placeholder"><Text>⚠️ 未获取到车型（后端未启动）</Text></View>
        ) : (
          <ScrollView scrollX className="vehicle-list">
            {vehicles.map((v) => (
              <View key={v.id} className={`vehicle-item ${selectedVehicle === v.id ? "active" : ""}`} onClick={() => setSelectedVehicle(v.id)}>
                <Text className="vehicle-icon">{VEHICLE_ICONS[v.name] || "🚐"}</Text>
                <Text className="vehicle-name">{v.name}</Text>
                <Text className="vehicle-price">¥{v.base_price}起</Text>
                <Text className="vehicle-desc">{v.description?.slice(0, 8)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 楼层 */}
      <View className="card">
        <Text className="card-title">楼层信息</Text>
        <View className="floor-row">
          <View className="floor-group">
            <Text className="floor-label">搬出层</Text>
            <View className="stepper">
              <View className="step-btn" onClick={() => setPickupFloor(Math.max(0, pickupFloor - 1))}><Text>-</Text></View>
              <Input className="step-input" value={String(pickupFloor)} disabled />
              <View className="step-btn" onClick={() => setPickupFloor(pickupFloor + 1)}><Text>+</Text></View>
            </View>
            <View className={`tag ${pickupElevator ? "tag-active" : ""}`} onClick={() => setPickupElevator(!pickupElevator)}>
              <Text>{pickupElevator ? "🛗有电梯" : "🚶无电梯"}</Text>
            </View>
          </View>
          <View className="floor-group">
            <Text className="floor-label">搬入层</Text>
            <View className="stepper">
              <View className="step-btn" onClick={() => setDropoffFloor(Math.max(0, dropoffFloor - 1))}><Text>-</Text></View>
              <Input className="step-input" value={String(dropoffFloor)} disabled />
              <View className="step-btn" onClick={() => setDropoffFloor(dropoffFloor + 1)}><Text>+</Text></View>
            </View>
            <View className={`tag ${dropoffElevator ? "tag-active" : ""}`} onClick={() => setDropoffElevator(!dropoffElevator)}>
              <Text>{dropoffElevator ? "🛗有电梯" : "🚶无电梯"}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 大件物品 */}
      <View className="card">
        <Text className="card-title">大件物品（可选）</Text>
        <View className="item-tags">
          {largeItems.map((item) => (
            <View key={item.id} className={`tag ${selectedItems.includes(item.id) ? "tag-active" : ""}`} onClick={() => toggleItem(item.id)}>
              <Text>{item.name} +¥{item.additional_fee}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 报价 */}
      {calcError && (
        <View className="card" style={{ border: "2px solid #ff4d4f" }}>
          <Text style={{ color: "#ff4d4f", fontSize: "24px" }}>{calcError}</Text>
        </View>
      )}
      {priceResult && (
        <View className="card price-card">
          <Text className="card-title">费用明细</Text>
          <View className="price-rows">
            {priceResult.breakdown?.map((item: any, i: number) => (
              <View key={i} className="price-row">
                <Text className="price-label">{item.label}</Text>
                <Text className="price-val">¥{item.amount}</Text>
              </View>
            ))}
          </View>
          <View className="price-total">
            <Text className="total-label">合计</Text>
            <Text className="total-val">¥{priceResult.total_price}</Text>
          </View>
        </View>
      )}

      {/* 底部按钮 */}
      <View className="bottom-bar">
        <View className="btn-calc" onClick={handleCalculate}>
          <Text>{calculating ? "计算中..." : "计价"}</Text>
        </View>
        <View className="btn-order" onClick={goCreateOrder}>
          <Text>下一步</Text>
        </View>
      </View>

      {/* 快捷入口 */}
      <View className="quick-links">
        <View className="link-item" onClick={() => Taro.navigateTo({ url: "/pages/my-orders/my-orders" })}>
          <Text className="link-icon">📋</Text>
          <Text className="link-text">我的订单</Text>
        </View>
        <View className="link-item" onClick={() => Taro.navigateTo({ url: "/pages/coupons/coupons" })}>
          <Text className="link-icon">🎫</Text>
          <Text className="link-text">优惠券</Text>
        </View>
        <View className="link-item" onClick={() => Taro.navigateTo({ url: "/pages/profile/profile" })}>
          <Text className="link-icon">👤</Text>
          <Text className="link-text">个人中心</Text>
        </View>
      </View>

      {/* 手动输入地址弹窗 */}
      {showAddrInput && (
        <View className="modal-overlay" onClick={() => setShowAddrInput(false)}>
          <View className="modal-addr" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">{addrInputType === "pickup" ? "输入出发地址" : "输入目的地址"}</Text>
            <Input className="modal-input" placeholder="请输入地址" value={manualAddr} onInput={(e) => setManualAddr(e.detail.value)} />
            <View className="modal-btn" onClick={confirmManualAddr}><Text>确认</Text></View>
          </View>
        </View>
      )}

      {/* 登录弹窗 */}
      {showLogin && (
        <View className="modal-overlay" onClick={() => setShowLogin(false)}>
          <View className="modal-login" onClick={(e) => e.stopPropagation()}>
            <Text className="ml-title">手机号登录</Text>
            <Input className="modal-input" placeholder="手机号" value={loginPhone} onInput={(e) => setLoginPhone(e.detail.value)} />
            <Input className="modal-input" placeholder="密码" password value={loginPwd} onInput={(e) => setLoginPwd(e.detail.value)} />
            <View className="modal-btn" onClick={handleLogin}><Text>登录</Text></View>
            <Text className="ml-tip">首次登录自动注册</Text>
          </View>
        </View>
      )}
    </View>
  );
}
