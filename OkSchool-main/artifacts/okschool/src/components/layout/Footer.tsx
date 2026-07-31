import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <img src="favicon.png" alt="OkSchool" className="h-9 w-9" />
              <span className="font-serif font-bold text-xl tracking-tight text-foreground">OkSchool</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              Your trustworthy study-material hub. Find the best notes, practicals, and mock tests organized perfectly for Indian students.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Legal</h3>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund-cancellation" className="hover:text-primary transition-colors">Refund & Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} OkSchool. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Made with ❤️ for Indian Students.</p>
        </div>
      </div>
    </footer>
  );
}
