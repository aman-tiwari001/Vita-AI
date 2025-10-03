import type React from 'react';

const Footer: React.FC = () => {
  return (
    <div className="mt-10 text-center text-sm text-gray-600">
      <p>Vita AI - Smart Wellness Application</p>
      <p className="text-xs">
        Developed by{' '}
        <a
          href="https://www.linkedin.com/in/aman-tiwari001/"
          className="text-blue-500 font-bold underline"
        >
          Aman Tiwari
        </a>
      </p>
    </div>
  );
};

export default Footer;
