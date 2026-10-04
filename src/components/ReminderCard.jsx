/** Peach reminder banner with the "Set Now" call to action (opens settings). */
export default function ReminderCard({ onSet }) {
  return (
    <section
      aria-label="Reminder"
      className="rounded-3xl bg-peach p-5 shadow-[0_14px_30px_-18px_rgba(90,46,30,0.35)] dark:bg-peach/25"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold text-charcoal dark:text-parchment">
            Set the reminder
          </h3>
          <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-cocoa/80 dark:text-taupe">
            Never miss your morning routine!
            <br />
            Set a reminder to stay on track
          </p>
          <button
            className="btn btn-primary mt-4 !min-h-0 h-11 px-6 text-sm"
            onClick={onSet}
          >
            Set Now
          </button>
        </div>
        <span className="animate-flame shrink-0 text-6xl" aria-hidden>
          🔔
        </span>
      </div>
    </section>
  )
}
