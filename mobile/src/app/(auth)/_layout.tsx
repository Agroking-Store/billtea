import { Stack } from 'expo-router';
import { BranchProvider } from '@/components/BranchProvider';
export default function AuthLayout() {
  return (
    <BranchProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
    </Stack>
    </BranchProvider>
  );
}
