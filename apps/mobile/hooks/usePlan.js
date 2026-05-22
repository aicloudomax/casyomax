import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import ApiHelper from '../services/ApiHelper';

/**
 * Custom hook to manage and provide user subscription plan and feature usage.
 */
export const usePlan = () => {
    const [plan, setPlan] = useState('free');
    const [usage, setUsage] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlanDetails = useCallback(async () => {
        try {
            // Initial plan from local storage (faster UI)
            const userDataStr = await SecureStore.getItemAsync('userData');
            if (userDataStr) {
                const userData = JSON.parse(userDataStr);
                setPlan(userData.plan || 'free');
            }

            // Fresh data from API
            const response = await ApiHelper.get('/subscription/my-plan');
            if (response && response.subscription) {
                setPlan(response.subscription.plan);
                setUsage(response.usage || []);

                // Keep local storage in sync
                const updatedUser = JSON.parse(userDataStr || '{}');
                updatedUser.plan = response.subscription.plan;
                await SecureStore.setItemAsync('userData', JSON.stringify(updatedUser));
            }
        } catch (error) {
            console.error("Error fetching plan details:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPlanDetails();
    }, [fetchPlanDetails]);

    /**
     * Check if a feature is allowed based on current usage.
     * @param {string} feature - 'ai_chat' or 'voice_chat'
     */
    const getRemainingUsage = (feature) => {
        if (plan === 'premium') return Infinity;

        const limits = {
            ai_chat: 10,
            voice_chat: 5
        };

        const featureUsage = usage.find(u => u.feature === feature);
        const count = featureUsage ? featureUsage.count : 0;
        const limit = limits[feature] || 0;

        return Math.max(0, limit - count);
    };

    const isFeatureLocked = (feature) => {
        if (plan === 'premium') return false;
        // Email features are always premium
        if (feature === 'email_sending' || feature === 'email_scheduling') return true;

        return getRemainingUsage(feature) <= 0;
    };

    return {
        plan,
        usage,
        loading,
        getRemainingUsage,
        isFeatureLocked,
        refreshPlan: fetchPlanDetails
    };
};
