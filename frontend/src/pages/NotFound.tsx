import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import { SmileOutlined } from '@ant-design/icons';

const NotFound: React.FC = () => {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Sorry, the page you visited does not exist."
      extra={<a href="/">Back to home</a>}
      icon={<SmileOutlined />}
    >
      <Button type="primary">
        <Link to="/">Go Home</Link>
      </Button>
    </Result>
  );
};

export default NotFound;