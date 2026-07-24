import { useEffect, useState } from 'react';
import { Table, Tag, Select, Typography, InputNumber, Button, Modal, message, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { exportToExcel } from '../../api/export';

const statusColors: any = {
  pending: 'blue', accepted: 'cyan', driver_heading: 'geekblue',
  loading: 'purple', in_transit: 'orange', unloading: 'gold',
  completed: 'green', cancelled: 'red',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [priceModal, setPriceModal] = useState<{ open: boolean; order: any; price: number }>({ open: false, order: null, price: 0 });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const r = await api.get(`/admin/orders${params}`);
      setOrders(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [filterStatus]);

  const handleUpdatePrice = async () => {
    await api.put(`/admin/orders/${priceModal.order.id}/price`, null, { params: { new_price: priceModal.price } });
    message.success('价格已更新');
    setPriceModal({ open: false, order: null, price: 0 });
    loadOrders();
  };

  const handleCancel = async (orderId: number) => {
    await api.post(`/admin/orders/${orderId}/cancel?reason=管理员取消`);
    message.success('已取消');
    loadOrders();
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', width: 180 },
    { title: '用户ID', dataIndex: 'user_id', width: 70 },
    { title: '司机ID', dataIndex: 'driver_id', width: 70 },
    { title: '车型', dataIndex: 'vehicle_type_id' },
    { title: '金额', dataIndex: 'total_price', render: (v: number) => `¥${v}` },
    {
      title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusColors[s] || 'default'}>{s}</Tag>,
    },
    {
      title: '支付', dataIndex: 'payment_status', render: (s: string) => (
        <Tag color={s === 'paid' ? 'green' : 'orange'}>{s === 'paid' ? '已付' : '未付'}</Tag>
      ),
    },
    { title: '评价', dataIndex: 'rating', render: (v: number) => v ? `${v}星` : '-' },
    { title: '创建时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString(), width: 160 },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => setPriceModal({ open: true, order: r, price: r.total_price })}>改价</Button>
          {r.status !== 'completed' && r.status !== 'cancelled' && (
            <Button size="small" danger onClick={() => handleCancel(r.id)}>取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>订单管理</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="筛选状态" allowClear style={{ width: 150 }} onChange={(v) => setFilterStatus(v || '')}>
          <Select.Option value="">全部</Select.Option>
          {['pending', 'accepted', 'driver_heading', 'loading', 'in_transit', 'unloading', 'completed', 'cancelled'].map(s => (
            <Select.Option key={s} value={s}>{s}</Select.Option>
          ))}
        </Select>
        <Button icon={<DownloadOutlined />} onClick={() => {
          const data = orders.map(o => ({
            订单号: o.order_no, 用户ID: o.user_id, 司机ID: o.driver_id,
            车型ID: o.vehicle_type_id, 金额: o.total_price,
            状态: o.status, 支付: o.payment_status,
            评价: o.rating, 创建时间: o.created_at,
          }));
          exportToExcel(data, '订单数据');
        }}>导出 Excel</Button>
      </Space>
      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} scroll={{ x: 1200 }} />

      <Modal title="手动改价" open={priceModal.open} onOk={handleUpdatePrice}
        onCancel={() => setPriceModal({ open: false, order: null, price: 0 })}>
        <p>订单号: {priceModal.order?.order_no}</p>
        <p>当前金额: ¥{priceModal.order?.total_price}</p>
        <span>新金额: </span>
        <InputNumber value={priceModal.price} onChange={v => setPriceModal(p => ({ ...p, price: v || 0 }))} min={0} />
      </Modal>
    </div>
  );
}
