export function FullPageLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status" aria-live="polite">
      <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-brand" aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}
