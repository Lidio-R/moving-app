import { useState, useEffect } from "react";
import { View, Text } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getWithdrawals } from "../../api/client";
import "./withdrawals.scss";

const WD_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "待审核", color: "#faad14" },
  approved: { label: "已批准", color: "#1677ff" },
  rejected: { label: "已拒绝", color: "#ff4d4f" },
  completed: { label: "已完成", color: "#52c41a" },
};

export default function WithdrawalsPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWithdrawals()
      .then(setList)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <View className="page-withdrawals">
      {loading ? (
        <View className="empty"><Text>加载中...</Text></View>
      ) : list.length === 0 ? (
        <View className="empty"><Text className="empty-icon">💰</Text><Text className="empty-text">暂无提现记录</Text></View>
      ) : (
        list.map((wd) => {
          const s = WD_STATUS[wd.status] || { label: wd.status, color: "#999" };
          return (
            <View key={wd.id} className="wd-card">
              <View className="wd-header">
                <Text className="wd-amount">¥{wd.amount}</Text>
                <Text className="wd-status" style={{ color: s.color }}>{s.label}</Text>
              </View>
              <View className="wd-info">
                <Text className="wd-label">{wd.bank_name} {wd.bank_account?.slice(-4)}</Text>
                <Text className="wd-time">{wd.created_at?.slice(0, 16)}</Text>
              </View>
              {wd.remark && <Text className="wd-remark">{wd.remark}</Text>}
            </View>
          );
        })
      )}
    </View>
  );
}
