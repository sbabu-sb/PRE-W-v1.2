import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
}

const Textarea: React.FC<TextareaProps> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-gray-600 mb-1 block">
            {label}
        </label>
        <textarea
            {...props}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm min-h-[90px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
        />
    </div>
);

export default Textarea;
