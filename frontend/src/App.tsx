import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Badge, Popover, List, Typography, Space, Button, Tag, Modal } from 'antd';
import {
  UserOutlined,
  DashboardOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  BookOutlined,
  CheckSquareOutlined,
  IdcardOutlined,
  QrcodeOutlined,
  BellOutlined,
  CheckOutlined,
  DownloadOutlined,
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallAppClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      Modal.info({
        title: 'Install Experimind IMS Web App',
        content: (
          <div style={{ padding: '8px 0', fontSize: 13, lineHeight: 1.6 }}>
            <p><strong>📲 On Mobile (Android / Chrome / Edge):</strong> Tap the 3 dots menu top-right and select <em>"Install App"</em> or <em>"Add to Home Screen"</em>.</p>
            <p><strong>🍏 On iPhone / iPad (Safari):</strong> Tap the Share button at the bottom and select <em>"Add to Home Screen"</em>.</p>
            <p><strong>💻 On Desktop (Chrome / Edge):</strong> Click the install button in your browser address bar or menu.</p>
          </div>
        ),
        okText: 'Got It',
      });
    }
  };

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

    if (currentUser.role === 'ADMIN' || currentUser.role === 'HR' || currentUser.role === 'MENTOR') {
      items.push(
        { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard & Overview</Link> },
        { key: '/internships', icon: <TeamOutlined />, label: <Link to="/internships">Batches & Join Requests</Link> },
        { key: '/users', icon: <UserOutlined />, label: <Link to="/users">Student Directory & Contracts</Link> },
        { key: '/attendance-review', icon: <ClockCircleOutlined />, label: <Link to="/attendance-review">Attendance Supervision</Link> },
        { key: '/work-diary-review', icon: <CheckSquareOutlined />, label: <Link to="/work-diary-review">Work Diary Reviews</Link> },
        { key: '/qr-kiosk/entrance', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/entrance">Entrance Kiosk</Link> },
        { key: '/qr-kiosk/exit', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/exit">Exit Kiosk</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
      );
    } else {
      items.push(
        { key: '/attendance', icon: <ClockCircleOutlined />, label: <Link to="/attendance">Attendance & Tenure</Link> },
        { key: '/work-diary', icon: <BookOutlined />, label: <Link to="/work-diary">My Work Diaries</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
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
              <Space size={16}>
                <Button
                  type="primary"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleInstallAppClick}
                  style={{
                    borderRadius: 6,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    border: 'none',
                    fontWeight: 700,
                  }}
                >
                  Install App
                </Button>

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
                <Route path="/attendance" element={currentUser?.role === 'INTERN' ? <Attendance /> : <Navigate to="/attendance-review" replace />} />
                <Route path="/work-diary" element={currentUser?.role === 'INTERN' ? <WorkDiary /> : <Navigate to="/work-diary-review" replace />} />
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

      {/* Mobile App Bottom Navigation Bar */}
      {currentUser && (
        <nav className="mobile-bottom-nav">
          {currentUser.role === 'INTERN' ? (
            <>
              <Link to="/attendance" className={`mobile-bottom-nav-item ${location.pathname === '/attendance' ? 'active' : ''}`}>
                <ClockCircleOutlined />
                <span>Attendance</span>
              </Link>
              <Link to="/work-diary" className={`mobile-bottom-nav-item ${location.pathname === '/work-diary' ? 'active' : ''}`}>
                <BookOutlined />
                <span>Work Diary</span>
              </Link>
              <Link to="/profile" className={`mobile-bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                <UserOutlined />
                <span>My Profile</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className={`mobile-bottom-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
                <DashboardOutlined />
                <span>Dashboard</span>
              </Link>
              <Link to="/internships" className={`mobile-bottom-nav-item ${location.pathname === '/internships' ? 'active' : ''}`}>
                <TeamOutlined />
                <span>Batches</span>
              </Link>
              <Link to="/attendance-review" className={`mobile-bottom-nav-item ${location.pathname === '/attendance-review' ? 'active' : ''}`}>
                <ClockCircleOutlined />
                <span>Attendance</span>
              </Link>
              <Link to="/work-diary-review" className={`mobile-bottom-nav-item ${location.pathname === '/work-diary-review' ? 'active' : ''}`}>
                <CheckSquareOutlined />
                <span>Reviews</span>
              </Link>
              <Link to="/profile" className={`mobile-bottom-nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
                <UserOutlined />
                <span>Profile</span>
              </Link>
            </>
          )}
        </nav>
      )}
    </Layout>
  );
};

export default App;