import React from 'react';
import { List } from 'lucide-react';
import { CaseActivity } from '../../../../../types';
import ActivityItem from './ActivityItem';

interface ActivityTabProps {
  activities: CaseActivity[];
}

const ActivityTab: React.FC<ActivityTabProps> = ({ activities }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
            <List className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-semibold text-gray-700">No Activity Yet</h3>
            <p className="text-sm mt-1">All actions related to this case will be logged here.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                  isLastItem={index === activities.length - 1}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityTab;