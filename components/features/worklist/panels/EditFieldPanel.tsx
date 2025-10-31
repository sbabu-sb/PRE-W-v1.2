import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import DrawerPanel from '../../../common/DrawerPanel';
import InputField from '../../../common/InputField';

interface EditFieldPanelProps {
  isOpen: boolean;
  onClose: () => void;
  columnId: string;
  fieldName: string;
  fieldDescription: string;
  currentRating: number;
  onSave: (newName: string, newRating: number) => void;
  onDelete: () => void;
}

const RatingSelector: React.FC<{ rating: number; setRating: (r: number) => void }> = ({ rating, setRating }) => (
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map(level => (
      <button
        key={level}
        type="button"
        onClick={() => setRating(level)}
        className={`w-full p-2 border rounded-md flex items-center justify-between text-left transition-colors ${rating === level ? 'bg-blue-50 border-blue-400' : 'hover:bg-gray-50'}`}
      >
        <span className="text-sm font-medium text-gray-700">Level {level}</span>
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={`h-4 w-4 rounded-full ${i < level ? 'bg-blue-500' : 'bg-gray-300'}`}></span>
          ))}
        </div>
      </button>
    ))}
  </div>
);

const EditFieldPanel: React.FC<EditFieldPanelProps> = ({
  isOpen, onClose, columnId, fieldName, fieldDescription, currentRating, onSave, onDelete
}) => {
  const [name, setName] = useState(fieldName);
  const [rating, setRating] = useState(currentRating);

  useEffect(() => {
    if (isOpen) {
        setName(fieldName);
        setRating(currentRating);
    }
  }, [isOpen, fieldName, currentRating]);

  const handleSave = () => {
    onSave(name, rating);
    onClose();
  };
  
  const handleDelete = () => {
    if(window.confirm(`Are you sure you want to delete the "${fieldName}" field? All associated data will be removed.`)) {
        onDelete();
        onClose();
    }
  };

  const footer = (
    <div className="flex justify-between items-center">
      <button onClick={handleDelete} className="flex items-center gap-2 text-sm text-red-600 font-semibold hover:text-red-800">
        <Trash2 className="h-4 w-4" /> Delete field
      </button>
      <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700">
        Save Changes
      </button>
    </div>
  );

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="All fields" subtitle={`${fieldName} field`} footer={footer}>
      <div className="space-y-6">
        <InputField label="Field name" value={name} onChange={e => setName(e.target.value)} />
        <div>
          <p className="text-sm text-gray-500">{fieldDescription}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Formatting</h4>
          <RatingSelector rating={rating} setRating={setRating} />
        </div>
      </div>
    </DrawerPanel>
  );
};

export default EditFieldPanel;
