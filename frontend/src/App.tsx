import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Typography } from 'antd';
import {
  UserOutlined, CarOutlined, DashboardOutlined, LogoutOutlined,
  HomeOutlined, ShoppingCartOutlined, WalletOutlined,
} from '@ant-design/icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminDrivers from './pages/admin/Drivers';
import AdminPricing from './pages/admin/Pricing';
import AdminOrders from './pages/admin/Orders';
import AdminFinance from './pages/admin/Finance';
import AdminCoupons from './pages/admin/Coupons';

// User
import UserHome from './pages/user/Home';
import UserCreateOrder from './pages/user/CreateOrder';
import UserMyOrders from './pages/user/MyOrders';
import UserOrderDetail from './pages/user/OrderDetail';

// Driver
import DriverHome from './pages/driver/Home';
import DriverMyOrders from './pages/driver/MyOrders';
import DriverWallet from './pages/driver/Wallet';
import DriverApply from './pages/driver/Apply';

const { Header, Sider, Content } = Layout;

function AppLayout() {
  const { user, logout, isAdmin } = useAuth();

  if (!user) return null;

  // 根据角色决定默认路由
  const isDriver = user.name?.startsWith('[司机]');

  const roleMenus = isAdmin ? (
    <Menu mode="horizontal" theme="dark" selectedKeys={[location.pathname]} style={{ flex: 1 }}>
      <Menu.Item key="/admin" icon={<DashboardOutlined />}>
        <Link to="/admin">仪表盘</Link>
      </Menu.Item>
      <Menu.Item key="/admin/drivers" icon={<CarOutlined />}>
        <Link to="/admin/drivers">司机管理</Link>
      </Menu.Item>
      <Menu.Item key="/admin/pricing" icon={<ShoppingCartOutlined />}>
        <Link to="/admin/pricing">定价管理</Link>
      </Menu.Item>
      <Menu.Item key="/admin/orders" icon={<HomeOutlined />}>
        <Link to="/admin/orders">订单管理</Link>
      </Menu.Item>
      <Menu.Item key="/admin/finance" icon={<WalletOutlined />}>
        <Link to="/admin/finance">财务对账</Link>
      </Menu.Item>
      <Menu.Item key="/admin/coupons">
        <Link to="/admin/coupons">优惠券</Link>
      </Menu.Item>
    </Menu>
  ) : isDriver ? (
    <Menu mode="horizontal" theme="dark" selectedKeys={[location.pathname]} style={{ flex: 1 }}>
      <Menu.Item key="/driver" icon={<DashboardOutlined />}>
        <Link to="/driver">接单中心</Link>
      </Menu.Item>
      <Menu.Item key="/driver/orders" icon={<HomeOutlined />}>
        <Link to="/driver/orders">我的订单</Link>
      </Menu.Item>
      <Menu.Item key="/driver/wallet" icon={<WalletOutlined />}>
        <Link to="/driver/wallet">我的钱包</Link>
      </Menu.Item>
    </Menu>
  ) : (
    <Menu mode="horizontal" theme="dark" selectedKeys={[location.pathname]} style={{ flex: 1 }}>
      <Menu.Item key="/user" icon={<HomeOutlined />}>
        <Link to="/user">首页</Link>
      </Menu.Item>
      <Menu.Item key="/user/orders" icon={<ShoppingCartOutlined />}>
        <Link to="/user/orders">我的订单</Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16 }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
          🚛 搬家服务
        </Typography.Title>
        {roleMenus}
        <Dropdown menu={{
          items: [
            { key: 'role', label: `${isAdmin ? '管理员' : isDriver ? '司机' : '用户'}: ${user.name}`, disabled: true },
            { type: 'divider' },
            {
              key: 'switch',
              label: isAdmin ? '切换用户视角' : isDriver ? '切换用户视角' : '切换司机视角',
              onClick: () => {
                if (isAdmin) window.location.href = '/user';
                else if (isDriver) window.location.href = '/user';
                else window.location.href = '/driver/apply';
              },
            },
            { key: 'logout', label: '退出登录', icon: <LogoutOutlined />, danger: true, onClick: logout },
          ],
        }}>
          <Button icon={<UserOutlined />} style={{ color: '#fff' }} type="text">
            {user.name}
          </Button>
        </Dropdown>
      </Header>
      <Content style={{ padding: 24, background: '#f5f5f5' }}>
        <Routes>
          {/* Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/drivers" element={<AdminDrivers />} />
          <Route path="/admin/pricing" element={<AdminPricing />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/finance" element={<AdminFinance />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />

          {/* User */}
          <Route path="/user" element={<UserHome />} />
          <Route path="/user/create" element={<UserCreateOrder />} />
          <Route path="/user/orders" element={<UserMyOrders />} />
          <Route path="/user/orders/:id" element={<UserOrderDetail />} />

          {/* Driver */}
          <Route path="/driver" element={<DriverHome />} />
          <Route path="/driver/apply" element={<DriverApply />} />
          <Route path="/driver/orders" element={<DriverMyOrders />} />
          <Route path="/driver/wallet" element={<DriverWallet />} />

          <Route path="*" element={<Navigate to={isAdmin ? '/admin' : isDriver ? '/driver' : '/user'} />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
