import Card from "../ui/Card";

const AuthSplitLayout = ({
  title,
  subtitle,
  mediaTitle,
  mediaDescription,
  imageSrc,
  children,
  footer,
}) => {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-8 sm:px-8 lg:px-12 xl:px-16">
        <Card elevated className="w-full max-w-xl border-ss-border/85 bg-ss-surface/30 p-8 sm:p-10">
          <header className="mb-8 space-y-3 text-left">
            <h1 className="text-3xl font-bold tracking-tight text-ss-highlight sm:text-4xl">{title}</h1>
            <p className="text-sm leading-relaxed text-ss-neutral-300">{subtitle}</p>
          </header>

          {children}

          {footer ? <footer className="mt-8">{footer}</footer> : null}
        </Card>
      </section>

      <aside className="relative hidden overflow-hidden lg:block">
        <img
          src={imageSrc}
          alt="Study workspace illustration"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-ss-bg/80 via-ss-bg/60 to-ss-surface/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(88,212,188,0.22),transparent_45%)]" />
        <div className="absolute bottom-0 left-0 right-0 p-10 xl:p-14">
          <h2 className="text-3xl font-semibold leading-tight text-ss-neutral-100 xl:text-4xl">
            {mediaTitle}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ss-neutral-200">
            {mediaDescription}
          </p>
        </div>
      </aside>
    </main>
  );
};

export default AuthSplitLayout;
