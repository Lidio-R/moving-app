import { useEffect, useState } from 'react';
import { Table, Tag, Button, Select, Typography, message, Space, Modal } from 'antd';
import api from '../../api/client';

const statusLabels: any = {
  pending: '待接单', accepted: '已接单', driver_heading: '赶往装货地',
  loading: '装货中', in_transit: '运输中', unloading: '卸货中',
  completed: '已完成', cancelled: '已取消',
};
const statusColors: any = {
  pending: 'blue', accepted: 'cyan', driver_heading: 'geekblue',
  loading: 'purple', in_transit: 'orange', unloading: 'gold',
  completed: 'green', cancelled: 'red',
};

const nextStatus: any = {
  accepted: { key: 'driver_heading', label: '出发' },
  driver_heading: { key: 'loading', label: '到达装货' },
  loading: { key: 'in_transit', label: '装货完成,出发' },
  in_transit: { key: 'unloading', label: '到达卸货' },
  unloading: { key: 'completed', label: '完成卸货' },
};

export default function DriverMyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const r = await api.get(`/orders/driver/my-orders${params}`);
      setOrders(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      const n = nextStatus[newStatus];
      await api.post(`/orders/${orderId}/status`, { status: n.key, note: n.label });
      message.success(`状态已更新: ${n.label}`);
      load();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '更新失败');
    }
  };

  const handleCancel = async (orderId: number) => {
    await api.post(`/orders/${orderId}/cancel?reason=司机取消`);
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
      render: (s: string) => <Tag color={statusColors[s]}>{statusLabels[s]}</Tag>,
    },
    { title: '创建时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          {nextStatus[r.status] && (
            <Button size="small" type="primary" onClick={() => handleUpdateStatus(r.id, r.status)}>
              {nextStatus[r.status].label}
            </Button>
          )}
          {(r.status === 'accepted' || r.status === 'driver_heading') && (
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
