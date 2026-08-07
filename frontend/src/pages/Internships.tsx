import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Modal, Form, message, Typography, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, CalendarOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

interface InternshipItem {
  id: string;
  title: string;
  department: string;
  mentor: string;
  mentorId?: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  internsCount: number;
  maxInterns: number;
}

const Internships: React.FC = () => {
  const { currentUser } = useAuth();
  const [data, setData] = useState<InternshipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchInternships = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/internships');
      const mapped = res.map((item: any) => ({
        id: item.id,
        title: item.title,
        department: item.department,
        mentor: item.mentor ? `${item.mentor.firstName} ${item.mentor.lastName}` : 'Unassigned',
        mentorId: item.mentorId,
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        status: item.status,
        internsCount: item.interns ? item.interns.length : 0,
        maxInterns: item.maxInterns || 5,
      }));
      setData(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleCreate = async (values: any) => {
    try {
      await apiService.post('/internships', {
        title: values.title,
        description: values.description || values.title,
        department: values.department,
        mentorId: values.mentorId || currentUser?.id,
        startDate: values.dates ? values.dates[0].toISOString() : new Date().toISOString(),
        endDate: values.dates ? values.dates[1].toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
        maxInterns: values.maxInterns || 5,
      });
      message.success('Internship program created successfully!');
      setIsModalOpen(false);
      form.resetFields();
      fetchInternships();
    } catch (err: any) {
      message.error(err.message || 'Failed to create internship program');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/internships/${id}`);
      message.success('Internship program deleted.');
      fetchInternships();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete internship');
    }
  };

  const filteredData = data.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchText.toLowerCase()) || item.department.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Program Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: InternshipItem) => (
        <div>
          <Text strong style={{ fontSize: 14, color: '#0f172a' }}>{text}</Text>
          <div style={{ fontSize: 12, color: '#64748b' }}>Mentor: {record.mentor}</div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => <Tag color="geekblue" style={{ fontWeight: 600 }}>{dept}</Tag>,
    },
    {
      title: 'Capacity',
      key: 'capacity',
      render: (_: any, record: InternshipItem) => (
        <div style={{ width: 100 }}>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>{record.internsCount} / {record.maxInterns} Allocated</Text>
          <Progress percent={Math.round((record.internsCount / record.maxInterns) * 100)} size="small" strokeColor="#6366f1" />
        </div>
      ),
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_: any, record: InternshipItem) => (
        <Text style={{ fontSize: 12, color: '#475569' }}>
          <CalendarOutlined style={{ marginRight: 4 }} />
          {record.startDate} → {record.endDate}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          ACTIVE: 'green',
          DRAFT: 'gold',
          COMPLETED: 'blue',
          CANCELLED: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: InternshipItem) => (
        <Space size="small">
          <Button size="small" type="link" onClick={() => message.info(`Viewing details for ${record.title}`)}>
            Manage
          </Button>
          <Button size="small" type="text" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Internship Programs</Title>
          <Text type="secondary">Manage cohorts, mentors, and program allocations across departments</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Create Internship Program
        </Button>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder="Search by title or department..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 320, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Space>
            <Text style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}><FilterOutlined /> Status:</Text>
            <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}>
              <Select.Option value="ALL">All Statuses</Select.Option>
              <Select.Option value="ACTIVE">Active</Select.Option>
              <Select.Option value="DRAFT">Draft</Select.Option>
              <Select.Option value="COMPLETED">Completed</Select.Option>
            </Select>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Create Program Modal */}
      <Modal
        title="Create New Internship Program"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create Program"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Program Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="e.g. Full Stack Engineering Program" />
          </Form.Item>

          <Form.Item name="department" label="Department" rules={[{ required: true, message: 'Department is required' }]}>
            <Select placeholder="Select department">
              <Select.Option value="Engineering">Engineering</Select.Option>
              <Select.Option value="Data Science">Data Science</Select.Option>
              <Select.Option value="Product UI">Product UI</Select.Option>
              <Select.Option value="Marketing">Marketing</Select.Option>
              <Select.Option value="DevOps">DevOps</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="mentor" label="Assigned Mentor">
            <Input placeholder="e.g. Jane Smith" />
          </Form.Item>

          <Form.Item name="maxInterns" label="Max Intern Capacity">
            <Input type="number" defaultValue={5} min={1} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Internships;
