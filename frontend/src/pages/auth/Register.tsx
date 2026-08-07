import React from 'react';
import { Form, Input, Button, message, Card, Typography, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, RocketOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { register as registerThunk } from '../../redux/slices/authSlice';
import type { AppDispatch } from '../../redux/store';

const { Title, Text } = Typography;

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const { loading, error } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const onFinish = async (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      await dispatch(
        registerThunk({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        })
      ).unwrap();
      message.success('Intern registration successful! You can now log in.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      message.error(err || 'Registration failed');
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 460, zIndex: 1 }}>
        <Card className="auth-card" variant="borderless">
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 16, background: 'var(--primary-gradient)', marginBottom: 12, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.35)' }}>
              <RocketOutlined style={{ fontSize: 26, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Intern Registration</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Create your intern candidate account to get started</Text>
          </div>

          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            layout="vertical"
            autoComplete="off"
            size="large"
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: 'First name is required!' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="First Name" style={{ borderRadius: 10 }} />
              </Form.Item>

              <Form.Item
                name="lastName"
                rules={[{ required: true, message: 'Last name is required!' }]}
              >
                <Input prefix={<UserOutlined style={{ color: '#94a3b8' }} />} placeholder="Last Name" style={{ borderRadius: 10 }} />
              </Form.Item>
            </div>

            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Email is required!' }, { type: 'email', message: 'Enter a valid email address!' }]}
            >
              <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="email@experimindlabs.com" style={{ borderRadius: 10 }} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password is required!' }, { min: 6, message: 'At least 6 characters!' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password (min. 6 characters)" style={{ borderRadius: 10 }} />
            </Form.Item>

            <div style={{ padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: 12, color: '#64748b' }}>
              🔒 Account role will be set to <strong>INTERN</strong>. Mentor, HR, and Admin roles are provisioned by system administrators.
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{ height: 44, borderRadius: 10, fontSize: 15, fontWeight: 700 }}
            >
              Register as Intern
            </Button>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13 }}>
                {error}
              </div>
            )}
          </Form>

          <Divider style={{ margin: '20px 0 16px 0' }} />

          <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: 700 }}>Log In Here</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;