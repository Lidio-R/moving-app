import { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

const statusLabels: any = {
  pending: '待接单', accepted: '已接单', driver_heading: '司机赶往装货地',
  loading: '装货中', in_transit: '运输中', unloading: '卸货中',
  completed: '已完成', cancelled: '已取消',
};
const statusColors: any = {
  pending: 'blue', accepted: 'cyan', driver_heading: 'geekblue',
  loading: 'purple', in_transit: 'orange', unloading: 'gold',
  completed: 'green', cancelled: 'red',
};

export default function UserMyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const r = await api.get(`/orders/my${params}`);
      setOrders(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handlePay = async (id: number) => {
    try {
      await api.post(`/orders/${id}/pay`);
      message.success('支付成功');
      load();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '支付失败');
    }
  };

  const handleCancel = async (id: number) => {
    await api.post(`/orders/${id}/cancel?reason=用户主动取消`);
    message.success('已取消');
    load();
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 180 },
    { title: '取件', dataIndex: 'pickup_address', ellipsis: true },
    { title: '送达', dataIndex: 'dropoff_address', ellipsis: true },
    { title: '金额', dataIndex: 'total_price', render: (v: number) => `¥${v}` },
    {
      title: '状态', dataIndex: 'status',
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s] || s}</Tag>,
    },
    {
      title: '支付', dataIndex: 'payment_status',
      render: (s: string) => <Tag color={s === 'paid' ? 'green' : 'orange'}>{s === 'paid' ? '已付' : '未付'}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString(), width: 160 },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/user/orders/${r.id}`)}>详情</Button>
          {r.payment_status === 'unpaid' && r.status !== 'cancelled' && (
            <Button size="small" type="primary" onClick={() => handlePay(r.id)}>支付</Button>
          )}
          {(r.status === 'pending' || r.status === 'accepted') && (
            <Button size="small" danger onClick={() => handleCancel(r.id)}>取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>我的订单</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="筛选状态" allowClear style={{ width: 150 }} onChange={(v) => setFilterStatus(v || '')}>
          <Select.Option value="">全部</Select.Option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <Select.Option key={k} value={k}>{v as string}</Select.Option>
          ))}
        </Select>
      </Space>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
    </div>
  );
}
