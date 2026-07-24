import { useEffect, useState } from 'react';
import { Table, Tag, Button, Typography, message, Card, Row, Col, Statistic, Space } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import api from '../../api/client';
import { exportToExcel } from '../../api/export';

export default function AdminFinance() {
  const [summary, setSummary] = useState<any>({});
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([
        api.get('/admin/finance/summary'),
        api.get('/wallet/admin/withdrawals'),
      ]);
      setSummary(s.data);
      setWithdrawals(w.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAudit = async (wdId: number, status: string) => {
    await api.post(`/wallet/admin/withdrawals/${wdId}/audit`, { status });
    message.success(status === 'approved' ? '已通过' : '已拒绝');
    load();
  };

  const statusColor: any = { pending: 'orange', approved: 'green', rejected: 'red', completed: 'blue' };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '司机ID', dataIndex: 'driver_id' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v}` },
    { title: '银行', dataIndex: 'bank_name' },
    { title: '账号', dataIndex: 'bank_account' },
    { title: '状态', dataIndex: 'status', render: (s: string) => <Tag color={statusColor[s]}>{s}</Tag> },
    { title: '申请时间', dataIndex: 'created_at', render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作', render: (_: any, r: any) =>
        r.status === 'pending' ? (
          <span>
            <Button size="small" type="primary" onClick={() => handleAudit(r.id, 'approved')} style={{ marginRight: 8 }}>通过</Button>
            <Button size="small" danger onClick={() => handleAudit(r.id, 'rejected')}>拒绝</Button>
          </span>
        ) : null,
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>财务对账</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}><Card><Statistic title="司机总收入" value={summary.total_earnings ?? 0} prefix="¥" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="平台佣金" value={summary.total_commission ?? 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="待审核提现" value={summary.pending_withdrawals ?? 0} prefix="¥" precision={2} valueStyle={{ color: '#faad14' }} /></Card></Col>
      </Row>

      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={5} style={{ marginBottom: 0 }}>提现审核</Typography.Title>
        <Button icon={<DownloadOutlined />} onClick={() => {
          const data = withdrawals.map(w => ({
            ID: w.id, 司机ID: w.driver_id, 金额: w.amount,
            银行: w.bank_name, 账号: w.bank_account,
            状态: w.status, 申请时间: w.created_at,
          }));
          exportToExcel(data, '提现记录');
        }}>导出 Excel</Button>
      </Space>
      <Table columns={columns} dataSource={withdrawals} rowKey="id" loading={loading} />
    </div>
  );
}
