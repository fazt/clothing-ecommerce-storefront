import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-ink text-center text-[14px] py-2 px-4">
      <p className="text-[color:var(--bg)]">
        Sign up and get 20% off on your first order.{" "}
        <Link
          href="/register"
          className="font-semibold underline underline-offset-2"
        >
          Sign Up Now
        </Link>
      </p>
    </div>
  );
}
