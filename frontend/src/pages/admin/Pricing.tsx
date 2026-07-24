import { useEffect, useState } from 'react';
import { Table, Button, Modal, InputNumber, Typography, message, Space } from 'antd';
import api from '../../api/client';

export default function AdminPricing() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [editModal, setEditModal] = useState<{ open: boolean; vehicle: any }>({ open: false, vehicle: null });

  const loadVehicles = async () => {
    const r = await api.get('/pricing/vehicles');
    setVehicles(r.data);
  };
  const loadItems = async () => {
    const r = await api.get('/pricing/items');
    setItems(r.data);
  };

  useEffect(() => { loadVehicles(); loadItems(); }, []);

  const handleSaveVehicle = async (values: any) => {
    if (editModal.vehicle) {
      await api.put(`/pricing/vehicles/${editModal.vehicle.id}`, values);
      message.success('已更新');
    }
    setEditModal({ open: false, vehicle: null });
    loadVehicles();
  };

  const colV = [
    { title: '车型', dataIndex: 'name' },
    { title: '起步价 (元)', dataIndex: 'base_price' },
    { title: '每公里 (元)', dataIndex: 'price_per_km' },
    { title: '有电梯楼层费', dataIndex: 'floor_fee_with_elevator' },
    { title: '无电梯楼层费', dataIndex: 'floor_fee_no_elevator' },
    { title: '状态', dataIndex: 'is_active', render: (v: boolean) => v ? '启用' : '停用' },
    {
      title: '操作', render: (_: any, r: any) => (
        <Button size="small" onClick={() => setEditModal({ open: true, vehicle: r })}>编辑</Button>
      ),
    },
  ];

  const colI = [
    { title: '名称', dataIndex: 'name' },
    { title: '附加费 (元/件)', dataIndex: 'additional_fee' },
  ];

  return (
    <div>
      <Typography.Title level={4}>定价管理</Typography.Title>

      <Typography.Title level={5}>车型计价规则</Typography.Title>
      <Table columns={colV} dataSource={vehicles} rowKey="id" pagination={false} style={{ marginBottom: 24 }} />

      <Typography.Title level={5}>大件物品附加费</Typography.Title>
      <Table columns={colI} dataSource={items} rowKey="id" pagination={false} />

      <Modal
        title="编辑车型定价"
        open={editModal.open}
        onCancel={() => setEditModal({ open: false, vehicle: null })}
        onOk={() => {
          const v = editModal.vehicle;
          handleSaveVehicle({
            base_price: v.base_price,
            price_per_km: v.price_per_km,
            floor_fee_with_elevator: v.floor_fee_with_elevator,
            floor_fee_no_elevator: v.floor_fee_no_elevator,
          });
        }}
      >
        {editModal.vehicle && (
          <div>
            <p>车型: {editModal.vehicle.name}</p>
            <div style={{ marginBottom: 8 }}>起步价: <InputNumber value={editModal.vehicle.base_price}
              onChange={v => setEditModal({ ...editModal, vehicle: { ...editModal.vehicle, base_price: v } })} /></div>
            <div style={{ marginBottom: 8 }}>每公里: <InputNumber value={editModal.vehicle.price_per_km}
              onChange={v => setEditModal({ ...editModal, vehicle: { ...editModal.vehicle, price_per_km: v } })} /></div>
            <div style={{ marginBottom: 8 }}>有电梯楼层费: <InputNumber value={editModal.vehicle.floor_fee_with_elevator}
              onChange={v => setEditModal({ ...editModal, vehicle: { ...editModal.vehicle, floor_fee_with_elevator: v } })} /></div>
            <div>无电梯楼层费: <InputNumber value={editModal.vehicle.floor_fee_no_elevator}
              onChange={v => setEditModal({ ...editModal, vehicle: { ...editModal.vehicle, floor_fee_no_elevator: v } })} /></div>
          </div>
        )}
      </Modal>
    </div>
  );
}
