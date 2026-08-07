import React from 'react';
import { Form, Input, Button, Checkbox, message, Card, Typography, Space, Tag, Divider, Modal } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined, CrownOutlined, SafetyCertificateOutlined, TeamOutlined, ReadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const DEMO_ACCOUNTS = [
  { role: 'Admin', email: 'admin@experimindlabs.com', icon: <CrownOutlined style={{ color: '#ef4444' }} />, badge: 'System' },
  { role: 'HR Manager', email: 'hr@experimindlabs.com', icon: <SafetyCertificateOutlined style={{ color: '#8b5cf6' }} />, badge: 'Recruitment' },
  { role: 'Mentor', email: 'mentor@experimindlabs.com', icon: <TeamOutlined style={{ color: '#3b82f6' }} />, badge: 'Engineering' },
  { role: 'Intern', email: 'intern@experimindlabs.com', icon: <ReadOutlined style={{ color: '#10b981' }} />, badge: 'Active' },
];

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const { loading, error, login } = useAuth();
  const navigate = useNavigate();

  const getRoleDefaultPath = (role?: string) => {
    switch (role) {
      case 'ADMIN':
      case 'HR':
        return '/dashboard';
      case 'MENTOR':
        return '/internships';
      case 'INTERN':
        return '/profile';
      default:
        return '/dashboard';
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const res: any = await login(values.email, values.password);
      message.success('Welcome back! Successfully logged in.');
      const userRole = res?.user?.role || 'INTERN';
      navigate(getRoleDefaultPath(userRole), { replace: true });
    } catch (err: any) {
      message.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleQuickDemoLogin = async (email: string, role: string) => {
    form.setFieldsValue({
      email,
      password: 'password123',
    });
    try {
      await login(email, 'password123');
      message.success(`Logged in as ${role}`);
      navigate(getRoleDefaultPath(role), { replace: true });
    } catch (err: any) {
      message.error(typeof err === 'string' ? err : err.message || 'Login failed.');
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 440, zIndex: 1 }}>
        <Card className="auth-card" variant="borderless">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: 'var(--primary-gradient)', marginBottom: 16, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)' }}>
              <RocketOutlined style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Experimind Labs</Title>
            <Text type="secondary" style={{ fontSize: 14 }}>Intern Management Platform</Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
            size="large"
          >
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Please enter your email!' }, { type: 'email', message: 'Enter a valid email address!' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                placeholder="email@experimindlabs.com"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                placeholder="••••••••"
                style={{ borderRadius: 10 }}
              />
            </Form.Item>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 13 }}>Remember me</Checkbox>
              </Form.Item>
              <Button
                type="link"
                onClick={() => Modal.info({
                  title: 'Password Reset Request',
                  content: 'To reset your password, please contact your Experimind Labs administrator or HR manager at hr@experimindlabs.com.',
                })}
                style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, padding: 0 }}
              >
                Forgot password?
              </Button>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44, borderRadius: 10, fontSize: 15, fontWeight: 700 }}
            >
              Sign In to Dashboard
            </Button>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}
          </Form>

          {process.env.REACT_APP_SHOW_DEMO_LOGINS !== 'false' && (
            <>
              <Divider style={{ margin: '24px 0 16px 0', fontSize: 12, color: '#94a3b8' }}>
                ⚡ QUICK DEMO LOGINS (1-CLICK)
              </Divider>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <div
                    key={acc.email}
                    className="demo-account-chip"
                    onClick={() => handleQuickDemoLogin(acc.email, acc.role.includes('Admin') ? 'ADMIN' : acc.role.includes('HR') ? 'HR' : acc.role.includes('Mentor') ? 'MENTOR' : 'INTERN')}
                  >
                    <Space size={6}>
                      {acc.icon}
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{acc.role}</span>
                    </Space>
                    <Tag style={{ fontSize: 10, margin: 0 }}>{acc.badge}</Tag>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#6366f1', fontWeight: 700 }}>Register Now</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;