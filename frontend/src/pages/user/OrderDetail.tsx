import { useEffect, useState } from 'react';
import { Card, Descriptions, Tag, Button, Timeline, Rate, Input, Typography, message, Spin, Divider, Statistic } from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

const statusLabels: any = {
  pending: '待接单', accepted: '已接单', driver_heading: '司机赶往装货地',
  loading: '装货中', in_transit: '运输中', unloading: '卸货中',
  completed: '已完成', cancelled: '已取消',
};

const statusColors: any = {
  pending: 'blue', accepted: 'cyan', driver_heading: 'geekblue',
  loading: 'purple', in_transit: 'orange', unloading: 'gold',
  completed: 'green', cancelled: 'red',
};

export default function UserOrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const navigate = useNavigate();

  const load = async () => {
    try {
      const r = await api.get(`/orders/${id}`);
      setOrder(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handlePay = async () => {
    await api.post(`/orders/${id}/pay`);
    message.success('支付成功');
    load();
  };

  const handleCancel = async () => {
    await api.post(`/orders/${id}/cancel?reason=用户主动取消`);
    message.success('已取消');
    load();
  };

  const handleReview = async () => {
    await api.post(`/orders/${id}/review`, { rating: reviewRating, comment: reviewComment });
    message.success('评价成功');
    load();
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!order) return <Typography.Text>订单不存在</Typography.Text>;

  return (
    <div>
      <Button onClick={() => navigate('/user/orders')} style={{ marginBottom: 16 }}>← 返回列表</Button>
      <Card title={`订单详情 #${order.order_no}`}>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[order.status]}>{statusLabels[order.status] || order.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="支付">
            <Tag color={order.payment_status === 'paid' ? 'green' : 'orange'}>
              {order.payment_status === 'paid' ? '已付' : '未付'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="取件地址" span={2}>{order.pickup_address}</Descriptions.Item>
          <Descriptions.Item label="送达地址" span={2}>{order.dropoff_address}</Descriptions.Item>
          <Descriptions.Item label="里程">{order.distance_km} km</Descriptions.Item>
          <Descriptions.Item label="车型">{order.vehicle_type_id}</Descriptions.Item>
          <Descriptions.Item label="取件楼层">{order.pickup_floor}层 ({order.pickup_has_elevator ? '有' : '无'}电梯)</Descriptions.Item>
          <Descriptions.Item label="送达楼层">{order.dropoff_floor}层 ({order.dropoff_has_elevator ? '有' : '无'}电梯)</Descriptions.Item>
          <Descriptions.Item label="大件物品" span={2}>
            {order.large_items?.length > 0
              ? order.large_items.map((i: any) => `${i.name} x${i.qty} (¥${i.fee})`).join(', ')
              : '无'}
          </Descriptions.Item>
          <Descriptions.Item label="总价" span={2}>
            <Statistic value={order.total_price} prefix="¥" precision={2} valueStyle={{ color: '#cf1322', fontWeight: 'bold' }} />
          </Descriptions.Item>
          {order.price_breakdown && (
            <>
              <Descriptions.Item label="起步价">¥{order.price_breakdown.base_price}</Descriptions.Item>
              <Descriptions.Item label="里程费">¥{order.price_breakdown.distance_fee}</Descriptions.Item>
              <Descriptions.Item label="楼层费">¥{order.price_breakdown.floor_fee}</Descriptions.Item>
              <Descriptions.Item label="大件费">¥{order.price_breakdown.large_item_fee}</Descriptions.Item>
              {order.price_breakdown.discount > 0 && (
                <Descriptions.Item label="优惠">-¥{order.price_breakdown.discount}</Descriptions.Item>
              )}
            </>
          )}
          <Descriptions.Item label="创建时间">{new Date(order.created_at).toLocaleString()}</Descriptions.Item>
          <Descriptions.Item label="完成时间">{order.completed_at ? new Date(order.completed_at).toLocaleString() : '-'}</Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Actions */}
        <div style={{ marginBottom: 16 }}>
          {order.payment_status === 'unpaid' && order.status !== 'cancelled' && (
            <Button type="primary" onClick={handlePay} style={{ marginRight: 12 }}>去支付</Button>
          )}
          {(order.status === 'pending' || order.status === 'accepted') && (
            <Button danger onClick={handleCancel}>取消订单</Button>
          )}
        </div>

        {/* Review */}
        {order.status === 'completed' && order.rating === 0 && (
          <Card title="评价订单" size="small">
            <div style={{ marginBottom: 8 }}>评分: <Rate value={reviewRating} onChange={setReviewRating} /></div>
            <Input.TextArea placeholder="写下您的评价..." value={reviewComment}
              onChange={e => setReviewComment(e.target.value)} rows={3} style={{ marginBottom: 8 }} />
            <Button type="primary" onClick={handleReview} disabled={reviewRating === 0}>提交评价</Button>
          </Card>
        )}

        {order.rating > 0 && (
          <Card title="我的评价" size="small">
            <Rate disabled value={order.rating} />
            <p>{order.review_comment}</p>
          </Card>
        )}
      </Card>
    </div>
  );
}
