import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Button, Typography, Space, Tag, Table, message } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, RiseOutlined } from '@ant-design/icons';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import apiService from '../services/apiService';

const { Title, Text } = Typography;

const COHORT_ATTENDANCE_DATA = [
  { month: 'Jan', compliance: 92, totalHours: 1450 },
  { month: 'Feb', compliance: 94, totalHours: 1520 },
  { month: 'Mar', compliance: 96, totalHours: 1680 },
  { month: 'Apr', compliance: 95, totalHours: 1610 },
  { month: 'May', compliance: 97, totalHours: 1740 },
  { month: 'Jun', compliance: 98, totalHours: 1820 },
];

const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const res = await apiService.get('/attendance');
      const data = Array.isArray(res) ? res : (res?.data || []);
      
      // Group by user
      const userMap: Record<string, any> = {};
      data.forEach((r: any) => {
        const userId = r.userId;
        const userName = r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Intern';
        const dept = r.user ? r.user.department || 'Engineering' : 'General';
        
        if (!userMap[userId]) {
          userMap[userId] = {
            key: userId,
            intern: userName,
            department: dept,
            presentDays: 0,
            totalDays: 0,
            lateDays: 0,
            totalHours: 0,
          };
        }
        
        userMap[userId].totalDays += 1;
        if (r.status === 'PRESENT') userMap[userId].presentDays += 1;
        if (r.status === 'LATE') {
          userMap[userId].presentDays += 1;
          userMap[userId].lateDays += 1;
        }
        userMap[userId].totalHours += (r.workHours || 8.0);
      });

      const list = Object.values(userMap).map((item) => ({
        ...item,
        compliancePct: Math.round((item.presentDays / Math.max(1, item.totalDays)) * 1000) / 10,
        totalHours: Math.round(item.totalHours * 10) / 10,
      }));

      setReportData(list);
    } catch (err: any) {
      message.error(err.message || 'Failed to load report compliance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      message.warning('No report data available to export');
      return;
    }
    const headers = ['Intern Name', 'Department', 'Present Days', 'Total Days', 'Late Days', 'Compliance %', 'Total Hours'];
    const rows = reportData.map((r) => [r.intern, r.department, r.presentDays, r.totalDays, r.lateDays, `${r.compliancePct}%`, r.totalHours]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `experimind_attendance_compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('Compliance report exported as CSV!');
  };
  const columns = [
    {
      title: 'Intern',
      dataIndex: 'intern',
      key: 'intern',
      render: (name: string) => <Text strong style={{ fontSize: 13 }}>{name}</Text>,
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept: string) => <Tag color="blue">{dept}</Tag>,
    },
    {
      title: 'Days Attended',
      key: 'daysAttended',
      render: (_: any, record: any) => (
        <Text style={{ fontSize: 12 }}>
          {record.presentDays} / {record.totalDays} Days ({record.lateDays} Late)
        </Text>
      ),
    },
    {
      title: 'Compliance %',
      dataIndex: 'compliancePct',
      key: 'compliancePct',
      render: (pct: number) => <Tag color={pct >= 95 ? 'green' : 'gold'} style={{ fontWeight: 700 }}>{pct}%</Tag>,
    },
    {
      title: 'Total Work Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hrs: number) => <Text strong style={{ color: '#059669' }}>{hrs} hrs</Text>,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>Reports & Compliance</Title>
          <Text type="secondary">Attendance compliance tracking, total logged work hours, and exportable monthly summaries</Text>
        </div>
        <Space>
          <Button icon={<FileExcelOutlined style={{ color: '#10b981' }} />} onClick={handleExportCSV}>Export CSV</Button>
          <Button type="primary" icon={<FilePdfOutlined />} onClick={handleExportCSV}>Export PDF / Print</Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic title="Attendance Compliance" value={96.5} suffix="%" prefix={<RiseOutlined style={{ color: '#10b981' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic title="Total Work Hours Logged" value={1820} prefix={<ClockCircleOutlined style={{ color: '#6366f1' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic title="Work Diaries Approved" value={142} prefix={<CheckCircleOutlined style={{ color: '#f59e0b' }} />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card styles={{ body: { padding: 20 } }}>
            <Statistic title="Active Program Mentors" value={14} prefix={<TeamOutlined style={{ color: '#8b5cf6' }} />} />
          </Card>
        </Col>
      </Row>

      <Card title="Monthly Attendance & Work Hours Trend">
        <div style={{ height: 260, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={COHORT_ATTENDANCE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="compliance" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#scoreGradient)" name="Attendance Compliance %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Generated Report Logs" styles={{ body: { padding: 20 } }}>
        <Table columns={columns} dataSource={reportData} rowKey="key" loading={loading} pagination={{ pageSize: 8 }} scroll={{ x: 'max-content' }} />
      </Card>
    </div>
  );
};

export default Reports;
