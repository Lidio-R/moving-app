import { useState, useEffect } from "react";
import { View, Text, Input, Picker } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { request, userLogin } from "../../api/client";
import "./apply.scss";

export default function ApplyPage() {
  // 登录状态
  const [isLogin, setIsLogin] = useState(!!Taro.getStorageSync("token"));
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPwd, setLoginPwd] = useState("");

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [realName, setRealName] = useState("");
  const [idCard, setIdCard] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehicleLicense, setVehicleLicense] = useState("");
  const [vehicleTypeId, setVehicleTypeId] = useState<number | null>(null);
  const [vehicleTypeName, setVehicleTypeName] = useState("请选择车型");
  const [submitting, setSubmitting] = useState(false);

  const [idCardPhotos, setIdCardPhotos] = useState<string[]>([]);
  const [licensePhotos, setLicensePhotos] = useState<string[]>([]);
  const [vehiclePhotos, setVehiclePhotos] = useState<string[]>([]);

  useEffect(() => {
    request<any[]>("/pricing/vehicles").then(setVehicles).catch(console.error);
  }, []);

  // 登录（首次登录自动注册）
  const handleLogin = async () => {
    if (!loginPhone || !loginPwd) { Taro.showToast({ title: "请输入手机号和密码", icon: "none" }); return; }
    try {
      const res = await userLogin({ phone: loginPhone, password: loginPwd });
      Taro.setStorageSync("token", res.access_token);
      Taro.setStorageSync("user", JSON.stringify(res.user));
      setIsLogin(true);
      Taro.showToast({ title: "登录成功", icon: "success" });
    } catch (e: any) {
      // 登录失败 → 自动注册
      try {
        const regRes = await request("/users/register", {
          method: "POST",
          data: { phone: loginPhone, password: loginPwd, name: `司机${loginPhone.slice(-4)}` },
        });
        Taro.setStorageSync("token", regRes.access_token);
        Taro.setStorageSync("user", JSON.stringify(regRes.user));
        setIsLogin(true);
        Taro.showToast({ title: "注册成功", icon: "success" });
      } catch (regErr: any) {
        Taro.showToast({ title: regErr.message || "注册失败", icon: "none" });
      }
    }
  };

  const chooseImage = (setter: (v: string[]) => void, prev: string[]) => {
    Taro.chooseImage({
      count: 3,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: (res) => setter([...prev, ...res.tempFilePaths]),
    });
  };

  const handleSubmit = async () => {
    if (!realName || !idCard || !driverLicense || !vehicleLicense || !vehicleTypeId) {
      Taro.showToast({ title: "请填写所有必填信息", icon: "none" }); return;
    }
    setSubmitting(true);
    try {
      await request("/drivers/apply", {
        method: "POST",
        data: {
          real_name: realName,
          id_card: idCard,
          driver_license_no: driverLicense,
          vehicle_license_no: vehicleLicense,
          vehicle_type_id: vehicleTypeId,
          id_card_photos: idCardPhotos,
          driver_license_photos: licensePhotos,
          vehicle_license_photos: licensePhotos,
          vehicle_photos: vehiclePhotos,
        },
      });
      Taro.showToast({ title: "提交成功，请等待审核", icon: "success" });
      setTimeout(() => Taro.reLaunch({ url: "/pages/index/index" }), 1000);
    } catch (e: any) {
      Taro.showToast({ title: e.message || "提交失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  // 未登录 → 先登录
  if (!isLogin) {
    return (
      <View className="page-apply">
        <View className="card" style={{ marginTop: 40, textAlign: "center" }}>
          <Text className="card-title">登录后入驻</Text>
          <Input className="form-input" placeholder="手机号" value={loginPhone} onInput={(e) => setLoginPhone(e.detail.value)} />
          <Input className="form-input" placeholder="密码" password value={loginPwd} onInput={(e) => setLoginPwd(e.detail.value)} />
          <View className="submit-btn" style={{ marginTop: 12 }} onClick={handleLogin}>
            <Text>登录 / 注册</Text>
          </View>
          <Text style={{ display: "block", textAlign: "center", fontSize: 12, color: "#999", marginTop: 8 }}>首次登录自动注册</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="page-apply">
      <View className="card">
        <Text className="card-title">实名认证</Text>
        <Input className="form-input" placeholder="真实姓名" value={realName} onInput={(e) => setRealName(e.detail.value)} />
        <Input className="form-input" placeholder="身份证号码" type="idcard" value={idCard} onInput={(e) => setIdCard(e.detail.value)} />
        <Input className="form-input" placeholder="驾驶证号" value={driverLicense} onInput={(e) => setDriverLicense(e.detail.value)} />
        <Input className="form-input" placeholder="行驶证号" value={vehicleLicense} onInput={(e) => setVehicleLicense(e.detail.value)} />
      </View>

      <View className="card">
        <Text className="card-title">选择服务车型</Text>
        <Picker
          mode="selector"
          range={vehicles}
          rangeKey="name"
          onChange={(e) => {
            const idx = Number(e.detail.value);
            setVehicleTypeId(vehicles[idx].id);
            setVehicleTypeName(vehicles[idx].name);
          }}
        >
          <View className="picker-display"><Text>{vehicleTypeName}</Text></View>
        </Picker>
      </View>

      <View className="card">
        <Text className="card-title">身份证照片</Text>
        <View className="photo-row">
          {idCardPhotos.map((p, i) => <View key={i} className="photo-thumb" style={{ backgroundImage: `url(${p})` }} />)}
          <View className="photo-add" onClick={() => chooseImage(setIdCardPhotos, idCardPhotos)}><Text>+</Text></View>
        </View>
      </View>

      <View className="card">
        <Text className="card-title">驾驶证/行驶证</Text>
        <View className="photo-row">
          {licensePhotos.map((p, i) => <View key={i} className="photo-thumb" style={{ backgroundImage: `url(${p})` }} />)}
          <View className="photo-add" onClick={() => chooseImage(setLicensePhotos, licensePhotos)}><Text>+</Text></View>
        </View>
      </View>

      <View className="card">
        <Text className="card-title">车辆实拍</Text>
        <View className="photo-row">
          {vehiclePhotos.map((p, i) => <View key={i} className="photo-thumb" style={{ backgroundImage: `url(${p})` }} />)}
          <View className="photo-add" onClick={() => chooseImage(setVehiclePhotos, vehiclePhotos)}><Text>+</Text></View>
        </View>
      </View>

      <View className="submit-wrap">
        <View className={`submit-btn ${submitting ? "disabled" : ""}`} onClick={submitting ? undefined : handleSubmit}>
          <Text>{submitting ? "提交中..." : "提交审核"}</Text>
        </View>
      </View>
    </View>
  );
}
