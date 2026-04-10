import Navbar from "./Navbar";

const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-transparent text-ss-text">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ss-highlight focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ss-bg"
      >
        Skip to main content
      </a>
      <Navbar />
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {children}
      </main>
    </div>
  );
};

export default AppShell;
