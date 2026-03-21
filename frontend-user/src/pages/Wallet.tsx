import { useState } from 'react';

export default function Wallet() {
  const [message, setMessage] = useState('');

  const handleError = (err: Error) => {
    setMessage(`Error: ${err.message}`);
  };

  return <div><h1>Wallet</h1></div>;
}
