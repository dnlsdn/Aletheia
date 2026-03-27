import './globals.css';

export const metadata = {
  title: 'Truth Engine',
  description: 'Advanced disinformation analysis system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
