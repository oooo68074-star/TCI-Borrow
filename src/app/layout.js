import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'BorrowHub - ระบบยืม-คืนของมหาวิทยาลัย',
  description: 'แอพสำหรับยืม-คืนอุปกรณ์และของใช้ในมหาวิทยาลัย ยืมง่าย คืนสะดวก',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <DataProvider>
              <AppLayout>
                {children}
              </AppLayout>
            </DataProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
