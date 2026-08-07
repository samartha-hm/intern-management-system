import React, { useState } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Modal, Form, DatePicker, message, Typography, Badge, Progress } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, TeamOutlined, CalendarOutlined, SolutionOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface InternshipItem {
  id: string;
  title: string;
  department: string;
  mentor: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED';
  internsCount: number;
  maxInterns: number;
}

const INITIAL_DATA: InternshipItem[] = [
  {
    id: '1',
    title: 'Full Stack Software Development',
    department: 'Engineering',
    mentor: 'Jane Smith',
    startDate: '2026-06-01',
    endDate: '2026-12-01',
    status: 'ACTIVE',
    internsCount: 4,
    maxInterns: 5,
  },
  {
    id: '2',
    title: 'Data Science & ML Pipeline',
    department: 'Data Science',
    mentor: 'David Miller',
    startDate: '2026-07-01',
    endDate: '2026-12-31',
    status: 'ACTIVE',
    internsCount: 3,
    maxInterns: 4,
  },
  {
    id: '3',
    title: 'Product UI/UX & Design System',
    department: 'Product UI',
    mentor: 'Sarah Connor',
    startDate: '2026-08-01',
    endDate: '2027-01-31',
    status: 'DRAFT',
    internsCount: 0,
    maxInterns: 3,
  },
  {
    id: '4',
    title: 'DevOps & Cloud Infrastructure',
    department: 'DevOps',
    mentor: 'Alex Johnson',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    status: 'COMPLETED',
    internsCount: 2,
    maxInterns: 2,
  },
];

const Internships: React.FC = () => {
  const [data, setData] = useState<InternshipItem[]>(INITIAL_DATA);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreate = (values: any) => {
    const newProgram: InternshipItem = {
      id: String(data.length + 1),
      title: values.title,
      department: values.department,
      mentor: values.mentor || 'Assigned Lead',
      startDate: values.dates ? values.dates[0].format('YYYY-MM-DD') : '2026-09-01',
      endDate: values.dates ? values.dates[1].format('YYYY-MM-DD') : '2027-03-01',
      status: 'ACTIVE',
      internsCount: 0,
      maxInterns: values.maxInterns || 3,
    };
    setData([newProgram, ...data]);
    setIsModalOpen(false);
    form.resetFields();
    message.success('Internship program created successfully!');
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
          <Button size="small" type="text" danger onClick={() => setData(data.filter((d) => d.id !== record.id))}>
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
          pagination={{ pageSize: 6 }}
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
