import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Space, Input, Button, Modal, Typography, Avatar, message, Form, Rate } from 'antd';
import { SearchOutlined, CheckOutlined, MessageOutlined, CheckSquareOutlined, StarOutlined } from '@ant-design/icons';
import apiService from '../services/apiService';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ReviewDiaryItem {
  id: string;
  internName: string;
  department: string;
  date: string;
  tasksDone: string;
  hoursSpent: number;
  status: 'SUBMITTED' | 'REVIEWED' | 'APPROVED';
  feedback?: string;
}

const WorkDiaryReview: React.FC = () => {
  const [logs, setLogs] = useState<ReviewDiaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<ReviewDiaryItem | null>(null);
  const [form] = Form.useForm();

  const fetchWorkDiariesForReview = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/work-diary');
      const mapped: ReviewDiaryItem[] = data.map((d: any) => ({
        id: d.id,
        internName: d.user ? `${d.user.firstName} ${d.user.lastName}` : 'Intern',
        department: d.user ? d.user.department || 'Engineering' : 'General',
        date: d.date ? new Date(d.date).toISOString().split('T')[0] : '',
        tasksDone: d.tasksDone,
        hoursSpent: d.hoursSpent != null ? d.hoursSpent : 8.0,
        status: d.status,
        feedback: d.feedback,
      }));
      setLogs(mapped);
    } catch (err: any) {
      message.error(err.message || 'Failed to load work diaries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkDiariesForReview();
  }, []);

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleApproveSingle = async (id: string, feedbackTxt?: string) => {
    try {
      await apiService.put(`/work-diary/${id}/review`, {
        feedback: feedbackTxt || 'Approved by Mentor/Manager.',
        status: 'APPROVED',
      });
      setLogs((prev) =>
        prev.map((log) => (log.id === id ? { ...log, status: 'APPROVED', feedback: feedbackTxt || 'Approved.' } : log))
      );
      setSelectedEntry(null);
      form.resetFields();
      message.success('Work diary entry approved!');
    } catch (err: any) {
      message.error(err.message || 'Failed to approve work diary');
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await Promise.all(
        selectedRowKeys.map((id) =>
          apiService.put(`/work-diary/${id}/review`, {
            feedback: 'Bulk Approved by Manager.',
            status: 'APPROVED',
          })
        )
      );
      setLogs((prev) =>
        prev.map((log) => (selectedRowKeys.includes(log.id) ? { ...log, status: 'APPROVED', feedback: 'Bulk Approved by Manager.' } : log))
      );
      message.success(`Successfully bulk approved ${selectedRowKeys.length} work diary entries!`);
      setSelectedRowKeys([]);
    } catch (err: any) {
      message.error(err.message || 'Bulk approval failed');
    }
  };

  const filtered = logs.filter((l) => l.internName.toLowerCase().includes(searchText.toLowerCase()) || l.tasksDone.toLowerCase().includes(searchText.toLowerCase()));

  const columns = [
    {
      title: 'Intern',
      dataIndex: 'internName',
      key: 'internName',
      render: (name: string, record: ReviewDiaryItem) => (
        <Space>
          <Avatar style={{ backgroundColor: '#6366f1' }}>{name[0]}</Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>{name}</Text>
            <div style={{ fontSize: 11, color: '#64748b' }}>{record.department}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Hours',
      dataIndex: 'hoursSpent',
      key: 'hoursSpent',
      render: (h: number) => <Tag color="purple">{h} hrs</Tag>,
    },
    {
      title: 'Work Summary (Check-Out Log)',
      dataIndex: 'tasksDone',
      key: 'tasksDone',
      render: (txt: string) => <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: 12 }}>{txt}</Paragraph>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={status === 'APPROVED' ? 'green' : 'gold'}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ReviewDiaryItem) => (
        <Space>
          <Button size="small" icon={<MessageOutlined />} onClick={() => { setSelectedEntry(record); form.setFieldsValue({ feedback: record.feedback || '' }); }}>
            Review Log
          </Button>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApproveSingle(record.id)} disabled={record.status === 'APPROVED'}>
            Approve
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Work Diary Approvals Workspace</Title>
          <Text type="secondary">Review and bulk approve check-out work summaries submitted by your interns</Text>
        </div>
        {selectedRowKeys.length > 0 && (
          <Button type="primary" icon={<CheckSquareOutlined />} onClick={handleBulkApprove} style={{ height: 40, fontWeight: 700, borderRadius: 8 }}>
            Bulk Approve ({selectedRowKeys.length} Selected)
          </Button>
        )}
      </div>

      <Card styles={{ body: { padding: 20 } }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Input
            placeholder="Search by intern or work summary..."
            prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
            style={{ width: 320, borderRadius: 8 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>

        <Table
          rowSelection={{
            selectedRowKeys,
            onChange: (newRowKeys) => setSelectedRowKeys(newRowKeys),
          }}
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Review Modal */}
      <Modal
        title={`Review Work Diary — ${selectedEntry?.internName} (${selectedEntry?.date})`}
        open={Boolean(selectedEntry)}
        onCancel={() => setSelectedEntry(null)}
        onOk={() => form.submit()}
        okText="Approve Entry"
      >
        {selectedEntry && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
            <Card size="small" title="Work Accomplishment Summary">
              <Text style={{ fontSize: 13 }}>{selectedEntry.tasksDone}</Text>
            </Card>

            <Form form={form} layout="vertical" onFinish={(vals) => handleApproveSingle(selectedEntry.id, vals.rating ? `[⭐ ${vals.rating}/5 Stars] ${vals.feedback || ''}` : vals.feedback)}>
              <Form.Item name="rating" label={<span style={{ fontWeight: 700 }}>Performance Rating</span>} initialValue={5}>
                <Rate allowHalf character={<StarOutlined />} style={{ color: '#f59e0b', fontSize: 24 }} />
              </Form.Item>

              <Form.Item name="feedback" label={<span style={{ fontWeight: 700 }}>Mentor Feedback / Notes</span>}>
                <TextArea rows={3} placeholder="Great job! Keep up the good work..." />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WorkDiaryReview;
