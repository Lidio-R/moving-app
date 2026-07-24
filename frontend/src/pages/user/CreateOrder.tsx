import { useEffect, useState } from 'react';
import {
  Card, Form, Select, InputNumber, Input, Checkbox, Button, Typography, Row, Col,
  Divider, message, DatePicker, Tag, Statistic,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

interface VehicleType { id: number; name: string; base_price: number; price_per_km: number; }
interface LargeItem { id: number; name: string; additional_fee: number; }

export default function UserCreateOrder() {
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [items, setItems] = useState<LargeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Record<number, number>>({});
  const [price, setPrice] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/pricing/vehicles').then(r => setVehicles(r.data));
    api.get('/pricing/items').then(r => setItems(r.data));
  }, []);

  const calcPrice = async () => {
    try {
      const values = await form.validateFields();
      const itemIds = items.filter(i => (selectedItems[i.id] || 0) > 0).map(i => i.id);
      const qtys = items.filter(i => (selectedItems[i.id] || 0) > 0).map(i => selectedItems[i.id]);
      const res = await api.post('/pricing/calculate', {
        vehicle_type_id: values.vehicle_type_id,
        distance_km: values.distance_km || 1,
        pickup_floor: values.pickup_floor || 1,
        dropoff_floor: values.dropoff_floor || 1,
        pickup_has_elevator: values.pickup_has_elevator ?? true,
        dropoff_has_elevator: values.dropoff_has_elevator ?? true,
        large_item_ids: itemIds,
        large_item_quantities: qtys,
      });
      setPrice(res.data);
    } catch (e) {
      // validation error
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const itemIds = items.filter(i => (selectedItems[i.id] || 0) > 0).map(i => i.id);
      const qtys = items.filter(i => (selectedItems[i.id] || 0) > 0).map(i => selectedItems[i.id]);

      const largeItems = items.filter(i => (selectedItems[i.id] || 0) > 0).map(i => ({
        item_id: i.id,
        name: i.name,
        qty: selectedItems[i.id],
        fee: i.additional_fee * selectedItems[i.id],
      }));

      await api.post('/orders', {
        pickup_address: values.pickup_address,
        pickup_lat: 0,
        pickup_lng: 0,
        dropoff_address: values.dropoff_address,
        dropoff_lat: 0,
        dropoff_lng: 0,
        distance_km: values.distance_km || 1,
        vehicle_type_id: values.vehicle_type_id,
        pickup_floor: values.pickup_floor || 1,
        dropoff_floor: values.dropoff_floor || 1,
        pickup_has_elevator: values.pickup_has_elevator ?? true,
        dropoff_has_elevator: values.dropoff_has_elevator ?? true,
        large_items: largeItems,
        scheduled_time: values.scheduled_time || null,
      });
      message.success('下单成功！');
      navigate('/user/orders');
    } catch (e: any) {
      message.error(e.response?.data?.detail || '下单失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={24}>
      <Col span={14}>
        <Card title="📝 创建搬家订单">
          <Form form={form} layout="vertical" onValuesChange={calcPrice}>
            <Form.Item name="pickup_address" label="取件地址" rules={[{ required: true }]}>
              <Input placeholder="请输入详细地址" size="large" />
            </Form.Item>
            <Form.Item name="dropoff_address" label="送达地址" rules={[{ required: true }]}>
              <Input placeholder="请输入详细地址" size="large" />
            </Form.Item>
            <Form.Item name="distance_km" label="预计里程 (公里)" initialValue={5}>
              <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="vehicle_type_id" label="选择车型" rules={[{ required: true }]}>
              <Select placeholder="请选择车型" size="large">
                {vehicles.map(v => (
                  <Select.Option key={v.id} value={v.id}>{v.name} (起步价¥{v.base_price}, ¥{v.price_per_km}/km)</Select.Option>
                ))}
              </Select>
            </Form.Item>

            <Divider>楼层信息</Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="pickup_floor" label="取件楼层" initialValue={1}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="pickup_has_elevator" label="取件有电梯" valuePropName="checked" initialValue={true}>
                  <Checkbox />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="dropoff_floor" label="送达楼层" initialValue={1}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="dropoff_has_elevator" label="送达有电梯" valuePropName="checked" initialValue={true}>
                  <Checkbox />
                </Form.Item>
              </Col>
            </Row>

            <Divider>大件物品</Divider>
            {items.map(item => (
              <div key={item.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Checkbox
                  checked={(selectedItems[item.id] || 0) > 0}
                  onChange={e => {
                    setSelectedItems(s => ({ ...s, [item.id]: e.target.checked ? 1 : 0 }));
                    setTimeout(calcPrice, 100);
                  }}
                >
                  {item.name}
                </Checkbox>
                <Tag color="orange">¥{item.additional_fee}/件</Tag>
                {(selectedItems[item.id] || 0) > 0 && (
                  <InputNumber min={1} value={selectedItems[item.id]}
                    onChange={v => {
                      setSelectedItems(s => ({ ...s, [item.id]: v || 0 }));
                      setTimeout(calcPrice, 100);
                    }}
                    style={{ width: 60 }} />
                )}
              </div>
            ))}

            <Form.Item name="scheduled_time" label="预约时间（留空为即时单）">
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>

            <Button type="primary" size="large" block onClick={handleSubmit} loading={loading}
              style={{ height: 48, fontSize: 16 }}>
              确认下单
            </Button>
          </Form>
        </Card>
      </Col>

      <Col span={10}>
        <Card title="💰 费用预估">
          {price ? (
            <div>
              <Statistic title="起步价" value={price.base_price} prefix="¥" precision={2} />
              <Statistic title="里程费" value={price.distance_fee} prefix="¥" precision={2} />
              <Statistic title="楼层费" value={price.floor_fee} prefix="¥" precision={2} />
              <Statistic title="大件附加费" value={price.large_item_fee} prefix="¥" precision={2} />
              <Divider />
              <Statistic title="预估总价" value={price.total_price} prefix="¥" precision={2}
                valueStyle={{ color: '#cf1322', fontSize: 28, fontWeight: 'bold' }} />
            </div>
          ) : (
            <Typography.Text type="secondary">请填写订单信息以查看预估费用</Typography.Text>
          )}
        </Card>
      </Col>
    </Row>
  );
}
