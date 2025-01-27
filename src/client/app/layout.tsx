import React from 'react';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <html>
        <body>
          <div>
            <header>
                <h1>Welcome to Battlegrounds Hero Guesser!</h1>
            </header>
            <main>{children}</main>
            <footer>
                <p>-------</p>
            </footer>
          </div>
        </body>
      </html>
    );
};

export default Layout;