import { UserActivity } from '../types';

let activityStore: UserActivity[] = [];

// In a real app, this would be a more robust user ID.
const CURRENT_USER_ID = 'user1'; // Corresponds to Maria Garcia

/**
 * Logs a user's interaction with a case.
 * If an activity record for this user/case combo exists, it updates it.
 * Otherwise, it creates a new one.
 */
export const logUserActivity = (
    userId: string,
    caseId: string,
    interactionType: UserActivity['interactionTypes'][0],
    lastAction: string
) => {
    const now = new Date().toISOString();
    const existingActivityIndex = activityStore.findIndex(
        act => act.userId === userId && act.caseId === caseId
    );

    if (existingActivityIndex > -1) {
        // Update existing activity
        const updatedActivity = { ...activityStore[existingActivityIndex] };
        updatedActivity.lastInteraction = now;
        updatedActivity.lastAction = lastAction;
        if (!updatedActivity.interactionTypes.includes(interactionType)) {
            updatedActivity.interactionTypes.push(interactionType);
        }
        activityStore[existingActivityIndex] = updatedActivity;
    } else {
        // Create new activity
        const newActivity: UserActivity = {
            userId,
            caseId,
            lastInteraction: now,
            interactionTypes: [interactionType],
            lastAction,
        };
        activityStore.push(newActivity);
    }
     console.log("User Activity Logged:", activityStore);
};

/**
 * Retrieves all activities for a given user, sorted by the most recent interaction.
 */
export const getActivitiesForUser = (userId: string): UserActivity[] => {
    return activityStore
        .filter(act => act.userId === userId)
        .sort((a, b) => new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime());
};
