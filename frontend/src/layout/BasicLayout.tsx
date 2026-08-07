import React from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
import { DashboardOutlined, TeamOutlined, FormOutlined, UserOutlined, NotificationOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';

const { Header, Content, Footer, Sider } = Layout;

const BasicLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        breakpoint="lg"
        theme="dark"
        width={200}
      >
        <div className="logo" style={{ height: 64, lineHeight: '64px', background: '#001529', padding: 0, textAlign: 'center' }}>
          <span style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Experimind</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={[location.pathname]}
          style={{ borderRight: 0 }}
        >
          <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
            <Link to="/dashboard">Dashboard</Link>
          </Menu.Item>

          {currentUser && (currentUser.role === 'ADMIN' || currentUser.role === 'HR') && (
            <>
              <Menu.Item key="/internships" icon={<TeamOutlined />}>
                <Link to="/internships">Internships</Link>
              </Menu.Item>
              <Menu.Item key="/applications" icon={<FormOutlined />}>
                <Link to="/applications">Applications</Link>
              </Menu.Item>
              <Menu.Item key="/users" icon={<UserOutlined />}>
                <Link to="/users">Users</Link>
              </Menu.Item>
            </>
          )}

          {currentUser && currentUser.role === 'MENTOR' && (
            <Menu.Item key="/internships" icon={<TeamOutlined />}>
              <Link to="/internships">My Interns</Link>
            </Menu.Item>
          )}

          {currentUser && currentUser.role === 'INTERN' && (
            <>
              <Menu.Item key="/profile" icon={<UserOutlined />}>
                <Link to="/profile">My Profile</Link>
              </Menu.Item>
              <Menu.Item key="/tasks" icon={<FormOutlined />}>
                <Link to="/tasks">My Tasks</Link>
              </Menu.Item>
            </>
          )}

          <Menu.Item key="/reports" icon={<NotificationOutlined />}>
            <Link to="/reports">Reports</Link>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0, borderBottom: '1px solid #e8e8e8' }}>
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', height: '64px', padding: '0 24px' }}>
              <div>
                <span style={{ fontSize: 16, color: 'rgba(0,0,0,.85)' }}>
                  Welcome, {currentUser.firstName} {currentUser.lastName}
                </span>
              </div>
              <div>
                <a onClick={handleLogout} style={{ marginRight: 24, color: '#1890ff', cursor: 'pointer' }}>
                  Logout
                </a>
              </div>
            </div>
          ) : (
            <div style={{ height: 64, lineHeight: '64px' }} />
          )}
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            background: '#fff',
            minHeight: 360,
          }}
        >
          <div style={{ padding: 24, background: '#fff', minHeight: 280 }}>
            {children}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Experimind Labs Intern Management System © {new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default BasicLayout;