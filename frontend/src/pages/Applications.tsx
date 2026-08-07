import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Space, Input, Select, Drawer, Typography, Rate, message, Avatar } from 'antd';
import { SearchOutlined, CheckOutlined, CloseOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text, Paragraph } = Typography;

interface ApplicationItem {
  id: string;
  applicantName: string;
  email: string;
  internshipTitle: string;
  appliedDate: string;
  score: number;
  status: 'PENDING' | 'UNDER_REVIEW' | 'ACCEPTED' | 'REJECTED';
  notes: string;
}

const Applications: React.FC = () => {
  const [data, setData] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/applications');
      const mapped = res.map((app: any) => ({
        id: app.id,
        applicantName: app.applicant ? `${app.applicant.firstName} ${app.applicant.lastName}` : 'Applicant',
        email: app.applicant ? app.applicant.email : '',
        internshipTitle: app.internship ? app.internship.title : 'Program',
        appliedDate: app.createdAt ? new Date(app.createdAt).toISOString().split('T')[0] : '',
        score: 4.5,
        status: app.status,
        notes: app.notes || 'No review notes provided yet.',
      }));
      setData(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ApplicationItem['status']) => {
    try {
      await apiService.put(`/applications/${id}`, { status: newStatus });
      setData((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
      );
      message.success(`Application marked as ${newStatus}`);
    } catch (err: any) {
      message.error(err.message || 'Failed to update application status');
    }
  };

  const filteredData = data.filter((app) => {
    const matchesSearch = app.applicantName.toLowerCase().includes(searchText.toLowerCase()) || app.internshipTitle.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Applicant',
      dataIndex: 'applicantName',
      key: 'applicantName',
      render: (text: string, record: ApplicationItem) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>{text[0]}</Avatar>
          <div>
            <Text strong style={{ fontSize: 14 }}>{text}</Text>
            <div style={{ fontSize: 12, color: '#64748b' }}>{record.email}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Target Program',
      dataIndex: 'internshipTitle',
      key: 'internshipTitle',
      render: (title: string) => <Tag color="purple">{title}</Tag>,
    },
    {
      title: 'Match Rating',
      dataIndex: 'score',
      key: 'score',
      render: (score: number) => (
        <Space>
          <Rate disabled defaultValue={score} allowHalf style={{ fontSize: 12 }} />
          <Text strong style={{ fontSize: 12 }}>{score}</Text>
        </Space>
      ),
    },
    {
      title: 'Applied On',
      dataIndex: 'appliedDate',
      key: 'appliedDate',
      render: (date: string) => <Text style={{ fontSize: 12, color: '#475569' }}>{date}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          UNDER_REVIEW: 'blue',
          ACCEPTED: 'green',
          REJECTED: 'red',
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ApplicationItem) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedApp(record)}>
            Review
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleStatusChange(record.id, 'ACCEPTED')}
            disabled={record.status === 'ACCEPTED'}
          >
            Accept
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleStatusChange(record.id, 'REJECTED')}
            disabled={record.status === 'REJECTED'}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Internship Applications</Title>
        <Text type="secondary">Review candidate submissions, evaluate portfolio match scores, and update candidate statuses</Text>
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <Input
            placeholder="Search by candidate name or program..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 340, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 160 }}>
            <Select.Option value="ALL">All Applications</Select.Option>
            <Select.Option value="PENDING">Pending</Select.Option>
            <Select.Option value="UNDER_REVIEW">Under Review</Select.Option>
            <Select.Option value="ACCEPTED">Accepted</Select.Option>
            <Select.Option value="REJECTED">Rejected</Select.Option>
          </Select>
        </div>

        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
      </Card>

      {/* Review Drawer */}
      <Drawer
        title="Candidate Application Review"
        width={440}
        onClose={() => setSelectedApp(null)}
        open={Boolean(selectedApp)}
      >
        {selectedApp && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Avatar size={56} style={{ backgroundColor: '#6366f1', fontSize: 20, fontWeight: 700 }}>
                {selectedApp.applicantName[0]}
              </Avatar>
              <div>
                <Title level={4} style={{ margin: 0 }}>{selectedApp.applicantName}</Title>
                <Text type="secondary">{selectedApp.email}</Text>
              </div>
            </div>

            <Card size="small" title="Applied Program">
              <Text strong>{selectedApp.internshipTitle}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>Submitted on {selectedApp.appliedDate}</Text>
            </Card>

            <Card size="small" title="Assessment Notes">
              <Paragraph style={{ margin: 0, fontSize: 13 }}>{selectedApp.notes}</Paragraph>
            </Card>

            <Card size="small" title="Resume Document">
              <Space>
                <FilePdfOutlined style={{ fontSize: 24, color: '#ef4444' }} />
                <div>
                  <Text strong style={{ fontSize: 13 }}>{selectedApp.applicantName}_Resume.pdf</Text>
                  <br />
                  <a href="#download" onClick={(e) => { e.preventDefault(); message.info('Downloading resume...'); }}>Download PDF</a>
                </div>
              </Space>
            </Card>

            <Space style={{ marginTop: 12 }} size="middle">
              <Button type="primary" block icon={<CheckOutlined />} onClick={() => { handleStatusChange(selectedApp.id, 'ACCEPTED'); setSelectedApp(null); }}>
                Accept Candidate
              </Button>
              <Button danger block icon={<CloseOutlined />} onClick={() => { handleStatusChange(selectedApp.id, 'REJECTED'); setSelectedApp(null); }}>
                Reject
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Applications;
