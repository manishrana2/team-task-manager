import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Task Manage',
  description: 'Project and task tracking for small teams',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">{children}</div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '14px',
            },
            success: {
              style: { background: '#e9f8f0', color: '#087443', border: '1px solid #a6f4c5' },
            },
            error: {
              style: { background: '#fff0ed', color: '#c03221', border: '1px solid #ffd4ce' },
            },
          }}
        />
      </body>
    </html>
  );
}
