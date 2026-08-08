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
    <div className="auth-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '85vh', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 440, zIndex: 1 }}>
        <Card
          className="auth-card"
          variant="borderless"
          style={{
            borderRadius: 20,
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
            padding: '12px 8px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', marginBottom: 16, boxShadow: '0 10px 25px rgba(99, 102, 241, 0.35)' }}>
              <RocketOutlined style={{ fontSize: 30, color: '#fff' }} />
            </div>
            <Title level={3} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Intern Candidate Registration</Title>
            <Text type="secondary" style={{ fontSize: 13 }}>Create your account to request enrollment in an internship batch</Text>
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
              <Input prefix={<MailOutlined style={{ color: '#94a3b8' }} />} placeholder="your.email@experimindlabs.com" style={{ borderRadius: 10 }} />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password is required!' }, { min: 6, message: 'At least 6 characters!' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#94a3b8' }} />} placeholder="Password (min. 6 characters)" style={{ borderRadius: 10 }} />
            </Form.Item>

            <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 20, fontSize: 12, color: '#64748b' }}>
              🔒 Account role will be set to <strong>INTERN</strong>. Admin & Mentor accounts are provisioned directly by system administrators.
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
              Register as Intern Candidate
            </Button>

            {error && (
              <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', fontSize: 13, textAlign: 'center' }}>
                {error}
              </div>
            )}
          </Form>

          <Divider style={{ margin: '24px 0 16px 0' }} />

          <div style={{ textAlign: 'center', fontSize: 13, color: '#64748b' }}>
            Already have an account? <Link to="/login" style={{ color: '#6366f1', fontWeight: 700 }}>Log In Here</Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Register;