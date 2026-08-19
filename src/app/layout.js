import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AppLayout from '@/components/AppLayout';

export const metadata = {
  title: 'BorrowHub - ระบบยืม-คืนของมหาวิทยาลัย',
  description: 'แอพสำหรับยืม-คืนอุปกรณ์และของใช้ในมหาวิทยาลัย ยืมง่าย คืนสะดวก',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F7F9' },
    { media: '(prefers-color-scheme: dark)', color: '#3F4E65' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
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
