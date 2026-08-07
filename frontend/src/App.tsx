import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
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
} from '@ant-design/icons';
import { useAuth } from './contexts/AuthContext';
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

const App: React.FC = () => {
  const { currentUser, loading, logout } = useAuth();
  const location = useLocation();

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
        { key: '/qr-kiosk/entrance', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/entrance">Office Check-In Kiosk</Link> },
        { key: '/qr-kiosk/exit', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/exit">Office Check-Out Kiosk</Link> },
        { key: '/internships', icon: <TeamOutlined />, label: <Link to="/internships">Internships</Link> },
        { key: '/applications', icon: <FormOutlined />, label: <Link to="/applications">Applications</Link> },
        { key: '/attendance-review', icon: <ClockCircleOutlined />, label: <Link to="/attendance-review">Attendance Audit</Link> },
        { key: '/work-diary-review', icon: <CheckSquareOutlined />, label: <Link to="/work-diary-review">Work Diary Reviews</Link> },
        { key: '/users', icon: <UserOutlined />, label: <Link to="/users">User Directory</Link> },
        { key: '/reports', icon: <NotificationOutlined />, label: <Link to="/reports">Reports & Compliance</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
      );
    } else if (currentUser.role === 'MENTOR') {
      items.push(
        { key: '/internships', icon: <TeamOutlined />, label: <Link to="/internships">My Interns</Link> },
        { key: '/qr-kiosk/entrance', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/entrance">Office Check-In Kiosk</Link> },
        { key: '/qr-kiosk/exit', icon: <QrcodeOutlined />, label: <Link to="/qr-kiosk/exit">Office Check-Out Kiosk</Link> },
        { key: '/attendance-review', icon: <ClockCircleOutlined />, label: <Link to="/attendance-review">Attendance Supervision</Link> },
        { key: '/work-diary-review', icon: <CheckSquareOutlined />, label: <Link to="/work-diary-review">Work Diary Approvals</Link> },
        { key: '/reports', icon: <NotificationOutlined />, label: <Link to="/reports">Reports</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile</Link> }
      );
    } else if (currentUser.role === 'INTERN') {
      items.push(
        { key: '/attendance', icon: <ClockCircleOutlined />, label: <Link to="/attendance">Daily Attendance</Link> },
        { key: '/work-diary', icon: <BookOutlined />, label: <Link to="/work-diary">Daily Work Diary</Link> },
        { key: '/profile', icon: <IdcardOutlined />, label: <Link to="/profile">My Profile & Settings</Link> }
      );
    }

    return items;
  };

  const selectedKey = location.pathname === '/' ? getDefaultRouteForRole(currentUser?.role) : location.pathname;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible breakpoint="lg" theme="dark">
        <div className="logo" style={{ height: 64, lineHeight: '64px', background: '#001529', textAlign: 'center' }}>
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Experimind Labs</span>
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
              <div>
                <button
                  onClick={() => logout()}
                  style={{ background: 'none', border: 'none', color: '#1890ff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : null}
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 360 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

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
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/login" replace />} />
              </>
            )}
            <Route path="*" element={<NotFound />} />
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