import { AuthProvider } from '../context/AuthContext';
import AppNavigator from '../navigation/AppNavigator';

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
