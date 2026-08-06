import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/authStore';
import { subscribeAuth } from '../lib/auth';
import { getStorageItemAsync } from '../utils/storage';
import { TOKEN_KEYS } from '../constants/keys';
import { apiClient } from '../api/client';

export interface Branch {
  id: string | number;
  name: string;
  isMainBranch?: boolean;
  address?: string;
  isActive?: boolean;
}

interface BranchContextType {
  branches: Branch[];
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | number) => Promise<void>;
  isLoadingBranches: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);

  const setSelectedBranchId = async (id: string | number) => {
    const stringId = String(id);
    setSelectedBranchIdState(stringId);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        localStorage.setItem('selectedBranchId', stringId);
      }
      await AsyncStorage.setItem('selectedBranchId', stringId);
    } catch (e) {
      console.error('BranchProvider: Error saving selected branch ID:', e);
    }
  };

  const fetchBranches = useCallback(async () => {
    setIsLoadingBranches(true);
    try {
      // 1. Try retrieving token from Zustand auth store first, then fallback to persistent storage
      const authState = useAuthStore.getState() as any;
      let token = authState?.token || authState?.accessToken;

      if (!token) {
        token = await getStorageItemAsync(TOKEN_KEYS.ACCESS);
      }

      if (!token) {
        console.log('BranchProvider: No token found. Branches empty.');
        setBranches([]);
        setSelectedBranchIdState(null);
        setIsLoadingBranches(false);
        return;
      }

      console.log('BranchProvider: Fetching with token:', token.slice(0, 10) + '...');
      
      // 2. Fetch branches using the global axios client
      const response = await apiClient.get('/branches');
      console.log('BranchProvider: Response Status:', response.status);

      if (response.status === 401) {
        console.warn('BranchProvider: Unauthorized response from /branches');
        setBranches([]);
        setSelectedBranchIdState(null);
        setIsLoadingBranches(false);
        return;
      }

      let resData = response?.data;

      if (!resData) {
        const fallbackRes = await apiClient.get('/branches?all=true');
        resData = fallbackRes?.data;
      }

      console.log('Branch Response Received:', resData);

      // Robust extraction matching all standard backend response formats
      let branchList: Branch[] = [];

      if (Array.isArray(resData)) {
        branchList = resData;
      } else if (resData?.data && Array.isArray(resData.data)) {
        branchList = resData.data;
      } else if (resData?.branches && Array.isArray(resData.branches)) {
        branchList = resData.branches;
      } else if (resData?.data?.branches && Array.isArray(resData.data.branches)) {
        branchList = resData.data.branches;
      }

      // Filter active branches for selection
      const activeBranchList = branchList.filter((b: any) => b.isActive !== false);
      const targetList = activeBranchList.length > 0 ? activeBranchList : branchList;
      setBranches(targetList);

      if (targetList.length > 0) {
        let savedId: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          savedId = localStorage.getItem('selectedBranchId');
        }
        if (!savedId) {
          savedId = await AsyncStorage.getItem('selectedBranchId');
        }

        const exists = savedId
          ? targetList.some((b: Branch) => String(b.id) === String(savedId))
          : false;

        if (savedId && exists) {
          setSelectedBranchIdState(String(savedId));
        } else {
          const mainBranch = targetList.find((b: Branch) => b.isMainBranch);
          const defaultBranch = mainBranch || targetList[0];
          if (defaultBranch && defaultBranch.id != null) {
            await setSelectedBranchId(defaultBranch.id);
          }
        }
      } else {
        setSelectedBranchIdState(null);
      }
    } catch (error) {
      console.error('BranchProvider Error:', error);
      setBranches([]);
      setSelectedBranchIdState(null);
    } finally {
      setIsLoadingBranches(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();

    const unsubscribe = subscribeAuth((loggedIn) => {
      if (loggedIn) {
        fetchBranches();
      } else {
        setBranches([]);
        setSelectedBranchIdState(null);
        setIsLoadingBranches(false);
      }
    });

    return () => unsubscribe();
  }, [fetchBranches]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        isLoadingBranches,
        refreshBranches: fetchBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
};