import { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, InputNumber, Select, Typography, message, Space } from 'antd';
import api from '../../api/client';

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditModal, setAuditModal] = useState<{ open: boolean; driver: any }>({ open: false, driver: null });
  const [commissionRate, setCommissionRate] = useState(15);
  const [depositAmount, setDepositAmount] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('');

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const params = filterStatus ? `?status=${filterStatus}` : '';
      const r = await api.get(`/drivers/all${params}`);
      setDrivers(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDrivers(); }, [filterStatus]);

  const handleAudit = async (driverId: number, status: string) => {
    await api.post(`/drivers/${driverId}/audit`, {
      status,
      commission_rate: commissionRate,
      deposit_amount: depositAmount,
    });
    message.success(status === 'approved' ? '已通过' : '已拒绝');
    setAuditModal({ open: false, driver: null });
    loadDrivers();
  };

  const handleUpdate = async (driverId: number, updates: any) => {
    await api.put(`/drivers/${driverId}`, updates);
    message.success('更新成功');
    loadDrivers();
  };

  const statusColor: any = { pending: 'orange', approved: 'green', rejected: 'red', disabled: 'gray' };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '姓名', dataIndex: 'real_name' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: '抽佣比例', dataIndex: 'commission_rate', render: (v: number) => `${v}%` },
    { title: '保证金', dataIndex: 'deposit_amount', render: (v: number) => `¥${v}` },
    { title: '在线', dataIndex: 'is_online', render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '在线' : '离线'}</Tag> },
    {
      title: '操作', render: (_: any, r: any) => (
        <Space>
          {r.status === 'pending' && (
            <Button size="small" type="primary" onClick={() => { setAuditModal({ open: true, driver: r }); setCommissionRate(r.commission_rate); setDepositAmount(r.deposit_amount); }}>
              审核
            </Button>
          )}
          {r.status === 'approved' && (
            <>
              <Button size="small" danger onClick={() => handleUpdate(r.id, { status: 'disabled' })}>禁用</Button>
              <Button size="small" onClick={() => handleUpdate(r.id, { commission_rate: r.commission_rate + 1 })}>+1%抽佣</Button>
            </>
          )}
          {r.status === 'disabled' && (
            <Button size="small" onClick={() => handleUpdate(r.id, { status: 'approved' })}>解封</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>司机管理</Typography.Title>
      <Space style={{ marginBottom: 16 }}>
        <Select placeholder="筛选状态" allowClear style={{ width: 150 }} onChange={(v) => setFilterStatus(v || '')}>
          <Select.Option value="">全部</Select.Option>
          <Select.Option value="pending">待审核</Select.Option>
          <Select.Option value="approved">已通过</Select.Option>
          <Select.Option value="rejected">已拒绝</Select.Option>
          <Select.Option value="disabled">已禁用</Select.Option>
        </Select>
      </Space>
      <Table columns={columns} dataSource={drivers} rowKey="id" loading={loading} />

      <Modal
        title="审核司机"
        open={auditModal.open}
        onCancel={() => setAuditModal({ open: false, driver: null })}
        footer={null}
      >
        {auditModal.driver && (
          <div>
            <p>司机: {auditModal.driver.real_name}</p>
            <p>身份证: {auditModal.driver.id_card}</p>
            <div style={{ marginBottom: 12 }}>
              <span>抽佣比例 (%): </span>
              <InputNumber min={0} max={50} value={commissionRate} onChange={v => setCommissionRate(v || 0)} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <span>保证金 (元): </span>
              <InputNumber min={0} value={depositAmount} onChange={v => setDepositAmount(v || 0)} />
            </div>
            <Space>
              <Button type="primary" onClick={() => handleAudit(auditModal.driver.id, 'approved')}>通过</Button>
              <Button danger onClick={() => handleAudit(auditModal.driver.id, 'rejected')}>拒绝</Button>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}
