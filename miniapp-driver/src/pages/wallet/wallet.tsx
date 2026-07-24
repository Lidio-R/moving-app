import { useState, useEffect, useCallback } from "react";
import { View, Text, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { getWallet, getTransactions, withdraw } from "../../api/client";
import "./wallet.scss";

export default function WalletPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [wdAmount, setWdAmount] = useState("");
  const [wdBank, setWdBank] = useState("");
  const [wdAccount, setWdAccount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const w = await getWallet();
      setWallet(w);
    } catch {}
    try {
      const tx = await getTransactions({ page: 1, size: 20 });
      setTransactions(tx.items || tx || []);
    } catch {}
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdraw = async () => {
    const amount = parseFloat(wdAmount);
    if (!amount || amount <= 0) {
      Taro.showToast({ title: "请输入有效金额", icon: "none" }); return;
    }
    if (!wdBank || !wdAccount) {
      Taro.showToast({ title: "请填写银行信息", icon: "none" }); return;
    }
    setSubmitting(true);
    try {
      await withdraw({ amount, bank_name: wdBank, bank_account: wdAccount });
      Taro.showToast({ title: "提现申请已提交", icon: "success" });
      setShowWithdraw(false);
      fetchData();
    } catch (e: any) {
      Taro.showToast({ title: e.message || "提现失败", icon: "none" });
    } finally {
      setSubmitting(false);
    }
  };

  const txLabels: Record<string, string> = { earning: "订单收入", commission: "平台抽佣", withdrawal: "提现", fine: "罚款", freeze: "冻结", unfreeze: "解冻" };

  return (
    <View className="page-wallet">
      {/* 余额卡片 */}
      <View className="balance-card">
        <Text className="balance-label">可提现余额</Text>
        <Text className="balance-amount">¥{wallet?.available_balance || 0}</Text>
        <View className="balance-row">
          <View className="bal-item"><Text className="bal-label">冻结金额</Text><Text className="bal-val">¥{wallet?.frozen_balance || 0}</Text></View>
          <View className="bal-item"><Text className="bal-label">累计收入</Text><Text className="bal-val">¥{wallet?.total_earned || 0}</Text></View>
          <View className="bal-item"><Text className="bal-label">已提现</Text><Text className="bal-val">¥{wallet?.total_withdrawn || 0}</Text></View>
        </View>
        <View className="withdraw-btn" onClick={() => setShowWithdraw(true)}>
          <Text>申请提现</Text>
        </View>
      </View>

      {/* 交易记录 */}
      <View className="card">
        <Text className="card-title">交易记录</Text>
        {transactions.length === 0 ? (
          <View className="empty"><Text className="empty-text">暂无交易</Text></View>
        ) : (
          transactions.map((tx, i) => (
            <View key={i} className="tx-row">
              <View className="tx-left">
                <Text className="tx-type">{txLabels[tx.tx_type] || tx.tx_type}</Text>
                <Text className="tx-desc">{tx.description}</Text>
              </View>
              <Text className={`tx-amount ${tx.amount > 0 ? "plus" : "minus"}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 提现弹窗 */}
      {showWithdraw && (
        <View className="modal-overlay" onClick={() => setShowWithdraw(false)}>
          <View className="modal-box" onClick={(e) => e.stopPropagation()}>
            <Text className="modal-title">申请提现</Text>
            <Input className="modal-input" placeholder="提现金额" type="digit" value={wdAmount} onInput={(e) => setWdAmount(e.detail.value)} />
            <Input className="modal-input" placeholder="银行名称" value={wdBank} onInput={(e) => setWdBank(e.detail.value)} />
            <Input className="modal-input" placeholder="银行卡号" value={wdAccount} onInput={(e) => setWdAccount(e.detail.value)} />
            <Text className="modal-tip">可提现余额 ¥{wallet?.available_balance || 0}</Text>
            <View className="modal-btns">
              <View className="mbtn-cancel" onClick={() => setShowWithdraw(false)}><Text>取消</Text></View>
              <View className={`mbtn-confirm ${submitting ? "disabled" : ""}`} onClick={submitting ? undefined : handleWithdraw}>
                <Text>{submitting ? "提交中..." : "确认提现"}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View className="driver-tabbar">
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/index/index" })}><Text>🏠</Text><Text className="tblabel">接单</Text></View>
        <View className="tbitem active"><Text>💰</Text><Text className="tblabel">钱包</Text></View>
        <View className="tbitem" onClick={() => Taro.navigateTo({ url: "/pages/profile/profile" })}><Text>👤</Text><Text className="tblabel">我的</Text></View>
      </View>
    </View>
  );
}
