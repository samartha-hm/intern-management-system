import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Badge, Popover, List, Typography, Space, Button, Tag } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  FormOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckSquareOutlined,
  IdcardOutlined,
  QrcodeOutlined,
  ProjectOutlined,
  TrophyOutlined,
  FolderOpenOutlined,
  BellOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useAuth } from './contexts/AuthContext';
import apiService from './services/apiService';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Internships from './pages/Internships';
import Applications from './pages/Applications';
import Profile from './pages/Profile';
import Users from './pages/Users';
import Reports from './pages/Reports';
import Attendance from './pages/Attendance';
import WorkDiary from './pages/WorkDiary';
import AttendanceReview from './pages/AttendanceReview';
import WorkDiaryReview from './pages/WorkDiaryReview';
import CheckInQrKiosk from './pages/CheckInQrKiosk';
import CheckOutQrKiosk from './pages/CheckOutQrKiosk';
import NotFound from './pages/NotFound';

const { Header, Content, Footer, Sider } = Layout;
const { Text, Title } = Typography;

const App: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const data = await apiService.get('/notifications/my');
      setNotifications(data);
      const unread = data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch {
      // Ignore notifications error if API fails
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const markNotificationAsRead = async (id: string) => {
    try {
      await apiService.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore error
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;

  const getDefaultRouteForRole = (role?: string) => {
    switch (role) {
      case 'ADMIN':
      case 'HR':
        return '/dashboard';
      case 'MENTOR':
        return '/internships';
      case 'INTERN':
        return '/attendance';
      default:
        return '/dashboard';
    }
  };

  const getMenuItems = () => {
    if (!currentUser) {
      return [
        { key: '/login', icon: <UserOutlined />, label: <Link to="/login">Login</Link> },
        { key: '/register', icon: <UserOutlined />, label: <Link to="/register">Register (Intern)</Link> },
      ];
    }

    const items: any[] = [];

    if (currentUser.role === 'ADMIN' || currentUser.role === 'HR') {
      items.push(
        { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
        { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">Projects & Kanban</Link> },
        { key: '/evaluations', icon: <TrophyOutlined />, label: <Link to="/evaluations">Evaluations</Link> },
        { key: '/documents', icon: <FolderOpenOutlined />, label: <Link to="/documents">Document Vault</Link> },
        { key: '/internships', icon: <TeamOutlined />, label: <Link to="/internships">Internships</Link> },
        { key: '/applications', icon: <FormOutlined />, label: <Link to="/applications">Applications</Link> },
        { key: '/attendance-review', icon: <ClockCircleOutlined />, label: <Link to="/attendance-review">Attendance Audit</Link> },
        { key: '/work-diary-review', icon: <CheckSquareOutlined />, label: <Link to="/work-diary-review">Work Diary Reviews</Link> },
        { key: '/qr-kiosk/entrance', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/entrance">Office Entrance Kiosk</Link> },
        { key: '/qr-kiosk/exit', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/exit">Office Exit Kiosk</Link> },
        { key: '/users', icon: <UserOutlined />, label: <Link to="/users">User Directory</Link> },
        { key: '/reports', icon: <NotificationOutlined />, label: <Link to="/reports">Reports & Compliance</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
      );
    } else if (currentUser.role === 'MENTOR') {
      items.push(
        { key: '/internships', icon: <TeamOutlined />, label: <Link to="/internships">My Interns</Link> },
        { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">Projects & Kanban</Link> },
        { key: '/evaluations', icon: <TrophyOutlined />, label: <Link to="/evaluations">Intern Evaluations</Link> },
        { key: '/documents', icon: <FolderOpenOutlined />, label: <Link to="/documents">Document Vault</Link> },
        { key: '/attendance-review', icon: <ClockCircleOutlined />, label: <Link to="/attendance-review">Attendance Supervision</Link> },
        { key: '/work-diary-review', icon: <CheckSquareOutlined />, label: <Link to="/work-diary-review">Work Diary Approvals</Link> },
        { key: '/qr-kiosk/entrance', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/entrance">Office Entrance Kiosk</Link> },
        { key: '/qr-kiosk/exit', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/exit">Office Exit Kiosk</Link> },
        { key: '/reports', icon: <NotificationOutlined />, label: <Link to="/reports">Reports</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
      );
    } else if (currentUser.role === 'INTERN') {
      items.push(
        { key: '/attendance', icon: <ClockCircleOutlined />, label: <Link to="/attendance">Daily Attendance</Link> },
        { key: '/work-diary', icon: <BookOutlined />, label: <Link to="/work-diary">Daily Work Diary</Link> },
        { key: '/projects', icon: <ProjectOutlined />, label: <Link to="/projects">My Projects & Tasks</Link> },
        { key: '/evaluations', icon: <TrophyOutlined />, label: <Link to="/evaluations">My Scorecard</Link> },
        { key: '/documents', icon: <FolderOpenOutlined />, label: <Link to="/documents">My Documents</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile & Settings</Link> }
      );
    }

    return items;
  };

  const selectedKey = location.pathname === '/' ? getDefaultRouteForRole(currentUser?.role) : location.pathname;

  const notificationContent = (
    <div style={{ width: 340, maxHeight: 400, overflowY: 'auto' }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Notifications</span>
        <Tag color="purple">{unreadCount} Unread</Tag>
      </div>
      <List
        dataSource={notifications}
        locale={{ emptyText: 'No notifications yet' }}
        renderItem={(item) => (
          <List.Item
            style={{
              padding: '10px 12px',
              background: item.isRead ? '#ffffff' : '#f0f9ff',
              borderBottom: '1px solid #f1f5f9',
            }}
            actions={[
              !item.isRead && (
                <Button size="small" type="text" icon={<CheckOutlined style={{ color: '#10b981' }} />} onClick={() => markNotificationAsRead(item.id)} />
              ),
            ]}
          >
            <List.Item.Meta
              title={<Text strong style={{ fontSize: 12 }}>{item.title}</Text>}
              description={
                <div>
                  <Text style={{ fontSize: 11, color: '#475569', display: 'block' }}>{item.message}</Text>
                  <Text style={{ fontSize: 10, color: '#94a3b8' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={240}>
        <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#001529' }}>
          <Title level={4} style={{ color: '#fff', margin: 0, fontWeight: 800 }}>Experimind Labs</Title>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={getMenuItems()} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0, borderBottom: '1px solid #f0f0f0' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '64px', padding: '0 24px' }}>
              <div>
                <span className="ant-typography" style={{ fontSize: 15, fontWeight: 500 }}>
                  Welcome, {currentUser.firstName || ''} {currentUser.lastName || ''} ({currentUser.role})
                </span>
              </div>
              <Space size={20}>
                <Popover content={notificationContent} trigger="click" placement="bottomRight">
                  <Badge count={unreadCount} overflowCount={99}>
                    <Button type="text" icon={<BellOutlined style={{ fontSize: 18, color: '#475569' }} />} />
                  </Badge>
                </Popover>

                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Logout
                </button>
              </Space>
            </div>
          ) : null}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 360 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={!currentUser ? <Login /> : <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />} />
            <Route path="/register" element={!currentUser ? <Register /> : <Navigate to={getDefaultRouteForRole(currentUser.role)} replace />} />

            {/* Protected routes */}
            {currentUser ? (
              <>
                <Route path="/" element={<Navigate to={getDefaultRouteForRole(currentUser.role)} replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/qr-kiosk/entrance" element={<CheckInQrKiosk />} />
                <Route path="/qr-kiosk/exit" element={<CheckOutQrKiosk />} />
                <Route path="/internships" element={<Internships />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/work-diary" element={<WorkDiary />} />
                <Route path="/attendance-review" element={<AttendanceReview />} />
                <Route path="/work-diary-review" element={<WorkDiaryReview />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/users" element={<Users />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="*" element={<NotFound />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </>
            )}
          </Routes>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Experimind Labs Intern Management System © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;