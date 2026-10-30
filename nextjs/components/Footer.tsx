import { Logo } from "./Logo";

export default function Footer() {
    return (
        <footer className="footer sm:footer-horizontal bg-base-200 text-base-content items-center p-10">
            <aside className="grid-flow-col items-center">
                <blockquote className="pl-4 italic max-w-md text-left text-sm opacity-80">
                    "Blinded by the light..."
                    <span className="block not-italic text-xs font-semibold mt-1 opacity-60">— Manfred Mann's Earth Band</span>
                </blockquote>
            </aside>
            <nav className="grid-flow-col gap-4 md:place-self-center md:justify-self-end">
                <Logo className="h-8" />
            </nav>
        </footer>
    );
}