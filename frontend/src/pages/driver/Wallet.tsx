import { useEffect, useState } from 'react';
import { Card, Table, Typography, Button, InputNumber, Modal, message, Row, Col, Statistic, Tag } from 'antd';
import api from '../../api/client';

export default function DriverWallet() {
  const [wallet, setWallet] = useState<any>(null);
  const [txs, setTxs] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [w, t, wd] = await Promise.all([
        api.get('/wallet/my'),
        api.get('/wallet/transactions'),
        api.get('/wallet/withdrawals'),
      ]);
      setWallet(w.data);
      setTxs(t.data);
      setWithdrawals(wd.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleWithdraw = async () => {
    try {
      await api.post('/wallet/withdraw', { amount: withdrawAmount });
      message.success('提现申请已提交');
      setWithdrawOpen(false);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '提现失败');
    }
  };

  const txTypeLabels: any = {
    earning: '订单收入', commission: '平台抽佣', withdrawal: '提现',
    fine: '罚款', freeze: '冻结', unfreeze: '解冻',
  };

  const txColumns = [
    { title: '类型', dataIndex: 'tx_type', render: (v: string) => txTypeLabels[v] || v },
    { title: '金额', dataIndex: 'amount', render: (v: number) => <span style={{ color: v >= 0 ? '#52c41a' : '#ff4d4f' }}>¥{v}</span> },
    { title: '说明', dataIndex: 'description' },
    { title: '时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="可提现余额" value={wallet?.available_balance ?? 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="冻结余额" value={wallet?.frozen_balance ?? 0} prefix="¥" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="累计收入" value={wallet?.total_earned ?? 0} prefix="¥" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="累计提现" value={wallet?.total_withdrawn ?? 0} prefix="¥" precision={2} /></Card></Col>
      </Row>

      <Button type="primary" onClick={() => setWithdrawOpen(true)} style={{ marginBottom: 16 }}
        disabled={(wallet?.available_balance ?? 0) <= 0}>
        申请提现
      </Button>

      <Typography.Title level={5}>交易流水</Typography.Title>
      <Table columns={txColumns} dataSource={txs} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} size="small" />

      <Typography.Title level={5} style={{ marginTop: 24 }}>提现记录</Typography.Title>
      <Table dataSource={withdrawals} rowKey="id" columns={[
        { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v}` },
        { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color={v === 'completed' ? 'green' : v === 'pending' ? 'orange' : 'red'}>{v}</Tag> },
        { title: '申请时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
        { title: '处理时间', dataIndex: 'processed_at', render: (v: string) => v ? new Date(v).toLocaleString() : '-' },
      ]} pagination={false} size="small" />

      <Modal title="申请提现" open={withdrawOpen} onOk={handleWithdraw} onCancel={() => setWithdrawOpen(false)}>
        <p>可提现余额: ¥{wallet?.available_balance ?? 0}</p>
        <span>提现金额: </span>
        <InputNumber min={1} max={wallet?.available_balance ?? 0}
          value={withdrawAmount} onChange={v => setWithdrawAmount(v || 0)} />
      </Modal>
    </div>
  );
}
