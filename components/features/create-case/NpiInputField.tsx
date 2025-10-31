import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import InputField from '../../common/InputField';

interface NpiInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    isValid: boolean | null;
}

const NpiInputField: React.FC<NpiInputFieldProps> = ({ label, isValid, ...props }) => {
    return (
        <div>
            <div className="relative">
                <InputField
                    label={label}
                    maxLength={10}
                    {...props}
                />
                <div className="absolute top-8 right-3 flex items-center">
                    {isValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {isValid === false && <AlertCircle className="h-5 w-5 text-red-500" />}
                </div>
            </div>
            <div className="h-4 mt-1 text-xs px-1">
                 {isValid === true && <p className="text-green-600">Valid NPI Format</p>}
                 {isValid === false && <p className="text-red-500">Invalid NPI Format</p>}
            </div>
        </div>
    );
};

export default NpiInputField;
