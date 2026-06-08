import { HiOutlineX } from 'react-icons/hi';

export default function Modal({ open, onClose, title, children, size = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <HiOutlineX className="text-xl text-gray-500" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
