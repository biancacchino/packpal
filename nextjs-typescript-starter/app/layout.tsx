import './globals.css';

import { GeistSans } from 'geist/font/sans';
import ChatPiP from './components/ChatPiP';

let title = 'Packpal';
let description =
  'Smart, collaborative packing lists with real-time invites and AI suggestions.';

export const metadata = {
  title,
  description,
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  metadataBase: new URL('https://packpal.app'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={GeistSans.variable}>
        {children}
        {/* Global picture-in-picture chat overlay */}
        <ChatPiP />
      </body>
    </html>
  );
}
