import React from 'react';
import { Form, Input, Button, Checkbox, message, Card, Typography, Modal } from 'antd';
import { UserOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Login: React.FC = () => {
  const [form] = Form.useForm();
  const { loading, error, login } = useAuth();
  const navigate = useNavigate();

  const getRoleDefaultPath = (role: string, email?: string) => {
    if (role === 'KIOSK' || email?.toLowerCase() === 'kiosk@experimindlabs.com') {
      return '/kiosk-swipe';
    }
    switch (role) {
      case 'ADMIN':
      case 'HR':
      case 'MENTOR':
        return '/dashboard';
      case 'INTERN':
        return '/attendance';
      default:
        return '/dashboard';
    }
  };

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const res: any = await login(values.email, values.password);
      message.success('Welcome back! Successfully logged in.');
      const userRole = res?.user?.role || 'INTERN';
      const userEmail = res?.user?.email || values.email;
      navigate(getRoleDefaultPath(userRole, userEmail), { replace: true });
    } catch (err: any) {
      message.error(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420, zIndex: 1 }}>
        <Card
          className="auth-card"
          variant="borderless"
          style={{
            borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            padding: '12px 8px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', marginBottom: 16, boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)' }}>
              <RocketOutlined style={{ fontSize: 30, color: '#fff' }} />
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
                placeholder="your.email@experimindlabs.com"
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

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox style={{ fontSize: 13, color: '#64748b' }}>Remember me</Checkbox>
              </Form.Item>
              <Button
                type="link"
                onClick={() => Modal.info({
                  title: 'Password Reset Request',
                  content: 'To reset your password, please contact your Experimind Labs administrator or supervisor at admin@experimindlabs.com.',
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
              style={{
                height: 46,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                borderColor: '#4f46e5',
                boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
              }}
            >
              Sign In to Dashboard
            </Button>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}
          </Form>

          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#6366f1', fontWeight: 700 }}>Register Now</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;