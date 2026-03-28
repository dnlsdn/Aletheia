import './globals.css';

export const metadata = {
  title: 'Alethe-ia',
  description: 'Truth Engine: Disinformation analysis system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
