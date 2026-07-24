import { useState, useEffect } from "react";
import { View, Text, ScrollView } from "@tarojs/components";
import { getVehicles, getLargeItems } from "../../api/client";
import "./price-detail.scss";

export default function PriceDetailPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    getVehicles().then(setVehicles).catch(console.error);
    getLargeItems().then(setItems).catch(console.error);
  }, []);

  return (
    <ScrollView className="page-price-detail">
      {/* 计价规则 */}
      <View className="section">
        <Text className="section-title">📐 计价规则</Text>
        <View className="rule-item">
          <Text className="rule-label">总费用</Text>
          <Text className="rule-val">起步价 + 里程费 + 楼层费 + 大件附加费 - 优惠券</Text>
        </View>
        <View className="rule-item">
          <Text className="rule-label">起步价</Text>
          <Text className="rule-val">根据车型不同，包含首段基础服务费</Text>
        </View>
        <View className="rule-item">
          <Text className="rule-label">里程费</Text>
          <Text className="rule-val">按实际行驶公里数计算，每公里单价 × 公里数</Text>
        </View>
        <View className="rule-item">
          <Text className="rule-label">楼层费</Text>
          <Text className="rule-val">有电梯免费；无电梯按车型楼层单价 × 实走楼层收费</Text>
        </View>
      </View>

      {/* 车型定价 */}
      <View className="section">
        <Text className="section-title">🚛 车型定价</Text>
        {vehicles.map((v) => (
          <View key={v.id} className="vehicle-card">
            <Text className="vc-name">{v.name}</Text>
            <Text className="vc-desc">{v.description}</Text>
            <View className="vc-prices">
              <View className="vc-row">
                <Text className="vc-label">起步价</Text>
                <Text className="vc-val">¥{v.base_price}</Text>
              </View>
              <View className="vc-row">
                <Text className="vc-label">每公里</Text>
                <Text className="vc-val">¥{v.price_per_km}</Text>
              </View>
              <View className="vc-row">
                <Text className="vc-label">楼层费（无电梯）</Text>
                <Text className="vc-val">¥{v.floor_fee_no_elevator}/层</Text>
              </View>
              <View className="vc-row">
                <Text className="vc-label">楼层费（有电梯）</Text>
                <Text className="vc-val">¥{v.floor_fee_with_elevator}/层</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* 大件物品 */}
      <View className="section">
        <Text className="section-title">📦 大件物品附加费</Text>
        {items.map((item) => (
          <View key={item.id} className="item-row">
            <Text className="item-name">{item.name}</Text>
            <Text className="item-fee">+¥{item.additional_fee}</Text>
          </View>
        ))}
      </View>

      <View className="section note">
        <Text className="note-text">
          ⚠️ 以上价格为标准价格，实际费用以系统计价结果为准。
          如遇特殊情况（楼梯搬运距离远、特大件超出标准等），司机可能根据实际情况协商加收费用。
        </Text>
      </View>
    </ScrollView>
  );
}
