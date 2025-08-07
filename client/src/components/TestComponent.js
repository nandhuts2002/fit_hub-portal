import React from 'react';

const TestComponent = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Component</h1>
      <p>If you can see this, React is working correctly!</p>
      <p>Current URL: {window.location.pathname}</p>
    </div>
  );
};

export default TestComponent;