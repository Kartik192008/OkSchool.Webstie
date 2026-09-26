import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Link } from "wouter";
import { API_BASE } from "@/lib/api";
import { Boxes } from "@/components/ui/background-boxes";
import { GooeyInput } from "@/components/ui/gooey-input";

const CATEGORIES = [
  { id: "notes", label: "Notes" },
  { id: "investigatory-projects", label: "Investigatory Projects" },
  { id: "question-papers", label: "Question Papers" },
  { id: "free-book-pdfs", label: "Free Book PDFs" },
  { id: "practical-files-class-12", label: "Practical Files Class 12" },
] as const;

export function Home() {
  const [activeTab, setActiveTab] = useState("notes");
  const [searchVal, setSearchVal] = useState("");
  const [docs, setDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const homeTimerRef = useRef<number | null>(null);

  const [thumbnailBlobs, setThumbnailBlobs] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchDocuments();
  }, [activeTab]);

  useEffect(() => {
    docs.forEach((doc) => {
      const thumbnailUrl = (doc as any).thumbnail_url;
      if (!thumbnailUrl || thumbnailBlobs[doc.id]) return;
      fetch(thumbnailUrl)
        .then((res) => {
          if (!res.ok) throw new Error("failed");
          return res.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setThumbnailBlobs((prev) => ({ ...prev, [doc.id]: url }));
        })
        .catch(() => {});
    });
  }, [docs]);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('category', activeTab);
      
      if (error) throw error;
      setDocs(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-background px-4 py-16 text-center">
        <div className="absolute inset-0">
          <Boxes />
        </div>
        <div className="absolute inset-0 bg-background/70 dark:bg-background/80" />
        <div className="relative z-10">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground leading-tight mb-4">
            Free notes &amp; projects<br />for every student.
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Download PDF free. Get editable Word file for just ₹20–₹30.
          </p>
          <div className="flex justify-center">
            <div className="relative w-full max-w-lg">
              <GooeyInput
                value={searchVal}
                onValueChange={(value) => {
                  setSearchVal(value);
                  if (homeTimerRef.current) window.clearTimeout(homeTimerRef.current);
                  homeTimerRef.current = window.setTimeout(() => {
                    const trimmed = value.trim();
                    if (trimmed) {
                      setLocation(`/search?q=${encodeURIComponent(trimmed)}`);
                    }
                  }, 400);
                }}
                placeholder="Search notes, projects, papers..."
                className="bg-card"
                collapsedWidth={44}
                expandedWidth={280}
                expandedOffset={12}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tab navigation */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-16 z-40">
        <div className="container mx-auto overflow-x-auto">
          <div className="flex gap-2 whitespace-nowrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={`px-4 py-2 rounded-md border border-black bg-white text-black text-sm hover:shadow-[4px_4px_0px_0px_rgba(0,0,0)] transition duration-200 ${
                  activeTab === cat.id ? "shadow-[4px_4px_0px_0px_rgba(0,0,0)]" : ""
                }`}
                data-testid={`tab-${cat.id}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Document grid */}
      <section className="container mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg h-64 animate-pulse" />
            ))}
          </div>
        ) : !docs || docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="h-14 w-14 text-muted-foreground/40 mb-4" />
            <h3 className="font-serif text-xl font-medium text-foreground mb-1">
              No {CATEGORIES.find((c) => c.id === activeTab)?.label} yet
            </h3>
            <p className="text-muted-foreground text-sm">Documents will appear here once uploaded by the admin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {docs.map((doc) => (
              <Link href={`/study-material/${doc.id}`} key={doc.id} data-testid={`card-document-${doc.id}`}>
                <div className="group bg-card border border-card-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer h-full">
                  <div className="relative bg-muted aspect-[3/4] flex items-center justify-center">
                    {thumbnailBlobs[doc.id] ? (
                      <img
                        src={thumbnailBlobs[doc.id]}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (doc as any).thumbnail_url ? (
                      <img
                        src={(doc as any).thumbnail_url}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          setThumbnailBlobs((prev) => {
                            if (prev[doc.id]) return prev;
                            return { ...prev, [doc.id]: (doc as any).thumbnail_url };
                          });
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground/40" />
                    )}
                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${doc.isFree ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground"}`}>
                      {doc.isFree ? "FREE" : `₹${doc.price ?? ""}`}
                    </span>
                  </div>
                  <div className="p-3">
                    <Badge variant="outline" className="text-[10px] mb-1 capitalize">
                      {doc.category.replace(/-/g, " ")}
                    </Badge>
                    <p className="text-sm font-medium text-foreground line-clamp-2 transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{doc.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
