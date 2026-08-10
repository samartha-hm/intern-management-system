import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Modal, Form, message, Typography, Tabs, List, Avatar, Popconfirm, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, CalendarOutlined, UserAddOutlined, DeleteOutlined, SettingOutlined, TeamOutlined } from '@ant-design/icons';
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
  assignedInterns?: any[];
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

  // Manage Batch Modal State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [selectedManageBatch, setSelectedManageBatch] = useState<any>(null);
  const [batchInternsList, setBatchInternsList] = useState<any[]>([]);
  const [availableInternsList, setAvailableInternsList] = useState<any[]>([]);
  const [selectedAddInternId, setSelectedAddInternId] = useState<string>('');
  const [manageForm] = Form.useForm();

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
        internsCount: item.assignedInterns ? item.assignedInterns.length : (item.interns ? item.interns.length : 0),
        assignedInterns: item.assignedInterns || item.interns || [],
        maxInterns: item.maxInterns || 999,
      }));
      setData(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableInterns = async () => {
    try {
      const users = await apiService.get('/users');
      const internsOnly = users.filter((u: any) => u.role === 'INTERN');
      setAvailableInternsList(internsOnly);
    } catch {
      // Ignore
    }
  };

  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [customDays, setCustomDays] = useState<number>(65);

  const fetchBatchRequests = async () => {
    try {
      setRequestsLoading(true);
      const reqs = await apiService.get('/users/batch-requests');
      setRequests(reqs);
    } catch {
      // Ignore error
    } finally {
      setRequestsLoading(false);
    }
  };

  const [mentors, setMentors] = useState<any[]>([]);

  const fetchMentors = async () => {
    try {
      const users = await apiService.get('/users');
      const filtered = users
        .filter((u: any) => u.role === 'MENTOR' || u.role === 'ADMIN')
        .map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          role: u.role,
          email: u.email,
        }));
      setMentors(filtered);
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchInternships();
    fetchBatchRequests();
    fetchMentors();
    fetchAvailableInterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenManageModal = (record: InternshipItem) => {
    setSelectedManageBatch(record);
    setBatchInternsList(record.assignedInterns || []);
    manageForm.setFieldsValue({
      title: record.title,
      department: record.department,
      mentorId: record.mentorId,
      status: record.status,
      startDate: record.startDate,
      endDate: record.endDate,
    });
    setIsManageModalOpen(true);
  };

  const handleUpdateBatchSettings = async (values: any) => {
    if (!selectedManageBatch) return;
    try {
      await apiService.put(`/internships/${selectedManageBatch.id}`, {
        title: values.title,
        department: values.department,
        mentorId: values.mentorId,
        status: values.status,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      });
      message.success('Batch settings updated successfully!');
      setIsManageModalOpen(false);
      fetchInternships();
    } catch (err: any) {
      message.error(err.message || 'Failed to update batch');
    }
  };

  const handleAddInternToBatchSubmit = async () => {
    if (!selectedManageBatch || !selectedAddInternId) return;
    try {
      await apiService.post(`/internships/${selectedManageBatch.id}/assign-intern`, {
        internId: selectedAddInternId,
      });
      message.success('Intern added to batch successfully!');
      setSelectedAddInternId('');
      fetchInternships();
      setIsManageModalOpen(false);
    } catch (err: any) {
      message.error(err.message || 'Failed to add intern');
    }
  };

  const handleRemoveInternFromBatchSubmit = async (internId: string) => {
    if (!selectedManageBatch) return;
    try {
      await apiService.delete(`/internships/${selectedManageBatch.id}/interns/${internId}`);
      message.success('Intern removed from batch');
      setBatchInternsList((prev) => prev.filter((i) => i.id !== internId));
      fetchInternships();
    } catch (err: any) {
      message.error(err.message || 'Failed to remove intern');
    }
  };

  const handleApproveRequest = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedStudent) return;
    try {
      await apiService.put(`/users/${selectedStudent.id}/batch-status`, {
        status,
        contractDays: customDays,
      });
      message.success(`Student request ${status === 'APPROVED' ? 'Approved' : 'Rejected'}!`);
      setApproveModalOpen(false);
      fetchBatchRequests();
      fetchInternships();
    } catch (err: any) {
      message.error(err.message || 'Action failed');
    }
  };

  const handleCreate = async (values: any) => {
    try {
      await apiService.post('/internships', {
        title: values.title,
        description: values.title,
        department: values.department || 'General',
        mentorId: values.mentorId || currentUser?.id,
        startDate: values.startDate ? new Date(values.startDate).toISOString() : undefined,
        endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
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
      render: (dept: string) => <Tag color="geekblue" style={{ fontWeight: 600 }}>{dept || 'General'}</Tag>,
    },
    {
      title: 'Enrolled Interns',
      key: 'capacity',
      render: (_: any, record: InternshipItem) => (
        <Tag color="purple" style={{ fontWeight: 700 }}>
          {record.internsCount} Interns Enrolled
        </Tag>
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
          <Button size="small" type="primary" ghost onClick={() => handleOpenManageModal(record)}>
            Manage
          </Button>
          <Button size="small" type="text" danger onClick={() => handleDelete(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const requestColumns = [
    {
      title: 'Student Name',
      key: 'name',
      render: (r: any) => (
        <div>
          <Text strong>{r.firstName} {r.lastName}</Text>
          <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>{r.email}</Text>
        </div>
      ),
    },
    {
      title: 'Requested Batch',
      key: 'batch',
      render: (r: any) => <Tag color="blue">{r.assignedBatch?.title || 'Unknown Batch'}</Tag>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (d: string) => <Tag color="purple">{d || 'Engineering'}</Tag>,
    },
    {
      title: 'Action & Custom Tenure',
      key: 'action',
      render: (r: any) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => {
              setSelectedStudent(r);
              setCustomDays(r.contractDays || 65);
              setApproveModalOpen(true);
            }}
          >
            Accept & Set Days
          </Button>
          <Button
            danger
            size="small"
            onClick={async () => {
              setSelectedStudent(r);
              handleApproveRequest('REJECTED');
            }}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Internship Cohorts & Batch Control</Title>
          <Text type="secondary">Manage active batches and approve student join requests with customizable contract days</Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          Create Internship Program
        </Button>
      </div>

      {/* Pending Student Join Requests */}
      <Card title="Pending Student Batch Join Requests" styles={{ body: { padding: 16 } }}>
        <Table
          columns={requestColumns}
          dataSource={requests}
          rowKey="id"
          loading={requestsLoading}
          pagination={false}
          locale={{ emptyText: 'No pending student join requests' }}
        />
      </Card>

      <Card title="Active Internship Batches" styles={{ body: { padding: 20 } }}>
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

      {/* Approve Request Modal with Custom Contract Days */}
      <Modal
        title={`Approve Join Request — ${selectedStudent?.firstName} ${selectedStudent?.lastName}`}
        open={approveModalOpen}
        onCancel={() => setApproveModalOpen(false)}
        onOk={() => handleApproveRequest('APPROVED')}
        okText="Approve Student & Set Contract"
      >
        <div style={{ padding: '12px 0' }}>
          <Text style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Custom Contract Duration for this Student (in Days):
          </Text>
          <Input
            type="number"
            value={customDays}
            onChange={(e) => setCustomDays(Number(e.target.value))}
            placeholder="e.g. 60, 90, 45"
            style={{ width: '100%' }}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
            Customize the contract tenure duration specifically for this student.
          </Text>
        </div>
      </Modal>

      {/* Create Program Modal */}
      <Modal
        title="Create New Internship Program"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Create Program"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item name="title" label="Program Title" rules={[{ required: true, message: 'Program Title is required' }]}>
            <Input placeholder="e.g. Full Stack Engineering Program" />
          </Form.Item>

          <Form.Item name="department" label="Department (Optional)">
            <Select placeholder="Select department (Optional)" allowClear>
              <Select.Option value="Engineering">Engineering</Select.Option>
              <Select.Option value="Data Science">Data Science</Select.Option>
              <Select.Option value="Product UI">Product UI</Select.Option>
              <Select.Option value="Marketing">Marketing</Select.Option>
              <Select.Option value="DevOps">DevOps</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="mentorId" label="Assigned Mentor (Optional)">
            <Select placeholder="Select existing mentor (Optional)" allowClear>
              {mentors.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.role}) — {m.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="Start Date (Set by Mentor)">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="End Date (Set by Mentor)">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Manage Internship Program Modal */}
      <Modal
        title={`Manage Internship Program — ${selectedManageBatch?.title}`}
        open={isManageModalOpen}
        onCancel={() => setIsManageModalOpen(false)}
        footer={null}
        width={560}
      >
        <Tabs
          defaultActiveKey="roster"
          items={[
            {
              key: 'roster',
              label: (
                <span>
                  <TeamOutlined style={{ marginRight: 6 }} /> Enrolled Interns ({batchInternsList.length})
                </span>
              ),
              children: (
                <div style={{ padding: '12px 0' }}>
                  <List
                    dataSource={batchInternsList}
                    locale={{ emptyText: 'No interns currently enrolled in this batch' }}
                    renderItem={(intern: any) => (
                      <List.Item
                        actions={[
                          <Popconfirm
                            title="Remove from batch?"
                            onConfirm={() => handleRemoveInternFromBatchSubmit(intern.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
                              Remove
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <List.Item.Meta
                          avatar={<Avatar style={{ backgroundColor: '#6366f1', fontWeight: 700 }}>{intern.firstName?.[0] || 'I'}</Avatar>}
                          title={<Text strong>{intern.firstName} {intern.lastName}</Text>}
                          description={<Text type="secondary" style={{ fontSize: 12 }}>{intern.email} — {intern.contractDays || 65} Days Contract</Text>}
                        />
                      </List.Item>
                    )}
                  />
                </div>
              ),
            },
            {
              key: 'add',
              label: (
                <span>
                  <UserAddOutlined style={{ marginRight: 6 }} /> Add Intern
                </span>
              ),
              children: (
                <div style={{ padding: '16px 0' }}>
                  <Text style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
                    Select Student Intern to Assign to this Batch:
                  </Text>
                  <Select
                    placeholder="Select active intern..."
                    style={{ width: '100%', marginBottom: 16 }}
                    value={selectedAddInternId}
                    onChange={setSelectedAddInternId}
                    allowClear
                  >
                    {availableInternsList
                      .filter((u: any) => u.assignedBatchId !== selectedManageBatch?.id)
                      .map((u: any) => (
                        <Select.Option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName} ({u.email})
                        </Select.Option>
                      ))}
                  </Select>
                  <Button
                    type="primary"
                    block
                    icon={<UserAddOutlined />}
                    disabled={!selectedAddInternId}
                    onClick={handleAddInternToBatchSubmit}
                    style={{ height: 42, fontWeight: 700 }}
                  >
                    Add Selected Intern to Batch
                  </Button>
                </div>
              ),
            },
            {
              key: 'settings',
              label: (
                <span>
                  <SettingOutlined style={{ marginRight: 6 }} /> Edit Settings
                </span>
              ),
              children: (
                <Form form={manageForm} layout="vertical" onFinish={handleUpdateBatchSettings} style={{ marginTop: 12 }}>
                  <Form.Item name="title" label="Program Title" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="department" label="Department">
                    <Select allowClear>
                      <Select.Option value="Engineering">Engineering</Select.Option>
                      <Select.Option value="Data Science">Data Science</Select.Option>
                      <Select.Option value="Product UI">Product UI</Select.Option>
                      <Select.Option value="Marketing">Marketing</Select.Option>
                      <Select.Option value="DevOps">DevOps</Select.Option>
                    </Select>
                  </Form.Item>

                  <Form.Item name="mentorId" label="Assigned Mentor">
                    <Select allowClear>
                      {mentors.map((m) => (
                        <Select.Option key={m.id} value={m.id}>
                          {m.name} ({m.role}) — {m.email}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item name="status" label="Batch Status">
                    <Select>
                      <Select.Option value="ACTIVE">ACTIVE</Select.Option>
                      <Select.Option value="DRAFT">DRAFT</Select.Option>
                      <Select.Option value="COMPLETED">COMPLETED</Select.Option>
                    </Select>
                  </Form.Item>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="startDate" label="Start Date (Set by Mentor)">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="endDate" label="End Date (Set by Mentor)">
                        <Input type="date" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Button type="primary" htmlType="submit" block style={{ height: 42, fontWeight: 700, marginTop: 8 }}>
                    Save Batch Settings
                  </Button>
                </Form>
              ),
            },
          ]}
        />
      </Modal>
    </div>
  );
};

export default Internships;
