import { Card, Button, Typography, Row, Col, List, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UserHome() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Typography.Title level={3} style={{ color: '#fff', margin: 0 }}>欢迎, {user?.name}</Typography.Title>
        <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginTop: 8 }}>
          需要搬家？立即下单，系统自动计费，司机快速接单
        </Typography.Paragraph>
        <Button size="large" type="primary" onClick={() => navigate('/user/create')} style={{ background: '#52c41a', borderColor: '#52c41a' }}>
          立即下单
        </Button>
      </Card>

      <Row gutter={16}>
        <Col span={8}>
          <Card title="📦 如何下单" size="small">
            <List size="small" dataSource={[
              '1. 填写取件和送达地址',
              '2. 选择车型、楼层信息',
              '3. 勾选需要搬运的大件物品',
              '4. 系统自动计算费用',
              '5. 确认下单，等待司机接单',
            ]} renderItem={item => <List.Item>{item}</List.Item>} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="🚛 计价规则" size="small">
            <List size="small" dataSource={[
              '起步价: 微面¥30 / 金杯¥50 / 厢货¥80',
              '里程费: 每公里 ¥5 / ¥8 / ¥12',
              '楼层费: 无电梯 ¥10-20/层',
              '大件拆装: 空调¥120 / 床¥100 / 冰箱¥50',
            ]} renderItem={item => <List.Item>{item}</List.Item>} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="🔔 服务保障" size="small">
            <List size="small" dataSource={[
              '平台司机均实名认证',
              '订单全程追踪，实时查看位置',
              '支持在线支付，安全便捷',
              '完成后可评价，保障服务质量',
            ]} renderItem={item => <List.Item>{item}</List.Item>} />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
