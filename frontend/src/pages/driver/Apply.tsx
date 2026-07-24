import { useEffect, useState } from 'react';
import { Card, Form, Select, Input, Button, Typography, message, Alert } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

export default function DriverApply() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/pricing/vehicles').then(r => setVehicles(r.data));
    api.get('/drivers/me').then(r => setDriver(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await api.post('/drivers/apply', values);
      message.success('申请已提交，等待管理员审核');
      navigate('/driver');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '申请失败');
    } finally {
      setLoading(false);
    }
  };

  if (driver) {
    return (
      <Card>
        <Typography.Title level={4}>司机资料</Typography.Title>
        <Alert
          type={driver.status === 'approved' ? 'success' : driver.status === 'pending' ? 'warning' : 'error'}
          message={`审核状态: ${driver.status === 'approved' ? '已通过' : driver.status === 'pending' ? '审核中' : driver.status}`}
          description={driver.status === 'approved' ? '你现在可以上线接单了' : '请等待管理员审核'}
        />
        <Button style={{ marginTop: 16 }} onClick={() => navigate('/driver')}>前往接单中心</Button>
      </Card>
    );
  }

  return (
    <Card title="🚛 申请成为司机" style={{ maxWidth: 600, margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item name="real_name" label="真实姓名" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="id_card" label="身份证号" rules={[{ required: true, len: 18 }]}>
          <Input />
        </Form.Item>
        <Form.Item name="driver_license_no" label="驾驶证号" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="vehicle_license_no" label="行驶证号" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="vehicle_type_id" label="选择车型" rules={[{ required: true }]}>
          <Select placeholder="请选择您的车型">
            {vehicles.map(v => (
              <Select.Option key={v.id} value={v.id}>{v.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Alert message="提交后将由管理员审核，审核通过后即可上线接单" type="info" style={{ marginBottom: 16 }} />

        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          提交申请
        </Button>
      </Form>
    </Card>
  );
}
