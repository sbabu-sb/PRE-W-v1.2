import React from 'react';
import { Check, Lock, ChevronDown } from 'lucide-react';

interface SmartStepperSectionProps {
    stepNumber: number;
    title: string;
    isActive: boolean;
    isCompleted: boolean;
    isLocked: boolean;
    onHeaderClick: () => void;
    children: React.ReactNode;
}

const SmartStepperSection: React.FC<SmartStepperSectionProps> = ({
    stepNumber,
    title,
    isActive,
    isCompleted,
    isLocked,
    onHeaderClick,
    children
}) => {
    const getIcon = () => {
        if (isLocked) return <Lock className="h-5 w-5 text-gray-400" />;
        if (isCompleted) return <Check className="h-5 w-5 text-white" />;
        return <span className="font-bold text-blue-600">{stepNumber}</span>;
    };

    const getHeaderClasses = () => {
        if (isLocked) return 'bg-gray-50 text-gray-400 cursor-not-allowed';
        if (isActive) return 'bg-white text-gray-800';
        return 'bg-gray-100 text-gray-600 hover:bg-white cursor-pointer';
    };

    const getIconBgClasses = () => {
        if (isLocked) return 'bg-gray-200';
        if (isCompleted) return 'bg-green-500';
        return 'bg-blue-100';
    };

    return (
        <div className={`border rounded-lg transition-all duration-300 ${isActive ? 'border-blue-300 shadow-lg' : 'border-gray-200'}`}>
            <button
                type="button"
                onClick={onHeaderClick}
                disabled={isLocked}
                className={`w-full flex items-center justify-between p-4 rounded-t-lg ${getHeaderClasses()} ${!isActive && 'rounded-b-lg'}`}
                aria-expanded={isActive}
            >
                <div className="flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${getIconBgClasses()}`}>
                        {getIcon()}
                    </div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                </div>
                {!isLocked && (
                     <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`} />
                )}
            </button>
            {isActive && (
                <div className="p-6 bg-white rounded-b-lg border-t border-gray-200 animate-fade-in">
                    {children}
                </div>
            )}
        </div>
    );
};

export default SmartStepperSection;
