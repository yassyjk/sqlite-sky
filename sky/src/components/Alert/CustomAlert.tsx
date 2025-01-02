import React from 'react';
import "./CustomAlert.css";

export interface Message {
    message: string;
    onClose: () => void;
}

const CustomAlert: React.FC<Message> = ({ message, onClose}) => {
  return (
    <div className='custom-alert'>
        <p>{message}</p>
        <button onClick={onClose}>閉じる</button>
    </div>
  );
};

export default CustomAlert;
