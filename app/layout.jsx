import "./globals.css";

export const metadata = {
  title: "Pine Marketplace",
  description: "Conversational marketplace",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display&family=Cormorant+Garamond&family=DM+Sans&display=swap"
          rel="stylesheet"
        />
      </head>

      <body>
        {children}
      </body>
    </html>
  );
}