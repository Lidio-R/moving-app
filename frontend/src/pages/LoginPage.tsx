import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: { phone: string; password: string }) => {
    setLoading(true);
    try {
      await login(values.phone, values.password);
      message.success('登录成功');
      navigate('/');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: { phone: string; name: string; password: string }) => {
    setLoading(true);
    try {
      await register(values.phone, values.name, values.password);
      message.success('注册成功');
      navigate('/');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center' }}>🚛 搬家服务平台</Typography.Title>
        <Tabs centered items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form onFinish={handleLogin} layout="vertical">
                <Form.Item name="phone" label="手机号/账号" rules={[{ required: true, message: '请输入' }]}>
                  <Input size="large" placeholder="admin / 手机号" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                  <Input.Password size="large" placeholder="admin123" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  登录
                </Button>
              </Form>
            ),
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form onFinish={handleRegister} layout="vertical">
                <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}>
                  <Input size="large" placeholder="11位手机号" />
                </Form.Item>
                <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                  <Input size="large" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '至少6位' }]}>
                  <Input.Password size="large" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block size="large">
                  注册
                </Button>
              </Form>
            ),
          },
        ]} />
      </Card>
    </div>
  );
}
