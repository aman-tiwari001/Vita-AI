import type React from 'react';
import { BiUser } from 'react-icons/bi';

const Topbar: React.FC = () => {
  return (
    <div className="w-full mx-auto mb-4 bg-gradient-to-l from-pink-500 text-white to-pink-600 rounded-xl flex items-center justify-between gap-2 py-2 px-4 shadow-xl">
      <h1 className="text-2xl font-bold flex items-center">
        <img
          src="/logo.png"
          alt="Vita AI Logo"
          className="inline-block w-10 h-10 mr-2 bg-pink-100 rounded-full p-1"
        />
        Vita AI
      </h1>
      <BiUser size={26} />
    </div>
  );
};

export default Topbar;
