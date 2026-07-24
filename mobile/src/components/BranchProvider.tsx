import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, initAuthStore, subscribeAuth } from '../lib/auth';
import { useAuthStore } from '../store/authStore';

export interface Branch {
  id: string | number;
  name: string;
  isMainBranch?: boolean;
  address?: string;
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
        token = await initAuthStore();
      }

      if (!token) {
        console.warn('BranchProvider: No active session found.');
        setBranches([]);
        setSelectedBranchIdState(null);
        setIsLoadingBranches(false);
        return;
      }

      // 2. Fetch branches with explicit token header fallback
      const response = await apiFetch('/branches', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.warn('BranchProvider: Unauthorized response from /branches');
        setBranches([]);
        setSelectedBranchIdState(null);
        setIsLoadingBranches(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }

      const resData = await response.json();
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

      setBranches(branchList);

      if (branchList.length > 0) {
        let savedId: string | null = null;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          savedId = localStorage.getItem('selectedBranchId');
        }
        if (!savedId) {
          savedId = await AsyncStorage.getItem('selectedBranchId');
        }

        const exists = savedId
          ? branchList.some((b: Branch) => String(b.id) === String(savedId))
          : false;

        if (savedId && exists) {
          setSelectedBranchIdState(String(savedId));
        } else {
          const mainBranch = branchList.find((b: Branch) => b.isMainBranch);
          const defaultBranch = mainBranch || branchList[0];
          await setSelectedBranchId(defaultBranch.id);
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