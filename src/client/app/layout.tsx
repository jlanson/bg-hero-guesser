import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <html>
        <body>
          <div>
            <header>
                <h1>My Next.js App</h1>
            </header>
            <main>{children}</main>
            <footer>
                <p>© 2023 My Next.js App</p>
            </footer>
          </div>
        </body>
      </html>
    );
};

export default Layout;