import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Download, ArrowLeft, FileText, Lock, BookOpen, X } from "lucide-react";
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
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

export function StudyMaterialDetail() {
  const { id } = useParams<{ id: string }>();
  const docId = parseInt(id ?? "0", 10);
  const { toast } = useToast();

  const proxyFileUrl = (type: "pdf" | "word" | "thumbnail") =>
    `/api/documents/${docId}/download?type=${type}`;

  const [iframeFailed, setIframeFailed] = useState(false);
  const [showWordModal, setShowWordModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: doc, isLoading } = useGetDocument(docId, {
    query: { enabled: !!docId, queryKey: getGetDocumentQueryKey(docId) },
  });

  const recordView = useRecordDocumentView();
  const recordDownload = useRecordDocumentDownload();

  useEffect(() => {
    if (docId) recordView.mutate({ id: docId });
  }, [docId]);

  useEffect(() => {
    if (!doc?.fileUrl) {
      setPdfBlobUrl(null);
      return;
    }
    setIframeFailed(false);
    setPdfLoading(true);
    let revoked = false;
    fetch(proxyFileUrl("pdf"))
      .then(async (res) => {
        if (!res.ok) throw new Error("failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        if (!revoked) {
          setPdfBlobUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch(() => {
        setIframeFailed(true);
        setPdfBlobUrl(null);
      })
      .finally(() => {
        if (!revoked) setPdfLoading(false);
      });
    return () => {
      revoked = true;
    };
  }, [doc?.fileUrl, docId]);

  const handleDownload = async (fileType: "pdf" | "word") => {
    if (!doc) return;
    recordDownload.mutate({ id: docId, data: { fileType } });
    const url = proxyFileUrl(fileType);
    if (!url) {
      toast({ title: "File not available", description: "The requested file URL is missing." });
      return;
    }
    try {
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) throw new Error("fetch_failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${doc.title}${fileType === "pdf" ? ".pdf" : ".docx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      toast({ title: `${fileType.toUpperCase()} download started`, description: doc.title });
    } catch (e) {
      window.open(url, "_blank");
      toast({ title: `${fileType.toUpperCase()} opened in new tab`, description: doc.title });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-96 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold">Document not found</h2>
        <Link href="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  const hasWord = !!doc.wordFileUrl;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link href="/" data-testid="link-back">
        <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="bg-muted/50 border-b px-4 py-2 flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="truncate">{doc.title}</span>
            </div>
            <div className="h-[560px] bg-black/5" data-testid="document-preview">
              {pdfLoading && !pdfBlobUrl && !iframeFailed ? (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-3 text-muted-foreground/30 animate-pulse" />
                    <p className="text-sm">Loading preview...</p>
                  </div>
                </div>
              ) : pdfBlobUrl && !iframeFailed ? (
                <iframe
                  src={pdfBlobUrl}
                  title={doc.title}
                  className="w-full h-full"
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-sm mb-3">Preview unavailable</p>
                    {doc.fileUrl && (
                      <Button
                        variant="outline"
                        onClick={() => window.open(proxyFileUrl("pdf"), "_blank")}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Open PDF
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-card-border rounded-xl p-5">
            <h1 className="font-serif text-lg font-bold text-foreground leading-snug mb-3">{doc.title}</h1>
            <p className="text-sm text-muted-foreground mb-4">{doc.description}</p>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="outline" className="capitalize text-xs">{doc.category.replace(/-/g, " ")}</Badge>
              <Badge className={doc.isFree ? "bg-green-100 text-green-700 border-green-200" : "bg-primary text-primary-foreground"}>
                {doc.isFree ? "FREE" : `₹${doc.price ?? 20}`}
              </Badge>
            </div>

             <div className="space-y-3">
               <Button
                 className="w-full"
                 onClick={() => handleDownload("pdf")}
                 data-testid="button-download-pdf"
               >
                 <Download className="h-4 w-4 mr-2" />
                 Download PDF
               </Button>

               <Button
                 className="w-full"
                 variant="outline"
                 onClick={() => setShowWordModal(true)}
                 data-testid="button-download-word"
               >
                 <Lock className="h-4 w-4 mr-2" />
                 ₹{doc.price ?? 20} (Word Locked)
               </Button>
             </div>

             <Dialog open={showWordModal} onOpenChange={setShowWordModal}>
               <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                   <DialogTitle className="flex items-center gap-2">
                     <Lock className="h-5 w-5" />
                     Word File Locked
                   </DialogTitle>
                   <DialogDescription>
                     Payments will be available soon. This Word file is currently locked.
                   </DialogDescription>
                 </DialogHeader>
                 <div className="flex justify-end">
                   <Button variant="outline" onClick={() => setShowWordModal(false)}>
                     <X className="h-4 w-4 mr-2" />
                     Close
                   </Button>
                 </div>
               </DialogContent>
             </Dialog>
          </div>

          <div className="bg-card border border-card-border rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between text-muted-foreground">
              <span>File Type</span><span className="font-medium text-foreground uppercase">{doc.fileType}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Category</span><span className="font-medium text-foreground capitalize">{doc.category.replace(/-/g, " ")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}