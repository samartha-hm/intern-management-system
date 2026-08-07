import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Avatar, Space, Button, Progress, Typography, Badge } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ArrowUpOutlined,
  PlusOutlined,
  FolderAddOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;

const DEPARTMENT_DATA = [
  { name: 'Engineering', interns: 12 },
  { name: 'Data Science', interns: 8 },
  { name: 'Product UI', interns: 5 },
  { name: 'Marketing', interns: 4 },
  { name: 'DevOps', interns: 3 },
];

const APPLICATION_STATUS_DATA = [
  { name: 'Accepted', value: 18, color: '#10b981' },
  { name: 'Under Review', value: 12, color: '#3b82f6' },
  { name: 'Pending', value: 8, color: '#f59e0b' },
  { name: 'Rejected', value: 5, color: '#ef4444' },
];

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterns: 32,
    activeInternships: 12,
    pendingApplications: 8,
    completedEvaluations: 24,
    avgPerformanceScore: 92,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const columns = [
    {
      title: 'Intern',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <Space>
          <Avatar style={{ backgroundColor: record.avatarColor, fontWeight: 700 }}>
            {text.split(' ').map((n) => n[0]).join('')}
          </Avatar>
          <div>
            <Text strong style={{ display: 'block', fontSize: 13 }}>{text}</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Track / Department',
      dataIndex: 'track',
      key: 'track',
      render: (track: string) => <Tag color="blue">{track}</Tag>,
    },
    {
      title: 'Mentor',
      dataIndex: 'mentor',
      key: 'mentor',
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      render: (pct: number) => (
        <div style={{ width: 120 }}>
          <Progress percent={pct} size="small" status={pct === 100 ? 'success' : 'active'} strokeColor="#6366f1" />
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          Active: 'green',
          Onboarding: 'processing',
          Evaluation: 'purple',
          Completed: 'default',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
  ];

  const recentInterns = [
    { key: '1', name: 'John Doe', email: 'john@experimindlabs.com', track: 'Software Engineering', mentor: 'Jane Smith', progress: 75, status: 'Active', avatarColor: '#6366f1' },
    { key: '2', name: 'Alice Walker', email: 'alice@experimindlabs.com', track: 'Data Science', mentor: 'David Miller', progress: 40, status: 'Onboarding', avatarColor: '#8b5cf6' },
    { key: '3', name: 'Michael Chen', email: 'michael@experimindlabs.com', track: 'Product UI/UX', mentor: 'Sarah Connor', progress: 90, status: 'Evaluation', avatarColor: '#10b981' },
    { key: '4', name: 'Emily Davis', email: 'emily@experimindlabs.com', track: 'DevOps & Cloud', mentor: 'Alex Johnson', progress: 60, status: 'Active', avatarColor: '#f59e0b' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>
            Welcome back, {currentUser?.firstName || 'Team'} 👋
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Here is what's happening with Experimind Labs internship programs today.
          </Text>
        </div>
        <Space size={12}>
          <Link to="/internships">
            <Button type="primary" icon={<PlusOutlined />}>New Internship</Button>
          </Link>
          <Link to="/applications">
            <Button icon={<FileTextOutlined />}>Review Applications ({stats.pendingApplications})</Button>
          </Link>
        </Space>
      </div>

      {/* Metrics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" loading={loading} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Total Interns</Text>
                <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.totalInterns}</Title>
                <Text type="success" style={{ fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <ArrowUpOutlined /> +14% this month
                </Text>
              </div>
              <div className="stat-icon-wrapper" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
                <TeamOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" loading={loading} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Active Programs</Text>
                <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.activeInternships}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>Across 5 Departments</Text>
              </div>
              <div className="stat-icon-wrapper" style={{ background: '#f3e8ff', color: '#9333ea' }}>
                <FileTextOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" loading={loading} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Pending Reviews</Text>
                <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.pendingApplications}</Title>
                <Text style={{ color: '#d97706', fontSize: 12, fontWeight: 600 }}>Needs HR Attention</Text>
              </div>
              <div className="stat-icon-wrapper" style={{ background: '#fef3c7', color: '#d97706' }}>
                <ClockCircleOutlined />
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card" loading={loading} styles={{ body: { padding: 20 } }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Avg Performance</Text>
                <Title level={2} style={{ margin: '4px 0 0 0', fontWeight: 800 }}>{stats.avgPerformanceScore}%</Title>
                <Text type="success" style={{ fontSize: 12, fontWeight: 600 }}>Top Tier Rating</Text>
              </div>
              <div className="stat-icon-wrapper" style={{ background: '#d1fae5', color: '#059669' }}>
                <TrophyOutlined />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Analytics Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={15}>
          <Card title="Intern Distribution by Department" extra={<Tag color="purple">Q3 Cohort</Tag>} loading={loading}>
            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DEPARTMENT_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="interns" fill="url(#colorGradient)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card title="Application Status Pipeline" extra={<Link to="/applications">View All</Link>} loading={loading}>
            <div style={{ height: 260, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={APPLICATION_STATUS_DATA}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {APPLICATION_STATUS_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Active Interns Table */}
      <Card
        title="Active Intern Trackers"
        extra={<Link to="/internships">Manage All Interns</Link>}
        loading={loading}
      >
        <Table
          columns={columns}
          dataSource={recentInterns}
          pagination={false}
          scroll={{ x: 600 }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;