import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin } from 'antd';
import { UserOutlined, CarOutlined, ShoppingCartOutlined, DollarOutlined } from '@ant-design/icons';
import api from '../../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Typography.Title level={4}>运营仪表盘</Typography.Title>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card><Statistic title="用户总数" value={stats?.total_users ?? 0} prefix={<UserOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="司机总数" value={stats?.total_drivers ?? 0} prefix={<CarOutlined />} /></Card></Col>
        <Col span={6}><Card><Statistic title="待审核司机" value={stats?.pending_drivers ?? 0} prefix={<CarOutlined />} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={6}><Card><Statistic title="今日订单" value={stats?.today_orders ?? 0} prefix={<ShoppingCartOutlined />} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Card><Statistic title="总订单数" value={stats?.total_orders ?? 0} /></Card></Col>
        <Col span={6}><Card><Statistic title="平台流水" value={stats?.total_revenue ?? 0} prefix="¥" precision={2} /></Card></Col>
        <Col span={6}><Card><Statistic title="平台佣金" value={stats?.platform_commission ?? 0} prefix="¥" precision={2} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>
    </div>
  );
}
