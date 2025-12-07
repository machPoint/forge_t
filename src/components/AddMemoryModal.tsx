import React, { useState } from 'react';

interface AddMemoryModalProps {
  isOpen: boolean;
  onSave: (data: { title: string; content: string; tags: string[] }) => void;
  onClose: () => void;
}

const AddMemoryModal: React.FC<AddMemoryModalProps> = ({ isOpen, onSave, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }
    setError('');
    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    onSave({ title: title.trim(), content: content.trim(), tags: tagList });
    setTitle('');
    setContent('');
    setTags('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-[#18181b] rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-white">Add Memory</h2>
        <input
          type="text"
          className="w-full p-2 rounded bg-[#23232a] text-white border border-gray-600 mb-2"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          className="w-full p-2 rounded bg-[#23232a] text-white border border-gray-600 mb-2 min-h-[100px]"
          placeholder="Content"
          value={content}
          onChange={e => setContent(e.target.value)}
        />
        <input
          type="text"
          className="w-full p-2 rounded bg-[#23232a] text-white border border-gray-600 mb-2"
          placeholder="Tags (comma separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded"
            onClick={handleSave}
          >
            Save
          </button>
          <button
            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemoryModal; 