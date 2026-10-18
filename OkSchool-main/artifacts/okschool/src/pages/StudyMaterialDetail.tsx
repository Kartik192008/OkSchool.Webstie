import { useEffect, useState, useCallback } from "react";
import { useParams } from "wouter";
import { useSEO, documentUrl } from "@/lib/seo";
import { Download, FileText, Lock, BookOpen, X, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  useGetDocument,
  getGetDocumentQueryKey,
  useRecordDocumentView,
  useRecordDocumentDownload,
  useListDocuments,
  getListDocumentsQueryKey,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE } from "@/lib/api";

export function StudyMaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const docId = parseInt(id ?? "0", 10);
  const { toast } = useToast();

  const proxyFileUrl = (type: "pdf" | "word" | "thumbnail") =>
    `${API_BASE}/api/documents/${docId}/download?type=${type}`;

  const [showWordModal, setShowWordModal] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [paying, setPaying] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  const { data: doc, isLoading } = useGetDocument(docId, {
    query: { enabled: !!docId, queryKey: getGetDocumentQueryKey(docId) },
  });

  // Load Google AdSense script
  useEffect(() => {
    if (!document.getElementById("google-ad-script")) {
      const s = document.createElement("script");
      s.id = "google-ad-script";
      s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      s.async = true;
      document.head.appendChild(s);
    }
  }, []);

  // Fetch similar documents from same category
  const { data: similarDocs } = useListDocuments(
    doc ? { category: doc.category } : undefined,
    {
      query: {
        enabled: !!doc?.category,
        staleTime: 5 * 60 * 1000,
      },
    }
  );

  const similarDocuments = similarDocs
    ? similarDocs.filter((d) => d.id !== docId).slice(0, 10)
    : [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4 max-w-3xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex items-center justify-center mb-4">
          <X className="h-16 w-16 text-muted-foreground/40" />
        </div>
        <h2 className="font-serif text-2xl font-bold">Document not found</h2>
        <p className="text-muted-foreground mt-4">The document you are looking for does not exist.</p>
        <Link href="/">
          <Button variant="outline">Back to Home</Button>
        </Link>
      </div>
    );
  }

  useSEO({
    title: doc.title,
    description: doc
      ? `${doc.description} - free PDF download for students on OkSchool. Category: ${doc.category ? doc.category.replace(/-/g, " ") : "General"}.`
      : "Download free notes, projects and question papers on OkSchool.",
    path: doc ? documentUrl(doc.id, doc.title) : `/study-material/${docId}`,
    image: doc?.thumbnailUrl || undefined,
    type: "article",
    noindex: !doc,
    jsonLd: doc
      ? {
          "@context": "https://schema.org",
          "@type": "LearningResource",
          name: doc.title,
          description: doc.description || doc.title,
          educationalLevel: "Class 10-12",
          learningResourceType: doc.category ? doc.category.replace(/-/g, " ") : "General",
          isAccessibleForFree: !!doc.isFree,
          inLanguage: "en",
          url: `https://okschool-s.onrender.com${documentUrl(doc.id, doc.title)}`,
          provider: {
            "@type": "Organization",
            name: "OkSchool",
            url: "https://okschool-s.onrender.com",
          },
        }
      : undefined,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Top Ad Box */}
        <div className="mt-6 mb-8">
          <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client="ca-pub-0000000000000000" data-ad-slot="0000000000" data-ad-format="auto" data-full-width-responsive="true"></ins>
        </div>

        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-serif text-3xl font-bold leading-tight">{doc.title}</h1>
              <span className="badge bg-muted px-3 py-1 text-sm">{doc.category ? doc.category.replace(/-/g, " ") : "General"}</span>
            </div>
            <p className="text-muted-foreground mb-6 line-clamp-2">{doc.description || doc.title}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              <span className="badge bg-muted px-3 py-1 text-sm">{doc.subject || "General"}</span>
              <span className="badge bg-muted px-3 py-1 text-sm">{doc.fileType || "PDF"}</span>
              <span className="badge bg-muted px-3 py-1 text-sm">
                {doc.isFree ? "Free" : `₹${doc.price}`}
              </span>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="font-semibold text-lg">{doc.title}</span>
              </div>
              <div className="flex gap-4">
                <Button
                  className="flex-1 py-4 text-lg"
                  onClick={() => {
                    window.location.href = proxyFileUrl("pdf");
                  }}
                  disabled={!doc.isFree && !hasPaid}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 py-4 text-lg"
                  onClick={() => setShowWordModal(true)}
                  disabled={!doc.isFree && !hasPaid}
                >
                  Download Word
                </Button>
              </div>
            </div>

            {/* Similar Documents - Horizontal Scroll */}
            {similarDocuments.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-2xl font-bold mb-3">Similar Documents</h3>
                <p className="text-muted-foreground text-sm mb-3">More from {(doc.category ? doc.category.replace(/-/g, " ") : "General")}</p>
                <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4">
                  {similarDocuments.map((d) => (
                    <Link key={d.id} href={documentUrl(d.id, d.title)} className="flex-shrink-0 w-72 cursor-pointer">
                      <div className="bg-card border border-card-border rounded-xl p-4 hover:shadow-md transition-shadow h-full flex flex-col">
                        {d.thumbnailUrl && (
                          <img src={d.thumbnailUrl} alt={d.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                        )}
                        {!d.thumbnailUrl && (
                          <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center mb-3">
                            <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                          </div>
                        )}
                        <h4 className="font-medium line-clamp-2 mb-2 text-sm leading-snug">{d.title}</h4>
                        <div className="flex items-center justify-between mt-auto">
<Badge variant="outline" className="text-[10px]">{d.category ? d.category.replace(/-/g, " ") : "General"}</Badge>
                        <span className="text-[10px] text-muted-foreground uppercase">{d.fileType || "PDF"}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Ad */}
          <div className="hidden md:block w-96 shrink-0 mt-6">
            <div className="sticky top-24">
              <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client="ca-pub-0000000000000000" data-ad-slot="0000000001" data-ad-format="auto" data-full-width-responsive="true"></ins>
            </div>
          </div>
        </div>

        {/* Bottom Ad Box */}
        <div className="mt-12 mb-8">
          <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client="ca-pub-0000000000000000" data-ad-slot="0000000002" data-ad-format="auto" data-full-width-responsive="true"></ins>
        </div>

        {/* Word Modal */}
        <Dialog open={showWordModal} onOpenChange={setShowWordModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Purchase Word File
              </DialogTitle>
              <DialogDescription>
                Download the editable Word version of this document.
              </DialogDescription>
            </DialogHeader>
            <div className="py-6 flex items-center justify-center">
              <span className="animate-pulse">Loading payment...</span>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowWordModal(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Modal */}
        <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Payment Successful!
              </DialogTitle>
              <DialogDescription>
                You can now download the Word file.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowSuccessModal(false)}>
                <Download className="h-4 w-4 mr-2" />
                Download Word
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
