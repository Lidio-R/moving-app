import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, DatePicker, Typography, message } from 'antd';
import api from '../../api/client';
import dayjs from 'dayjs';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/admin/coupons');
      setCoupons(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (values: any) => {
    await api.post('/admin/coupons', {
      ...values,
      valid_from: values.valid_range[0].toISOString(),
      valid_to: values.valid_range[1].toISOString(),
    });
    message.success('优惠券已创建');
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const columns = [
    { title: '券码', dataIndex: 'code' },
    { title: '类型', dataIndex: 'discount_type', render: (v: string) => v === 'fixed' ? '固定金额' : '百分比' },
    { title: '优惠值', dataIndex: 'discount_value', render: (v: number) => v },
    { title: '最低消费', dataIndex: 'min_order_amount', render: (v: number) => `¥${v}` },
    { title: '有效期', render: (_: any, r: any) => `${new Date(r.valid_from).toLocaleDateString()} ~ ${new Date(r.valid_to).toLocaleDateString()}` },
    { title: '使用量', render: (_: any, r: any) => `${r.used_count}/${r.usage_limit}` },
  ];

  return (
    <div>
      <Typography.Title level={4}>优惠券管理</Typography.Title>
      <Button type="primary" onClick={() => setModalOpen(true)} style={{ marginBottom: 16 }}>新建优惠券</Button>
      <Table columns={columns} dataSource={coupons} rowKey="id" loading={loading} />

      <Modal title="新建优惠券" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="code" label="券码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="discount_type" label="类型" initialValue="fixed">
            <Input />
          </Form.Item>
          <Form.Item name="discount_value" label="优惠值（元或%）" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="min_order_amount" label="最低订单金额" initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="usage_limit" label="使用上限" initialValue={100}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="valid_range" label="有效期" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
