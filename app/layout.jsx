import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'SoarHigh Tracker',
  description: 'Company Group Activity & Attendance Tracker',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-100 text-gray-800`}>
        {children}
      </body>
    </html>
  );
}
