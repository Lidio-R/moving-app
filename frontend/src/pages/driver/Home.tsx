import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Typography, message, Switch, Space, Statistic } from 'antd';
import api from '../../api/client';

export default function DriverHome() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const r = await api.get('/orders/driver/available');
      setOrders(r.data);
    } finally {
      setLoading(false);
    }
  };

  const loadStatus = async () => {
    try {
      const r = await api.get('/drivers/me');
      setIsOnline(r.data.is_online);
    } catch { /* not a driver yet */ }
  };

  useEffect(() => { loadOrders(); loadStatus(); }, []);

  const handleToggleOnline = async () => {
    try {
      const r = await api.post('/drivers/toggle-online');
      setIsOnline(r.data.is_online);
      message.success(r.data.is_online ? '已上线，可接收订单' : '已离线');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '操作失败');
    }
  };

  const handleAccept = async (orderId: number) => {
    try {
      await api.post(`/orders/${orderId}/accept`);
      message.success('接单成功！');
      loadOrders();
    } catch (e: any) {
      message.error(e.response?.data?.detail || '接单失败');
    }
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 180 },
    { title: '取件', dataIndex: 'pickup_address', ellipsis: true },
    { title: '送达', dataIndex: 'dropoff_address', ellipsis: true },
    { title: '里程', dataIndex: 'distance_km', render: (v: number) => `${v} km` },
    { title: '金额', dataIndex: 'total_price', render: (v: number) => `¥${v}` },
    { title: '创建时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作', render: (_: any, r: any) => (
        <Button type="primary" size="small" onClick={() => handleAccept(r.id)}>
          抢单
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <Statistic title="接单状态" value={isOnline ? '在线' : '离线'}
            valueStyle={{ color: isOnline ? '#52c41a' : '#999' }} />
          <Switch checked={isOnline} onChange={handleToggleOnline}
            checkedChildren="上线" unCheckedChildren="离线" />
          <Button onClick={loadOrders}>刷新订单池</Button>
        </Space>
      </Card>

      <Typography.Title level={4}>待接订单池</Typography.Title>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading}
        locale={{ emptyText: '暂无待接订单' }} />
    </div>
  );
}
