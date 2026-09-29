export default function Loader() {
    return (
      <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
        <span className="relative flex h-12 w-12 items-center justify-center">
          <span
            className="absolute inset-0 rounded-full bg-brand/20 blur-md"
            aria-hidden="true"
          />
          <span
            className="relative h-10 w-10 animate-spin rounded-full border-[3px] border-brand/25 border-t-brand"
            aria-hidden="true"
          />
        </span>
        <span className="sr-only">Loading</span>
      </div>
    );
  }