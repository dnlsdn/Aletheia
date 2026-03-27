import './globals.css';

export const metadata = {
  title: 'Aletheia',
  description: 'Truth Engine: Advanced disinformation analysis system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
